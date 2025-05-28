import prisma from "@prisma";
import { createRoomMember } from "@services/roomMemberService";
import {
  createNewRoom,
  fetchRoomData,
  findRoomById,
  findRooms,
} from "@services/roomService";
import { Io, SocketServer } from "@socket/types";
import { JOINED_ROOMS_PREFIX } from "@constants/redisConsts";
import { Request, Response } from "express";
import redis from "@lib/redis";

export const getRooms = async (req: Request, res: Response) => {
  const { roomId } = req.params; // Extract roomId from the URL
  const userId = req.user?.id;
  try {
    if (!userId) throw { message: "Unauthorized", status: 401 };

    const rooms = await findRooms(userId);

    if (!rooms) {
      res.status(404).json({ error: "No rooms found" });
    }

    res.status(200).json(rooms);
  } catch (error: any) {
    console.error("Error fetching room data:", error);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getRoomData = async (req: Request, res: Response) => {
  const { roomId } = req.params; // Extract roomId from the URL

  try {
    const roomData = await fetchRoomData(roomId);

    if (!roomData) {
      res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json(roomData);
  } catch (error) {
    console.error("Error fetching room data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user?.id;
  if(!userId) {
    res.status(404).json({ error: "Unauthenticated" })
    return
  }
  try {
    if (!name) {
      res.status(400).json({ error: "Room name required" });
    }
    const room = await createNewRoom(name, userId);

    res.status(200).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const joinChannel = async (
  io: Io,
  socket: SocketServer,
  roomId: string,
  channelId: string
) => {
  try {
    // Check if the room and user exist, if not handle the error
    const userId = socket.userDB?.id;

    if (!userId) throw new Error("User not authenticated");
    if (!roomId) throw new Error("Room ID required");

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");

    const existingMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (existingMember)
      throw new Error("The user is already a member of the room");

    if (!existingMember)
      await createRoomMember({
        roomId,
        userId,
        isOnline: true,
        permissions: 3,
      });

    // Join the room using socket.join()
    socket.join(channelId);

    // Emit event to other members in the room (optional)
    socket.to(channelId).emit("system-message", {
      messageType: "SYSTEM",
      user: "System",
      content: `${socket.userDB?.name} has joined the channel (${roomId})`,
      timestamp: new Date(),
    });

    // Send confirmation to the client
    socket.emit("join-channel-success", { roomId, userId });
  } catch (error) {
    console.error(error);
    socket.emit("join-channel-error", {
      message: `Error joining channel: ${error}.`,
    });
  }
};

export const leaveRoom = async (
  io: Io,
  socket: SocketServer,
  roomId: string
) => {
  try {
    const user = socket.userDB;
    if (!user) throw new Error("User not authenticated");

    await prisma.roomMember.delete({
      where: {
        roomId_userId: { roomId, userId: user.id },
      },
    });

    socket.leave(roomId); // Leave the room
    socket.to(roomId).emit("system-message", {
      messageType: "SYSTEM",
      user: "System",
      content: `${user.name} has left the room.`,
      timestamp: new Date(),
    });
  } catch (error) {
    socket.emit("leave-room-error", {
      error: `Failed to leave room: ${error}.`,
    });
  }
};

const activeRooms = new Set();

export const applyForRoomMembership = async (
  io: Io,
  socket: SocketServer,
  roomId: string
) => {
  try {
    // Check if the room and user exist, if not handle the error
    const userId = socket.userDB?.id;

    if (!userId) throw new Error("User not authenticated");
    if (!roomId) throw new Error("Room ID required");

    const room = await findRoomById(roomId);
    if (!room) throw new Error("Room not found");

    const existingMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    //if (existingMember) throw new Error("User is already a member of the room");
    if (existingMember) throw new Error("This user is already a member");

    await createRoomMember({
      roomId,
      userId,
      isOnline: true,
      permissions: 3,
    });

    const channel = await prisma.channel.findFirst({
      where: {
        roomId,
        isPrivate: false,
      },
    });

    if (channel) {
      socket.join(`room-${roomId}-notifications`);
      socket.emit(`join-room-${roomId}-notifications-success`, {
        roomId,
        userId,
      });
      socket.join(`channel-${channel.id}`);
      socket.to(`channel-${channel.id}`).emit("system-message", {
        messageType: "SYSTEM",
        user: "System",
        content: `${socket.userDB?.name} ${userId} is now a member (room: ${roomId})`,
        timestamp: new Date(),
      });
    }

    // Send confirmation to the client
    socket.emit("apply-for-room-membership-success", { roomId, userId });
  } catch (error) {
    console.error(error);
    socket.emit("apply-for-room-membership-error", {
      message: `Error applying for membership: ${error}.`,
    });
  }
};

export const joinRoom = async (
  io: Io,
  socket: SocketServer,
  roomId: string
) => {
  try {
    // Check if the room and user exist, if not handle the error
    const userId = socket.userDB?.id;

    if (!userId) throw new Error("User not authenticated");
    if (!roomId) throw new Error("Room ID required");

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");

    const existingMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!existingMember)
      throw new Error("The user is not a member of this room");

    socket.join(`room-${roomId}-notifications`);
    //await redis.sadd(`${JOINED_ROOMS_PREFIX}room-${roomId}-notifications`, userId);
    await redis.sadd(
      `${JOINED_ROOMS_PREFIX}${userId}`,
      `room-${roomId}-notifications`
    );
    socket.emit(`join-room-${roomId}-notifications-success`, {
      roomId,
      userId,
    });

    const channel = await prisma.channel.findFirst({
      where: {
        roomId,
        isPrivate: false,
      },
    });

    if (channel) {
      socket.join(`channel-${channel.id}`);
      await redis.sadd(
        `${JOINED_ROOMS_PREFIX}${userId}`,
        `channel-${channel.id}`
      );
      socket.emit("join-channel-success", { channelId: channel.id, userId });
      socket.to(`channel-${channel.id}`).emit("system-message", {
        messageType: "SYSTEM",
        user: "System",
        content: `${socket.userDB?.name} ${userId} has joined (room: ${roomId})`,
        timestamp: new Date(),
      });
    }

    socket.on("switch-channel", async ({ newChannelId }) => {
      // Leave all previous channels in that room
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith("channel-")) {
          socket.leave(room);
          //await redis.del(`${JOINED_ROOMS_PREFIX}${room}`); // Removing the specific channel from Redis
          await redis.del(
            `${JOINED_ROOMS_PREFIX}${userId}`,
            `channel-${newChannelId}`
          );
        }
      }

      // Join the new active channel
      socket.join(`channel-${newChannelId}`);
      //await redis.sadd(`${JOINED_ROOMS_PREFIX}channel-${newChannelId}`, userId);
      await redis.sadd(
        `${JOINED_ROOMS_PREFIX}${userId}`,
        `channel-${newChannelId}`
      );
      socket.emit("switch-channel-success", {
        roomId,
        userId,
        channelId: newChannelId,
      });
    });

    // Send confirmation to the client
    socket.emit("join-room-success", { roomId, userId });
    console.log("join-room-success");
  } catch (error) {
    console.error(error);
    socket.emit("join-room-error", {
      message: `Error joining room: ${error}.`,
    });
  }
};
