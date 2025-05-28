// import redis from "@lib/redis";
// import { getProducerById } from "./producerController";
// import { SocketServer } from "@socket/types";
// import {
//   MediaKind,
//   Consumer,
//   WebRtcTransport,
//   RtpCapabilities,
// } from "mediasoup/node/lib/types";
// import { getRouter, isRouterReady } from "@lib/mediasoupRouter";

// const consumerCache = new Map<string, Consumer>();

// export const createConsumer = async (
//   userId: string,
//   channelId: string,
//   transport: WebRtcTransport,
//   producerId: string,
//   rtpCapabilities: RtpCapabilities,
//   kind: MediaKind
// ) => {
//   try {
//     const producerData = await getProducerById(
//       userId,
//       producerId,
//       kind,
//       channelId
//     );
//     if (!producerData) throw new Error("Producer not found");
//     const router = getRouter();
//     if (!isRouterReady()) {
//       console.error("Tried to access router before it was ready!");
//       return;
//     }
//     if (!router.canConsume({ producerId, rtpCapabilities })) {
//       throw new Error("Cannot consume this producer");
//     }

//     const consumer = await transport.consume({
//       producerId,
//       rtpCapabilities,
//       paused: false,
//     });
//     consumer.resume();

//     consumer.on('score', (score) => {
//       console.log('Consumer score', score);
//     });

//     // Store in memory
//     consumerCache.set(`${userId}:${consumer.id}`, consumer);

//     // Store metadata in Redis
//     await redis.hmset(`consumer:${userId}:${consumer.id}:${kind}`, {
//       id: consumer.id,
//       userId,
//       channelId,
//       producerId,
//       kind: consumer.kind,
//       transportId: transport.id,
//       paused: false,
//     });

//     return consumer;
//   } catch (error) {
//     console.error("Error creating consumer:", error);
//     return null;
//   }
// };

// export const getConsumerById = async (userId: string, consumerId: string) => {
//   const key = `${userId}:${consumerId}`;
//   try {
//     // Check in-memory cache first
//     if (consumerCache.has(key)) return consumerCache.get(key);

//     // Fetch from Redis
//     const consumerData = await redis.hgetall(
//       `consumer:${userId}:${consumerId}`
//     );
//     if (!consumerData) throw new Error("Consumer not found");

//     return {
//       id: consumerData.id,
//       userId: consumerData.userId,
//       channelId: consumerData.channelId,
//       producerId: consumerData.producerId,
//       kind: consumerData.kind,
//       transportId: consumerData.transportId,
//       rtpParameters: JSON.parse(consumerData.rtpParameters),
//     };
//   } catch (error) {
//     console.error("Error @getConsumerById:", error);
//     return null;
//   }
// };

// export const closeConsumer = async (userId: string, consumerId: string) => {
//   const key = `${userId}:${consumerId}`;
//   const consumer = consumerCache.get(key);
//   if (consumer) consumer.close(); // Close the Mediasoup consumer

//   consumerCache.delete(key);
//   await redis.del(`consumer:*:${consumerId}`);

//   console.log(`🗑️ Consumer ${consumerId} deleted`);
// };

// export const resumeConsumer = async (userId: string, consumerId: string) => {
//   const key = `${userId}:${consumerId}`;
//   try {
//     const consumer = consumerCache.get(key);
//     if (!consumer) throw new Error("Consumer not found");
//     await consumer.resume();
//     await redis.hset(`consumer:${userId}:${consumerId}`, "paused", "false");
//   } catch (error) {
//     console.error("Error @resumeConsumer:", error);
//     return null;
//   }
// };

// export const pauseConsumer = async (userId: string, consumerId: string) => {
//   const key = `${userId}:${consumerId}`;
//   try {
//     const consumer = consumerCache.get(key);
//     if (!consumer) throw new Error("Consumer not found");
//     await consumer.pause();
//     await redis.hset(`consumer:${userId}:${consumerId}`, "paused", "true");
//   } catch (error) {
//     console.error("Error @resumeConsumer:", error);
//     return null;
//   }
// };

// export const closeAllConsumersForUser = async (userId: string) => {
//   const consumerKeys = await redis.keys(`consumer:${userId}:*`);
//   await redis.del(...consumerKeys);
//   for (const [key, consumer] of consumerCache) {
//     if (key.startsWith(`${userId}:`)) {
//       consumer.close();
//       consumerCache.delete(key);
//     }
//   }
// };

// export const consumerActions = async (socket: SocketServer) => {
//   socket.on("pause-consumer", async ({ consumerId }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       await pauseConsumer(socket.userDB?.id, consumerId);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to pause consumer:", err);
//       callback({ error: "Failed to pause consumer" });
//     }
//   });

//   socket.on("resume-consumer", async ({ consumerId }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       await resumeConsumer(socket.userDB?.id, consumerId);
//       callback({ resumed: true });
//     } catch (error) {
//       console.error("Failed to resume consumer:", error);
//       callback({ error: "Failed to resume consumer" });
//     }
//   });

//   socket.on("close-consumer", async ({ consumerId }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       await closeConsumer(socket.userDB?.id, consumerId);
//       callback({ resumed: true });
//     } catch (error) {
//       console.error("Failed to close consumer:", error);
//       callback({ error: "Failed to close consumer" });
//     }
//   });
// };
