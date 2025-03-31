import { applyForRoomMembership, joinChannel, joinRoom, leaveRoom } from "@controllers/roomController";
import { Io, SocketServer } from "@socket/types";

export const setupRoomSocket = (io: Io, socket: SocketServer) => {
  // Handle 'join-room' event
  socket.on("apply-for-room-membership", async ({ roomId }) => {
    await applyForRoomMembership(io, socket, roomId);
  });

  socket.on("join-room", async ({ roomId }) => {
    await joinRoom(io, socket, roomId);
  });

  // Handle 'leave-room' event
  socket.on("leave-room", async ({ roomId }) => {
    await leaveRoom(io, socket, roomId);
  });
};
