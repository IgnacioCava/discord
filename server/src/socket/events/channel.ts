import prisma from "@prisma";
import { Io, SocketServer } from "@socket/types";
import { editMessage, sendMessage } from "@controllers/messageController";
import {
  addUserToTypingList,
  clearTypingOnDisconnect,
  removeUserFromTypingList,
} from "@controllers/channelController";
import redis from "@lib/redis"; // Assuming this is your Redis instance

const typingUsers: Record<
  string,
  Map<string, { id: string; name: string }>
> = {};
export const setupChannelSocket = (io: Io, socket: SocketServer) => {
  socket.on("typing", (channelId) =>
    addUserToTypingList(io, socket, channelId)
  );
  socket.on("typing-stopped", (channelId) =>
    removeUserFromTypingList(io, socket, channelId)
  );

  socket.on("typing-check", () => {
    console.log(typingUsers);
    console.log(socket.rooms);
  });

  socket.on("disconnect", () => {
    clearTypingOnDisconnect(io, socket);
  });
};
