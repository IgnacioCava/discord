import socket from "@/lib/socket";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const useTypingIndicator = () => {
  const [typingUsers, setTypingUsers] = useState<{id: string, name: string}[]>([]);
  const {data: session} = useSession()

  useEffect(() => {
    if(!session) return
    socket.on("user-typing-status", (users: typeof typingUsers) => {
      setTypingUsers(users.filter(user => user.id !== session.user.id));
    });
    return () => {
      socket.off("user-typing-status");
    };
  }, [session]);

  return typingUsers;
};
