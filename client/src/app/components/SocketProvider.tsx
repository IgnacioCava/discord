"use client";

import socket, { connectSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

interface SocketContextType {
  transport: string;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
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
    
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [status, data]);

  return (
    <SocketContext.Provider value={{ transport, isConnected }}>
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
