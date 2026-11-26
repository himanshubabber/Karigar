import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const getSocketBaseUrl = () => {
  // 1. Explicit dedicated WebSocket server (e.g., Render, Railway, EC2)
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl) return explicitSocketUrl;

  // 2. Local development
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000";
  }

  // 3. Fallback to API URL origin
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      return parsed.origin;
    } catch {
      return envUrl;
    }
  }

  return "https://karigarbackend.vercel.app";
};

const isVercelHost = (url) => {
  return typeof url === "string" && (url.includes("vercel.app") || url.includes("vercel.com"));
};

const getActiveUserAuth = () => {
  try {
    const rawCustomer = localStorage.getItem("karigar_customer");
    if (rawCustomer) {
      const parsed = JSON.parse(rawCustomer);
      return { userId: parsed._id, role: "customer" };
    }
    const rawWorker = localStorage.getItem("karigar_worker");
    if (rawWorker) {
      const parsed = JSON.parse(rawWorker);
      return {
        userId: parsed._id,
        role: "worker",
        categories: parsed.workingCategory || [],
      };
    }
    const rawAdmin = localStorage.getItem("karigar_admin");
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      return { userId: parsed._id, role: "admin" };
    }
  } catch {
    // ignore parse errors
  }
  return {};
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    const baseUrl = getSocketBaseUrl();

    // Vercel Serverless Functions do not support persistent WebSockets and return HTTP 308.
    // If running in production against Vercel without a dedicated socket server, operate in REST mode.
    if (!explicitSocketUrl && isVercelHost(baseUrl)) {
      console.info(
        "[Karigar Socket] Notice: Production backend is on Vercel Serverless (which does not support persistent WebSockets). Operating smoothly in REST polling mode. To enable live WebSockets, point VITE_SOCKET_URL to a persistent server (e.g., Render/Railway)."
      );
      return;
    }

    const userAuth = getActiveUserAuth();

    const socketInstance = io(baseUrl, {
      auth: userAuth,
      transports: ["polling", "websocket"], // Polling first then upgrade, avoiding immediate 308 handshake failure
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
      withCredentials: true,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      const auth = getActiveUserAuth();
      if (auth.userId) {
        socketInstance.emit("register_user", auth);
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (err) => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Room management helpers
  const joinRequestRoom = useCallback((serviceRequestId) => {
    if (socketRef.current && serviceRequestId) {
      socketRef.current.emit("join_request_room", { serviceRequestId });
    }
  }, []);

  const leaveRequestRoom = useCallback((serviceRequestId) => {
    if (socketRef.current && serviceRequestId) {
      socketRef.current.emit("leave_request_room", { serviceRequestId });
    }
  }, []);

  const emitWorkerLocation = useCallback((locationData) => {
    if (socketRef.current && locationData) {
      socketRef.current.emit("worker_location_update", locationData);
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRequestRoom,
        leaveRequestRoom,
        emitWorkerLocation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      joinRequestRoom: () => {},
      leaveRequestRoom: () => {},
      emitWorkerLocation: () => {},
    };
  }
  return context;
};

export default SocketContext;
