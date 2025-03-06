import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

const useSocket = () => {
  const { data: session } = useSession();

  // If no session or token, do not initialize socket
  if (!session || !session.user?.id) {
    return null; // or handle differently, like returning a fallback or loading state
  }

  const socket = io(
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
    {
      auth: {
        token: session.user.id, // Pass the user ID or token to authenticate the socket connection
      },
    }
  );

  return socket;
};

export default useSocket;
