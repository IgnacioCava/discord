// import {
//   WebRtcTransport,
//   MediaKind,
//   RtpParameters,
//   Producer,
// } from "mediasoup/node/lib/types";
// import redis from "@lib/redis";
// import { SocketServer } from "@socket/types";

// // check/swap controllers and services

// const producerCache = new Map<string, Producer>();

// export const createProducer = async (
//   socket: SocketServer,
//   userId: string,
//   channelId: string,
//   transport: WebRtcTransport,
//   kind: MediaKind,
//   rtpParameters: RtpParameters
// ) => {
//   try {
//     const producer = await transport.produce({ kind, rtpParameters });
//     producer.on("score", (score) => {
//       console.log(score)
//     })
//     producer.resume()
    
//     const key = `producer:${userId}:${channelId}:${producer.id}:${kind}`;
//     // Store in memory
//     producerCache.set(key, producer);
//     // Store metadata in Redis
//     await redis.hset(key, {
//       id: producer.id,
//       userId,
//       channelId,
//       kind,
//       pause: false,
//       transportId: transport.id,
//       rtpParameters: JSON.stringify(rtpParameters),
//     });

//     await redis.sadd(`activeProducers:${channelId}`, key);
//     producer.once("@close", async () => {
//       await redis.srem(`activeProducers:${channelId}`, key);
//       socket.data.producerKeys = socket.data.producerKeys.filter(
//         (prod: string) => prod !== key
//       );
//     });
//     socket.once("disconnect", async () => {
//       await redis.srem(`activeProducers:${channelId}`, key);
//       socket.data.producerKeys = [];
//     });
//     if (!socket.data.producerKeys) socket.data.producerKeys = [];
//     socket.data.producerKeys.push(key);
//     return producer;
//   } catch (error) {
//     console.error("Error creating producer:", error);
//     return null;
//   }
// };

// export const getProducerById = async (
//   userId: string,
//   producerId: string,
//   kind: MediaKind,
//   channelId: string
// ) => {
//   const key = `producer:${userId}:${channelId}:${producerId}:${kind}`;
//   try {
//     // Check in-memory cache first
//     if (producerCache.has(key)) return producerCache.get(key);
//     // Fetch from Redis
//     const producerData = await redis.hgetall(key);
//     if (!producerData) return null;

//     return {
//       id: producerData.id,
//       userId: producerData.userId,
//       channelId: producerData.channelId,
//       kind: producerData.kind,
//       transportId: producerData.transportId,
//       rtpParameters: JSON.parse(producerData.rtpParameters),
//     };
//   } catch (error) {
//     console.log("Error @getProducerById:", error);
//     throw new Error("Error fetching producer");
//   }
// };

// export const closeProducer = async (key: string) => {
//   try {
//     const producer = producerCache.get(key);
//     if (producer) producer.close(); // Close the Mediasoup producer
//     producer?.id && console.log(`🗑️ Producer ${producer.id} deleted`);
//     producerCache.delete(key);
//     await redis.del(key);
//   } catch (error) {
//     console.log("Error @deleteProducer:", error);
//     throw new Error("Error deleting producer");
//   }
// };

// export const pauseProducer = async (key: string) => {
//   const producer = producerCache.get(key);
//   if (!producer) throw new Error("Producer not found");
//   await producer.pause();
//   await redis.hset(key, "paused", "true");
// };

// export const resumeProducer = async (key: string) => {
//   const producer = producerCache.get(key);
//   if (!producer) throw new Error("Producer not found");
//   await producer.resume();
//   await redis.hset(key, "paused", "false");
// };

// export const closeAllProducersForUser = async (userId: string) => {
//   const producerKeys = await redis.keys(`producer:${userId}:*:*:*`);
//   await redis.del(...producerKeys);
//   for (const [key, producer] of producerCache) {
//     if (key.startsWith(`${userId}:`)) {
//       producer.close();
//       producerCache.delete(key);
//     }
//   }
// };

// export const producerActions = async (socket: SocketServer) => {
//   if (!socket.userDB) return;
//   const userId = socket.userDB.id;
//   const channelId = socket.data.channelId;
//   const initKey = `producer:${userId}:${channelId}`;

//   socket.on("disconnect", async () => {
//     const channelId = socket.data.channelId;
//     const producerKeys = socket.data.producerKeys || [];

//     for (const key of producerKeys) {
//       await redis.srem(`activeProducers:${channelId}`, key);
//     }
//   });
//   socket.on("pause-producer", async ({ producerId, kind }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       const producerKey = `${initKey}:${producerId}:${kind}`;
//       await pauseProducer(producerKey);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to pause producer:", err);
//       callback({ error: "Failed to pause producer" });
//     }
//   });

//   socket.on("resume-producer", async ({ producerId, kind }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       const producerKey = `${initKey}:${producerId}:${kind}`;
//       await resumeProducer(producerKey);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to resume producer:", err);
//       callback({ error: "Failed to resume producer" });
//     }
//   });

//   socket.on("close-producer", async ({ producerId, kind }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       const producerKey = `${initKey}:${producerId}:${kind}`;
//       await closeProducer(producerKey);
//       await redis.srem(`activeProducers:${channelId}`, producerKey);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to close producer:", err);
//       callback({ error: "Failed to close producer" });
//     }
//   });

//   socket.on("mute", async ({ producerId }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       const producerKey = `${initKey}:${producerId}:audio`;
//       await pauseProducer(producerKey);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to pause producer:", err);
//       callback({ error: "Failed to pause producer" });
//     }
//   });

//   socket.on("unmute", async ({ producerId }, callback) => {
//     if (!socket.userDB) return;
//     try {
//       const producerKey = `${initKey}:${producerId}:audio`;
//       await resumeProducer(producerKey);
//       callback({ success: true });
//     } catch (err) {
//       console.error("Failed to resume producer:", err);
//       callback({ error: "Failed to resume producer" });
//     }
//   });
// };

// interface ProducerData {
//   id: string;
//   userId: string;
//   kind: string;
//   paused: boolean;
//   [key: string]: any;
// }

// export const getAllActiveProducers = async (
//   userId: string,
//   channelId: string
// ): Promise<ProducerData[]> => {
//   const activeSetKey = `activeProducers:${channelId}`;
//   const producerKeys = await redis.smembers(activeSetKey);

//   const results: ProducerData[] = [];

//   for (const key of producerKeys) {
//     const [, producerUserId, , producerId] = key.split(":");

//     if (producerUserId === userId) continue;

//     const data = await redis.hgetall(key);

//     if (Object.keys(data).length > 0) {
//       results.push({
//         id: data.id ?? producerId,
//         userId: producerUserId,
//         kind: data.kind,
//         paused: data.paused === "true",
//         ...data,
//       });
//     }
//   }

//   return results;
// };
