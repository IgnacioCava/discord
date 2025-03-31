import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Message } from "@/store/types";
import { useMessageStore } from "@/store/messageSlice";
import socket from "@/lib/socket";
import { useRoomStore } from "@/store/roomSlice";

export const useMessageListener = () => {
  const { data: session } = useSession();
  const { currentRoom } = useRoomStore();
  const { updateMessage, receiveMessage } = useMessageStore();

  useEffect(() => {
    // If socket is connected, attach listeners immediately
    if (!currentRoom?.id) return;
    if (!session?.user.id) return;
    // if (!socket.connected) {
    //   socket.on("connect", () => attachListeners());
    // }
    const handleMessage = (messageData: Omit<Message, "status">) => {
      receiveMessage(messageData.channelId, messageData);
    };

    const handleUpdateMessage = (messageData: Message) => {
      updateMessage(messageData.channelId, messageData);
    };

    const handleBackgroundMessage = (messageData: Message) => {
      receiveMessage(messageData.channelId, messageData);
    };

    const attachListeners = () => {
      //if (!socket.connected) return; // Only add listeners if connected

      socket.on("receive-message", handleMessage);
      socket.on("edit-message-incoming", handleUpdateMessage);
      socket.on("new-background-message", handleBackgroundMessage); // A message from a channel to which the user is not connected
      socket.on(`room-${currentRoom?.id}-notifications-test`, (messageData) => {
        console.log("update-message-error:", messageData);
      });
    };

    // Handle socket connection
    //if (socket.connected) {
    attachListeners();
    // } else {
    //   socket.on("connect", attachListeners); // Wait for the socket to connect before attaching listeners
    // }

    // Handle cleanup
    return () => {
      socket.off("receive-message", handleMessage);
      socket.off("edit-message-incoming", handleUpdateMessage);
      socket.off("new-background-message", handleBackgroundMessage);
      socket.off(`room-${currentRoom?.id}-notifications-test`);
    };
  }, [session, currentRoom?.id, receiveMessage, updateMessage]);
};
