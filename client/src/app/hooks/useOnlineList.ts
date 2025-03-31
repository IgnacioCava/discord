import socket from "@/lib/socket";
import { CurrentRoomState, useRoomStore } from "@/store/roomSlice";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const useOnlineList = () => {
  const [onlineUsers, setOnlineUsers] = useState<CurrentRoomState["members"]>(
    []
  );
  const { currentRoom } = useRoomStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (!currentRoom) return;
    if (!session) return;
    setOnlineUsers(currentRoom.members);
    const handleOnlineUsers = ({
      userId,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      setOnlineUsers((onlineUsers) =>
        onlineUsers.map((member) =>
          member.userId === userId ? { ...member, isOnline } : member
        )
      );
    };
    const removeSelf = () => {
      setOnlineUsers((onlineUsers) =>
        onlineUsers.map((member) =>
          member.userId === session.user.id
            ? { ...member, isOnline: false }
            : member
        )
      );
    };
    socket.on("update-online-users", handleOnlineUsers);
    socket.on("disconnect", removeSelf);

    return () => {
      socket.off("update-online-users", handleOnlineUsers);
      socket.off("disconnect", removeSelf);
    };
  }, [currentRoom, session]);

  return {
    onlineUsers: onlineUsers.filter((u) => u.isOnline),
    offlineUsers: onlineUsers.filter((u) => !u.isOnline),
  };
};
