import { createNewChannel } from "@services/channelService";
import { Io, SocketServer } from "@socket/types";
import { Request, Response } from "express";
import { TYPING_PREFIX } from "@constants/redisConsts";
import redis from "@lib/redis"; // Assuming this is your Redis instance

export const addUserToTypingList = async (
  io: Io,
  socket: SocketServer,
  channelId: string
) => {
  if (!socket.userDB) return;
  const roomKey = `${TYPING_PREFIX}${channelId}`;
  const userData = JSON.stringify({
    id: socket.userDB.id,
    name: socket.userDB.name,
  });
  await redis.sadd(roomKey, userData);
  await redis.expire(roomKey, 5);
  const typingUsers = await redis.smembers(roomKey);

  socket.to(`channel-${channelId}`).emit(
    "user-typing-status",
    typingUsers.map((user) => JSON.parse(user))
  );
};

export const removeUserFromTypingList = async (
  io: Io,
  socket: SocketServer,
  channelId: string
) => {
  if (!socket.userDB) return;
  const roomKey = `${TYPING_PREFIX}${channelId}`;
  const userData = JSON.stringify({
    id: socket.userDB.id,
    name: socket.userDB.name,
  });

  const isUserInTypingList = await redis.srem(roomKey, userData);

  if (isUserInTypingList) {
    const typingUsers = await redis.smembers(roomKey);
    socket.to(`channel-${channelId}`).emit(
      "user-typing-status",
      typingUsers.map((user) => JSON.parse(user))
    );
  }
};

export const clearTypingOnDisconnect = async (io: Io, socket: SocketServer) => {
  const rooms = Array.from(socket.rooms);
  await Promise.all(
    rooms.map(async (room) => {
      if (room.startsWith("channel-")) {
        const roomKey = `${TYPING_PREFIX}${room.split("-")[1]}`;
        const userData = JSON.stringify({
          id: socket.userDB?.id,
          name: socket.userDB?.name,
        });

        const isUserInTypingList = await redis.sismember(roomKey, userData);
        if (isUserInTypingList) {
          await redis.srem(roomKey, userData);
          const typingUsers = await redis.smembers(roomKey);
          io.to(room).emit(
            "user-typing-status",
            typingUsers.map((user) => JSON.parse(user))
          );
        }
      }
    })
  );
};
