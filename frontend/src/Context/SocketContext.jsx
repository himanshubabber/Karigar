import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const getSocketBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    try {
      const parsed = new URL(envUrl);
      return parsed.origin;
    } catch {
      return envUrl;
    }
  }
  return typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://karigarbackend.vercel.app";
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
    const baseUrl = getSocketBaseUrl();
    const userAuth = getActiveUserAuth();

    const socketInstance = io(baseUrl, {
      auth: userAuth,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
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
