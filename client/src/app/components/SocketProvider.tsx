"use client";

import socket, {
  connectSocket,
  sfuSocket,
  connectSfuSocket,
} from "@/lib/socket";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface SocketContextType {
  transport: string;
  isConnected: boolean;
  sfuTransport: string;
  sfuIsConnected: boolean;
  initiateSfuSocket: () => void;
  disconnectSfuSocket: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [sfuIsConnected, setSfeIsConnected] = useState(false);
  const [sfuTransport, setSfeTransport] = useState("N/A");
  const router = useRouter();
  const path = usePathname();

  const { status, data } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" && path !== "auth") {
      // Redirect to login if the user is not authenticated
      router.push("/auth");
    }
  }, [status, router, path]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }
    const initiateSocketConnection = async () => {
      await connectSocket(); // Use your existing connection logic
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
    };

    initiateSocketConnection();
    initiateSfuSocket()
    
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
      sfuSocket.off("connect");
      sfuSocket.off("disconnect");
      sfuSocket.disconnect();
    };
  }, [status, data]);

  const initiateSfuSocket = async () => {
    function onConnect() {
      setSfeIsConnected(true);
      setSfeTransport(sfuSocket.io.engine.transport.name);
      sfuSocket.io.engine.on("upgrade", (transport) => {
        setSfeTransport(transport.name);
      });
    }

    function onDisconnect() {
      setSfeIsConnected(false);
      setSfeTransport("N/A");
    }
    await connectSfuSocket();
    sfuSocket.on("connect", onConnect);
    sfuSocket.on("disconnect", onDisconnect);
  };

  const disconnectSfuSocket = async () => {
    sfuSocket.disconnect();
  };

  return (
    <SocketContext.Provider
      value={{
        transport,
        isConnected,
        sfuTransport,
        sfuIsConnected,
        initiateSfuSocket,
        disconnectSfuSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
