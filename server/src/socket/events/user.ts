import {
  applyForRoomMembership,
  joinChannel,
  joinRoom,
  leaveRoom,
} from "@controllers/roomController";
import { Io, SocketServer } from "@socket/types";
import prisma from "@prisma";
import { handleUserOnlineState } from "@controllers/userController";
import redis from "@lib/redis";
import { JOINED_ROOMS_PREFIX } from "@constants/redisConsts";


export const setupUserSocket = async (io: Io, socket: SocketServer) => {
  // Handle connect and disconnect events

  if (!socket.userDB) return;

  const roomKeys = await redis.smembers(
    `${JOINED_ROOMS_PREFIX}${socket.userDB.id}`
  );

  for (const room of roomKeys) {
    await socket.join(room);
  }

  await handleUserOnlineState(io, socket);
};
