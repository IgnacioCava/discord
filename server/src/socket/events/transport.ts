import { Io, SocketServer } from "@socket/types";
import { createWorker, getWorker } from "@lib/mediasoupWorker";
import { routerOptions, webRtcTransportOptions } from "@lib/mediasoupConfig";
import { types as mediasoupTypes } from "mediasoup";
import redis from "@lib/redis";
import {
  closeAllProducersForUser,
  closeProducer,
  createProducer,
  getProducerById,
  pauseProducer,
  producerActions,
  resumeProducer,
} from "@controllers/mediasoup/producerController";
import {
  closeAllConsumersForUser,
  closeConsumer,
  consumerActions,
  createConsumer,
  pauseConsumer,
  resumeConsumer,
} from "@controllers/mediasoup/consumerController";
import { setRouter } from "@lib/mediasoupRouter";

const transportCache = new Map<string, mediasoupTypes.WebRtcTransport>();

export const setupTransport = async (io: Io, socket: SocketServer) => {
  const worker = await createWorker();
  const router = await worker.createRouter(routerOptions);
  setRouter(router);

  socket.on("join-sfu-voice-channel", async ({ roomId }, callback) => {
    if (!socket.userDB) return callback({ error: "Unauthorized" });

    socket.data.roomId = roomId;
    await redis.sadd(`voiceRoom:${roomId}:members`, socket.userDB.id);
    socket.join(`voiceRoom:${roomId}`);

    callback({ success: true });
  });

  socket.on("get-router-rtp-capabilities", (_, callback) => {
    callback(router.rtpCapabilities);
  });

  socket.on("get-room-producers", async ({ roomId }, callback) => {
    const producers = await redis.lrange(`room:${roomId}:producers`, 0, -1);
    const parsed = producers.map((p) => JSON.parse(p));
    callback({ producers: parsed });
  });

  socket.on("create-transport", async ({ direction }, callback) => {
    if (!socket.userDB || !socket.data.roomId) {
      return callback({ error: "Invalid user or room" });
    }

    if (direction !== "send" && direction !== "recv") {
      return callback({ error: "Invalid direction" });
    }

    const transport = await createTransport(
      socket.userDB.id,
      socket.data.roomId,
      direction
    );
    if (!transport) return callback({ error: "Transport creation error" });

    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });

    transport.on("dtlsstatechange", async (state) => {
      if (state === "closed") {
        transport.close();
        if (!socket.userDB) return;
        await redis.del(
          `transport:${socket.userDB.id}:${socket.data.roomId}:${direction}`
        );
      }
    });

    socket.on("disconnect", () => transport.close());
  });

  socket.on(
    "connect-transport",
    async ({ dtlsParameters, direction }, callback) => {
      if (!socket.userDB || !socket.data.roomId)
        return callback({ error: "Unauthorized" });

      const storedTransport = await getTransportByUser(
        socket.userDB.id,
        socket.data.roomId,
        direction
      );
      if (!storedTransport) return callback({ error: "Transport not found" });

      const transport = getTransportById(storedTransport.id);
      if (!transport) return callback({ error: "Transport instance missing" });

      await transport.connect({ dtlsParameters });
      // Remove from Redis when transport is closed
      transport.observer.on("close", async () => {
        if (!socket.userDB) return;
        await redis.del(
          `transport:${socket.userDB.id}:${socket.data.roomId}:${direction}`
        );
        console.log(
          `🗑️ Transport ${direction} ${transport.id} (user ${socket.userDB.id}) removed from Redis.`
        );
      });
      callback();
    }
  );

  socket.on("restore-transport", async ({ userId }, callback) => {
    if (!socket.userDB || !socket.data.roomId)
      return callback({ error: "Unauthorized" });
    const storedTransport = await redis.hgetall(
      `transport:${socket.userDB.id}:${socket.data.roomId}`
    );

    if (storedTransport) {
      callback({
        transportId: storedTransport.transportId,
        iceParameters: JSON.parse(storedTransport.iceParameters),
        iceCandidates: JSON.parse(storedTransport.iceCandidates),
        dtlsParameters: JSON.parse(storedTransport.dtlsParameters),
      });
    } else {
      callback(null); // No stored transport, create a new one
    }
  });

  // Step 6: Produce Audio/Video
  socket.on(
    "produce",
    async ({ transportId, kind, rtpParameters }, callback) => {
      try {
        if (!socket.userDB || !socket.data.roomId)
          return callback({ error: "Unauthorized" });
        const userId = socket.userDB.id;
        const roomId = socket.data.roomId;

        const transport = getTransportById(transportId);
        if (!transport) return callback({ error: "Transport not found" });

        const producer = await createProducer(
          userId,
          roomId,
          transport,
          kind,
          rtpParameters
        );
        if (!producer) return callback({ error: "Failed to create producer" });

        // Notify others in the room
        // socket.to(roomId).emit("new-producer", {
        //   userId,
        //   producerId: producer.id,
        //   kind,
        // });

        return callback({ id: producer.id });
      } catch (error) {
        console.error("❌ Error in produce:", error);
        callback({ error: "Server error while producing" });
      }
    }
  );
  producerActions(socket);

  // Step 7: Consume Audio/Video
  socket.on(
    "consume",
    async ({ transportId, producerId, rtpCapabilities, kind }, callback) => {
      try {
        if (!socket.userDB || !socket.data.roomId) return;
        const userId = socket.userDB.id;
        const roomId = socket.data.roomId;

        if (!userId || !roomId) return callback({ error: "Unauthorized" });

        const transport = transportCache.get(transportId);
        if (!transport) return callback({ error: "Transport not found" });

        const consumer = await createConsumer(
          userId,
          roomId,
          transport,
          producerId,
          rtpCapabilities,
          kind
        );
        if (!consumer) return callback({ error: "Failed to create consumer" });

        return callback({
          consumerId: consumer.id,
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
  consumerActions(socket);

  socket.on(
    "restore-session",
    async ({ userId, roomId, direction }, callback) => {
      if (!userId || !roomId) return callback({ error: "Invalid input" });

      try {
        // 1. Restore Transport
        const transportData = await redis.hgetall(
          `transport:${userId}:${roomId}:*`
        );
        let transport = null;
        if (!transportData || !transportData.id) {
          transport = await recreateTransport(userId, roomId, direction); // Create new transport
        } else {
          transport = {
            id: transportData.id,
            iceParameters: JSON.parse(transportData.iceParameters),
            iceCandidates: JSON.parse(transportData.iceCandidates),
            dtlsParameters: JSON.parse(transportData.dtlsParameters),
          };
        }

        // 2. Send Producers data to recreate them on the client
        const producerKeys = await redis.keys(`producer:${userId}:*`);
        const producers = [];

        for (const key of producerKeys) {
          const data = await redis.hgetall(key);
          if (!data) continue;

          producers.push({
            kind: data.kind,
            paused: data.paused === "true",
          });
        }
        await closeAllProducersForUser(userId);

        // 3. Restore Consumers
        const consumerKeys = await redis.keys(`consumer:${userId}:*`);
        const consumers = [];

        for (const key of consumerKeys) {
          const data = await redis.hgetall(key);
          if (!data) continue;

          consumers.push({
            kind: data.kind,
            producerId: data.producerId,
            paused: data.paused === "true",
          });
        }
        await closeAllConsumersForUser(userId);

        // 4. Return all restored data
        callback({
          transport: {
            id: transportData.id,
            iceParameters: JSON.parse(transportData.iceParameters),
            iceCandidates: JSON.parse(transportData.iceCandidates),
            dtlsParameters: JSON.parse(transportData.dtlsParameters),
          },
          producers,
          consumers,
        });

        console.log(`🔁 Restored session for user ${userId} in room ${roomId}`);
      } catch (err) {
        console.error("❌ Failed to restore session:", err);
        callback({ error: "Failed to restore session" });
      }
    }
  );

  // Step 8: Handle Disconnect
  socket.on("disconnect", async () => {
    if (!socket.userDB) return;

    // Get all transports, producers, and consumers for this user
    await cleanupUserKeys(socket.userDB.id);
    await closeAllConsumersForUser(socket.userDB.id);
    await closeAllProducersForUser(socket.userDB.id);

    // Remove user from the room
    // await redis.srem(`room:${socket.data.roomId}:users`, socket.userDB.id);

    console.log(
      `🗑️ Cleaned up transport, producer, and consumer data for user ${socket.userDB.id}`
    );
  });
};

const createTransport = async (
  userId: string,
  roomId: string,
  direction: "send" | "recv"
) => {
  try {
    const transport = await router.createWebRtcTransport(
      webRtcTransportOptions
    );

    transportCache.set(transport.id, transport);

    await redis.hmset(`transport:${userId}:${roomId}:${direction}`, {
      userId,
      roomId,
      direction,
      id: transport.id,
    });

    return transport;
  } catch (error) {
    throw new Error("Error while creating transport");
  }
};

const recreateTransport = async (
  userId: string,
  roomId: string,
  direction: "send" | "recv"
) => {
  try {
    const transport = await router.createWebRtcTransport(
      webRtcTransportOptions
    ); // Create new transport

    await redis.del(`transport:${userId}:${roomId}:${direction}`);

    await redis.hmset(`transport:${userId}:${roomId}:${direction}`, {
      userId,
      roomId,
      direction,
      id: transport.id,
    });

    transportCache.set(transport.id, transport);

    return transport;
  } catch (error) {
    throw new Error("Error while creating transport");
  }
};

export const getTransportById = (transportId: string) => {
  return transportCache.get(transportId) || null;
};

export const getTransportByUser = async (
  userId: string,
  roomId: string,
  direction: "send" | "recv"
) => {
  try {
    const storedTransport = await redis.hgetall(
      `transport:${userId}:${roomId}:${direction}`
    );

    if (!storedTransport) {
      return null;
    }

    let transport = transportCache.get(storedTransport.id);
    if (transport) return transport;
    return {
      id: storedTransport.id,
      userId: storedTransport.userId,
      roomId: storedTransport.roomId,
      direction: storedTransport.direction,
    };
  } catch (error) {
    console.error(
      `❌ Failed to restore transport for ${userId} in room ${roomId}:`,
      error
    );
    return null;
  }
};

export const cleanupUserKeys = async (userId: string) => {
  const transportKeys = await redis.keys(`transport:${userId}:*:*`);
  const producerKeys = await redis.keys(`producer:${userId}:*:*`);
  const consumerKeys = await redis.keys(`consumer:${userId}:*:*`);
  const keys = [...transportKeys, ...producerKeys, ...consumerKeys];

  // for (const key of [...transportKeys, ...producerKeys, ...consumerKeys]) {
  // }
  if (keys.length) await redis.del(keys);

  console.log(`🗑️ Removed transports for user ${userId}`);
};
