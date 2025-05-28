import { createNewChannel } from "@services/channelService";
import { Io, SocketServer } from "@socket/types";
import { Request, Response } from "express";
import { TYPING_PREFIX } from "@constants/redisConsts";
import redis from "@lib/redis"; // Assuming this is your Redis instance

export const createChannel = async (req: Request, res: Response) => {
  const { roomId, channelName, channelDescription, type } = req.body;

  try {
    const userId = req.userDB?.id;
    if (!userId) throw { status: 401, message: "Unauthorized" };
    if (!roomId || !channelName) {
      throw {
        status: 400,
        message:
          "Missing data. Required fields are roomId, userId and channelName",
      };
    }
    const channel = await createNewChannel({
      roomId,
      userId,
      channelName,
      channelDescription,
      type,
    });
    res.status(200).json(channel);
  } catch (error: any) {
    console.error("Error creating channel:", error.message);
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error" });
  }
};
