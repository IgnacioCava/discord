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
const roomMembers: Record<string, Set<string>> = {}; // { roomId: Set<userId> }

export const setupVoiceSocket = (io: Io, socket: SocketServer) => {
  const socketId = socket.id;
  const userId = socket.userDB?.id;
  if (!socketId || !userId) return;
  socket.on("join-voice-channel", (channelId: string) => {
    if(!roomMembers[`voicechat-${channelId}`]?.has(userId)){
      socket.join(`voicechat-${channelId}`);
      if (!roomMembers[`voicechat-${channelId}`]) {
        roomMembers[`voicechat-${channelId}`] = new Set();
      }
      roomMembers[`voicechat-${channelId}`].add(userId);
  
      // Notify existing members about the new user
      socket
        .to(`voicechat-${channelId}`)
        .emit("user-joined", { userId, socketId });
    }

  });

  socket.on(
    "offer",
    ({ offer, to }: { offer: RTCSessionDescriptionInit; to: string }) => {
      io.to(to).emit("offer", { offer, userId, socketId });
    }
  );

  socket.on(
    "answer",
    ({ answer, to }: { answer: RTCSessionDescriptionInit; to: string }) => {
      io.to(to).emit("answer", { answer, userId, socketId });
    }
  );

  socket.on(
    "ice-candidate",
    ({ candidate, to }: { candidate: RTCIceCandidateInit; to: string }) => {
      io.to(to).emit("ice-candidate", { candidate, socketId, userId });
    }
  );

  socket.on(
    "mic-reconnected",
    ({
      socketId,
      channelId,
    }: {
      socketId: string;
      channelId: string;
    }) => {
      socket
        .to(`voicechat-${channelId}`)
        .emit("mic-reconnected", { userId, socketId });
    }
  );

  socket.on("leave-voice-channel", (channelId: string) => {
    socket.leave(`voicechat-${channelId}`);

    if (roomMembers[`voicechat-${channelId}`]) {
      roomMembers[`voicechat-${channelId}`].delete(userId);

      // Notify others about user disconnection
      io.to(`voicechat-${channelId}`).emit("user-left", { userId, socketId });

      // Clean up room if empty
      if (roomMembers[`voicechat-${channelId}`].size === 0) {
        delete roomMembers[`voicechat-${channelId}`];
      }
    }
  });

  socket.on("disconnect", (e) => {
    Object.entries(roomMembers).forEach(([channelId, members]) => {
      if (members.has(userId)) {
        io.to(`${channelId}`).emit("user-left", { userId, socketId });
        members.delete(userId);

        if (members.size === 0) {
          delete roomMembers[`voicechat-${channelId}`];
        }
      }
    });
  });
};
