import prisma from "@prisma";

interface CreateNewChannelProps {
  roomId: string;
  userId: string;
  channelName: string;
  channelDescription: string;
  type: "TEXT" | "VOICE";
}

export const createNewChannel = async ({
  channelDescription,
  channelName,
  roomId,
  type,
  userId,
}: CreateNewChannelProps) => {
  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Create the channel

      const room = await prisma.room.findUnique({
        where: {
          id: roomId,
        },
      });

      if (!room) {
        throw new Error("Room does not exist.");
      }

      const roomMember = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
        select: { permissions: true },
      });

      if (
        !roomMember ||
        roomMember.permissions < 8 /* Mod level permissions */
      ) {
        throw new Error("You do not have permissions to create a channel.");
      }

      const existingChannel = await prisma.channel.findFirst({
        where: {
          roomId,
          name: channelName,
        },
      });

      if (existingChannel) {
        throw new Error("A channel with this name already exists.");
      }

      const newChannel = await prisma.channel.create({
        data: {
          name: channelName,
          description: channelDescription || "",
          roomId,
          type,
        },
      });

      // Add the user as an ADMIN in the channel
      const channelMember = await prisma.channelMember.create({
        data: {
          channelId: newChannel.id,
          userId,
          //role: "ADMIN",
          permissions: 16,
        },
        include: {
          user: true,
          role: true,
        },
      });

      const returnChannel = {
        ...newChannel,
        members: [{ ...channelMember }],
        roles: [],
      };
      return returnChannel;
    });
    return result;
  } catch (error) {
    console.error("Database Error @createNewChannel:", error);
    throw new Error("Failed to save message to the database.");
  }
};
