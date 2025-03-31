import prisma from "@prisma";
import { Prisma, RoomMember } from "@prisma/client";
import { Select } from "@prisma/client/runtime/library";

export const findRoomMember = async (roomId: string, userId: string) => {
  try {
    return await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  } catch (error) {
    console.error("Database Error @findRoomMember:", error);
    throw new Error(`Error while fetching roomMember.`);
  }
};

export const findRoomMembers = async (data: {
  userId: string;
  online?: boolean;
  select?: Prisma.RoomMemberSelect; // Typing select using Prisma.RoomMemberSelect
}) => {
  try {
    const { userId, select, online } = data;
    return await prisma.roomMember.findMany({
      where: { userId, ...(online !== undefined ? { isOnline: online } : {}) },
      ...(select ? { select } : {}),
    });
  } catch (error) {
    console.error("Database Error @findRoomMembers:", error);
    throw new Error(`Error while fetching roomMembers.`);
  }
};

export const createRoomMember = async (data: {
  roomId: string;
  userId: string;
  isOnline: boolean;
  permissions: number;
}) => {
  try {
    const { isOnline, permissions, roomId, userId } = data;
    const result = await prisma.$transaction(async (prisma) => {
      await prisma.roomMember.create({
        data: {
          userId,
          roomId,
          permissions: permissions || 3, // Default permissions
          isOnline,
        },
      });
      const channels = await prisma.channel.findMany({
        where: { roomId, isPrivate: false },
      });

      const channelMembersData = channels.map((ch) => ({
        userId,
        channelId: ch.id,
        permissions: 3,
      }));

      await prisma.channelMember.createMany({ data: channelMembersData });
    });
    return result;
  } catch (error) {
    console.error("Database Error @createRoomMember:", error);
    throw new Error(`Error while creating roomMember.`);
  }
};

export const updateRoomMembers = async (data: {
  userId: string;
  isOnline?: boolean;
  permissions?: number;
}) => {
  try {
    const { userId, isOnline, permissions } = data;
    const updateData = {
      ...(isOnline !== undefined ? { isOnline } : {}),
      ...(permissions !== undefined ? { permissions } : {}),
    };
    return await prisma.roomMember.updateMany({
      where: { userId },
      data: updateData,
    });
  } catch (error) {
    console.error("Database Error @updateRoomMember:", error);
    throw new Error(`Error while updating roomMember.`);
  }
};
