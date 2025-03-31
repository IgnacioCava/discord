import prisma from "@prisma";
import { Io, SocketServer } from "@socket/types";
import { editMessage, sendMessage } from "@controllers/messageController";

export const setupMessageSocket = (io: Io, socket: SocketServer) => {
  // Handle 'send-message' event

  socket.on("send-message", async (messageData, statusCallback) => {
    await sendMessage(io, socket, messageData, statusCallback);
  });

  socket.on("edit-message", async (messageData, statusCallback) => {
    await editMessage(io, socket, messageData, statusCallback);
  });

  socket.on("delete-all", async () => {
    await prisma.message.deleteMany();
  });
};
