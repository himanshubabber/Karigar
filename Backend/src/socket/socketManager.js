import { Server } from "socket.io";

let io = null;

const allowedOriginPatterns = [
  /^http:\/\/localhost:(5173|5174)$/,
  /^https:\/\/karigar.*\.vercel\.app$/,
];

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`WebSocket CORS blocked: ${origin}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    const { userId, role, categories } = socket.handshake.auth || socket.handshake.query || {};

    if (userId) {
      socket.join(`user_${userId.toString()}`);
    }

    if (role === "worker") {
      socket.join("workers_all");
      if (Array.isArray(categories)) {
        categories.forEach((cat) => {
          if (cat) {
            socket.join(`workers_${cat.toLowerCase().replace(/\s+/g, "_")}`);
          }
        });
      }
    } else if (role === "admin") {
      socket.join("admin_channel");
    }

    // Client registration event (if auth wasn't available at handshake)
    socket.on("register_user", ({ userId: regId, role: regRole, categories: regCats }) => {
      if (regId) {
        socket.join(`user_${regId.toString()}`);
      }
      if (regRole === "worker") {
        socket.join("workers_all");
        if (Array.isArray(regCats)) {
          regCats.forEach((cat) => {
            if (cat) {
              socket.join(`workers_${cat.toLowerCase().replace(/\s+/g, "_")}`);
            }
          });
        }
      } else if (regRole === "admin") {
        socket.join("admin_channel");
      }
    });

    // Join specific service request room (for customer, assigned worker, admin)
    socket.on("join_request_room", ({ serviceRequestId }) => {
      if (serviceRequestId) {
        const roomName = `request_${serviceRequestId.toString()}`;
        socket.join(roomName);
      }
    });

    // Leave service request room
    socket.on("leave_request_room", ({ serviceRequestId }) => {
      if (serviceRequestId) {
        const roomName = `request_${serviceRequestId.toString()}`;
        socket.leave(roomName);
      }
    });

    // Live worker GPS coordinates streaming over WebSocket
    socket.on("worker_location_update", ({ serviceRequestId, coordinates, workerId, heading, speed }) => {
      if (serviceRequestId && Array.isArray(coordinates) && coordinates.length === 2) {
        const payload = {
          serviceRequestId,
          workerId,
          coordinates, // [longitude, latitude]
          heading: heading || 0,
          speed: speed || 0,
          timestamp: new Date(),
        };
        // Broadcast to everyone in that service request room (customer map)
        socket.to(`request_${serviceRequestId.toString()}`).emit("worker_location_update", payload);
      }
    });

    socket.on("disconnect", (reason) => {
      // Clean disconnect handling
    });
  });

  return io;
};

export const getIO = () => io;

// Real-time Notification Emitter (to user private room)
export const emitNotification = (recipientId, notificationData) => {
  if (!io || !recipientId) return;
  io.to(`user_${recipientId.toString()}`).emit("new_notification", notificationData);
};

// Real-time Service Request Room Broadcaster
export const emitToServiceRequest = (serviceRequestId, eventName, payload) => {
  if (!io || !serviceRequestId) return;
  io.to(`request_${serviceRequestId.toString()}`).emit(eventName, payload);
};

// Real-time Worker Location Broadcaster (called from REST controller or socket)
export const emitWorkerLocation = (serviceRequestId, locationPayload) => {
  if (!io || !serviceRequestId) return;
  io.to(`request_${serviceRequestId.toString()}`).emit("worker_location_update", locationPayload);
};

// Real-time New Service Request Broadcast (to workers in that category + all workers)
export const emitNewServiceRequest = (serviceRequest) => {
  if (!io || !serviceRequest) return;
  if (serviceRequest.category) {
    const categoryRoom = `workers_${serviceRequest.category.toLowerCase().replace(/\s+/g, "_")}`;
    io.to(categoryRoom).emit("new_service_request", serviceRequest);
  }
  io.to("workers_all").emit("new_service_request", serviceRequest);
  io.to("admin_channel").emit("new_service_request", serviceRequest);
};

// Broadcast when a request is accepted so other workers' feeds remove it
export const emitRequestTaken = (serviceRequestId, workerId) => {
  if (!io || !serviceRequestId) return;
  io.to("workers_all").emit("service_request_taken", { serviceRequestId, workerId });
};

// Broadcast job status update (e.g. arrived, started work, completed)
export const emitJobStatusUpdate = (serviceRequestId, statusPayload) => {
  if (!io || !serviceRequestId) return;
  io.to(`request_${serviceRequestId.toString()}`).emit("job_status_update", {
    serviceRequestId,
    ...statusPayload,
    timestamp: new Date(),
  });
};

// Broadcast quote update (quote submitted, approved, or rejected)
export const emitQuoteUpdate = (serviceRequestId, quotePayload) => {
  if (!io || !serviceRequestId) return;
  io.to(`request_${serviceRequestId.toString()}`).emit("quote_update", {
    serviceRequestId,
    ...quotePayload,
    timestamp: new Date(),
  });
};

// Broadcast payment completed event
export const emitPaymentDone = (serviceRequestId, paymentPayload) => {
  if (!io || !serviceRequestId) return;
  io.to(`request_${serviceRequestId.toString()}`).emit("payment_completed", {
    serviceRequestId,
    ...paymentPayload,
    timestamp: new Date(),
  });
};
