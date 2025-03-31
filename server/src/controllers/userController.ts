import {
  findRoomMembers,
  updateRoomMembers,
} from "@services/roomMemberService";
import { findUser } from "@services/userService";
import { Io, SocketServer } from "@socket/types";
import redis from "@lib/redis";

export const addUserDataToSocket = async (socket: SocketServer) => {
  try {
    console.log(`User connected: ${socket.id}`);
    const user = await findUser(socket.user?.id);

    if (!user) throw new Error("User not found");

    socket.userDB = user;
    socket.emit(`Welcome, ${user.name || "Guest"}`);
  } catch (error) {
    socket.emit("user-connection-error", {
      error: `Failed to connect: ${error}`,
    });
    throw new Error(`${error}`);
  }
};

export const handleUserOnlineState = async (io: Io, socket: SocketServer) => {
  if (!socket.userDB) return;
  const userId = socket.userDB.id;
  const isOnline = await redis.sismember("onlineUsers", userId);

  if (!isOnline) {
    await redis.sadd("onlineUsers", userId);
    await updateRoomMembers({ userId: userId, isOnline: true });
    const membersLinkedToUser = await findRoomMembers({
      userId: userId,
    });

    membersLinkedToUser.forEach(({ roomId, isOnline, userId }) => {
      io.to(`room-${roomId}-notifications`).emit("update-online-users", {
        userId,
        isOnline,
      });
    });
  }

  socket.on("disconnect", async () => {
    if (!socket.userDB) return;
    const wasInOnlineList = await redis.srem("onlineUsers", userId);
    if (wasInOnlineList) {
      await updateRoomMembers({ userId: userId, isOnline: false });
      const membersLinkedToUser = await findRoomMembers({
        userId: userId,
        online: false,
      });
      // Notify other clients
      membersLinkedToUser.forEach(({ roomId, isOnline, userId }) => {
        io.to(`room-${roomId}-notifications`).emit("update-online-users", {
          userId,
          isOnline,
        });
      });
    }
  });
};
