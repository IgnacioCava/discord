import { Io, SocketServer } from "@socket/types";
import redis from "@lib/redis";
import { createWorker, getWorker } from "@lib/mediasoupWorker";
import { routerOptions, webRtcTransportOptions } from "@lib/mediasoupConfig";
import { Router, WebRtcTransport } from "mediasoup/node/lib/types";
import {
  closeAllProducersForUser,
  createProducer,
  getAllActiveProducers,
} from "@controllers/mediasoup/producerController";
import {
  closeAllConsumersForUser,
  createConsumer,
} from "@controllers/mediasoup/consumerController";
import { cleanupUserKeys } from "./transport";
import { getRouter, isRouterReady, setRouter } from "@lib/mediasoupRouter";

const transportCache = new Map<string, WebRtcTransport>();

export const setupTransportTest = async (io: Io, socket: SocketServer) => {
  const worker = await createWorker();
  const router = await worker.createRouter(routerOptions);
  setRouter(router);

  socket.on("join-sfu-voice-channel", async ({ channelId }, callback) => {
    if (!socket.userDB) return callback({ error: "Unauthorized" });

    socket.data.channelId = channelId;
    await redis.sadd(`voicechat-sfu:${channelId}:members`, socket.userDB.id);
    socket.join(`voicechat-sfu:${channelId}`);
    callback({ success: true });
  });

  socket.on("leave-sfu-voice-channel", async ({ channelId }, callback) => {
    if (!socket.userDB) return callback({ error: "Unauthorized" });

    await redis.srem(`voicechat-sfu:${channelId}:members`, socket.userDB.id);
    socket.leave(`voicechat-sfu:${channelId}`);
  });

  socket.on("disconnect", async () => {
    try {
      if (!socket.userDB) return;
      await redis.srem(
        `voicechat-sfu:${socket.data.channelId}:members`,
        socket.userDB.id
      );

      // Get all transports, producers, and consumers for this user
      await cleanupUserKeys(socket.userDB.id);

      // await closeAllConsumersForUser(socket.userDB.id);
      // await closeAllProducersForUser(socket.userDB.id);

      console.log(
        `🗑️ Cleaned up transport, producer, and consumer data for user ${socket.userDB.id}`
      );
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("get-router-rtp-capabilities", (_, callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on("create-transport", async ({ direction }, callback) => {
    if (!socket.userDB || !socket.data.channelId) {
      return callback({ error: "Invalid user or room" });
    }

    if (direction !== "send" && direction !== "recv") {
      return callback({ error: "Invalid direction" });
    }

    const userId = socket.userDB.id;
    const channelId = socket.data.channelId;

    const transport = await createTransport(userId, channelId, direction);

    if (!transport) return callback({ error: "Transport creation error" });

    let availableProducers = null;
    if (direction === "recv") {
      availableProducers = await getAllActiveProducers(userId, channelId);
    }

    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      ...(direction === "recv" ? { availableProducers } : {}),
    });

    // transport.on("dtlsstatechange", async (state) => {
    //   console.log("dtlsstatechange", { state });
    //   if (state === "closed") {
    //     transport.close();
    //     await redis.del(`transport:${userId}:${channelId}:${direction}`);
    //   }
    // });

    socket.once("disconnect", () => {
      transport.close();
    });
  });

  socket.on(
    "connect-transport",
    async ({ dtlsParameters, transportId, direction }, callback) => {
      if (!socket.userDB || !socket.data.channelId)
        return callback({ error: "Unauthorized" });

      const userId = socket.userDB.id;
      const channelId = socket.data.channelId;
      // const storedTransport = await getTransportByUser(
      //   userId,
      //   channelId,
      //   direction
      // );
      // if (!storedTransport) return callback({ error: "Transport not found" });

      const transport = getTransportById(transportId);
      if (!transport) return callback({ error: "Transport instance missing" });
      await transport.connect({ dtlsParameters });
      // Remove from Redis when transport is closed
      transport.observer.on("close", async () => {
        if (!socket.userDB) return;
        await redis.del(`transport:${userId}:${channelId}:${direction}`);
        console.log(
          `🗑️ Transport ${direction} ${transport.id} (user ${userId}) removed from Redis.`
        );
      });
      callback();
    }
  );

  socket.on(
    "produce",
    async ({ transportId, kind, rtpParameters }, callback) => {
      try {
        if (!socket.userDB || !socket.data.channelId)
          return callback({ error: "Unauthorized" });
        const userId = socket.userDB.id;
        const channelId = socket.data.channelId;

        const transport = getTransportById(transportId);
        if (!transport) return callback({ error: "Transport not found" });
        console.log("state", transport.dtlsState, transport.iceState);

        const producer = await createProducer(
          socket,
          userId,
          channelId,
          transport,
          kind,
          rtpParameters
        );
        if (!producer) return callback({ error: "Failed to create producer" });
        // Notify others in the room
        socket.to(`voicechat-sfu:${channelId}`).emit("new-producer", {
          userId,
          producerId: producer.id,
          kind,
        });

        return callback({ id: producer.id });
      } catch (error) {
        console.error("❌ Error in produce:", error);
        callback({ error: "Server error while producing" });
      }
    }
  );

  socket.on(
    "consume",
    async (
      { transportId, producerId, rtpCapabilities, kind, userId },
      callback
    ) => {
      try {
        if (!socket.userDB || !socket.data.channelId) return;
        const channelId = socket.data.channelId;

        if (!userId || !channelId) return callback({ error: "Unauthorized" });

        const transport = transportCache.get(transportId);
        if (!transport) return callback({ error: "Transport not found" });

        const consumer = await createConsumer(
          userId,
          channelId,
          transport,
          producerId,
          rtpCapabilities,
          kind
        );
        if (!consumer) return callback({ error: "Failed to create consumer" });

        return callback({
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (error) {
        console.error("❌ Error in consume:", error);
        callback({ error: "Server error while consuming" });
      }
    }
  );
};

const createTransport = async (
  userId: string,
  channelId: string,
  direction: "send" | "recv"
) => {
  try {
    const router = getRouter();
    if (!isRouterReady()) {
      console.error("Tried to access router before it was ready!");
      return;
    }
    const transport = await router.createWebRtcTransport(
      webRtcTransportOptions
    );

    transport.on("dtlsstatechange", (a) => {
      console.log("dtlsstatechange", a);
    });

    transport.on("icestatechange", (a) => {
      console.log("icestatechange", a);
    });

    transportCache.set(transport.id, transport);

    await redis.hmset(`transport:${userId}:${channelId}:${direction}`, {
      userId,
      channelId,
      direction,
      id: transport.id,
    });

    return transport;
  } catch (error) {
    console.log(error);
    throw new Error("Error while creating transport");
  }
};

export const getTransportById = (transportId: string) => {
  return transportCache.get(transportId) || null;
};

export const getTransportByUser = async (
  userId: string,
  channelId: string,
  direction: "send" | "recv"
) => {
  try {
    const storedTransport = await redis.hgetall(
      `transport:${userId}:${channelId}:${direction}`
    );

    if (!storedTransport) {
      return null;
    }

    let transport = transportCache.get(storedTransport.id);
    if (transport) return transport;
    return {
      id: storedTransport.id,
      userId: storedTransport.userId,
      channelId: storedTransport.channelId,
      direction: storedTransport.direction,
    };
  } catch (error) {
    console.error(
      `❌ Failed to restore transport for ${userId} in room ${channelId}:`,
      error
    );
    return null;
  }
};
