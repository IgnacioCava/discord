import prisma from "@prisma";
import { EditMessageData, MessageData } from "@socket/types";

export const createMessage = async (messageData: MessageData) => {
  const { content, channelId, authorId, tempId } = messageData;
  try {
    return await prisma.message.create({
      data: {
        content,
        channelId,
        authorId,
      },
      include: {
        author: true,
        channel: {
          select: {
            roomId: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to save message to the database.");
  }
};

export const updateMessage = async (messageData: EditMessageData) => {
  const { content, id } = messageData;
  try {
    return await prisma.message.update({
      where: {
        id,
      },
      data: {
        content,
      },
      include: {
        author: true,
        channel: {
          select: {
            roomId: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to save message to the database.");
  }
};

export const findMessages = async (channelId: string) => {
  try {
    return await prisma.message.findMany({
      where: { channelId },
      include: { author: true },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch room messages from the database.");
  }
};
