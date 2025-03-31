"use client"; // Ensure this is a client-side component

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { SocketProvider } from "./SocketProvider";

const queryClient = new QueryClient();

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SocketProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SocketProvider>
    </SessionProvider>
  );
};

export default SessionWrapper;
