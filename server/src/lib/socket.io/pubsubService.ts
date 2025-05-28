import { createAdapter } from "@socket.io/redis-adapter";
import { setupWorker } from "@socket.io/sticky";
import Redis from "ioredis";
import type { Server } from "socket.io";

export const initPubSubService = (io: Server) => {
  console.log("REDIS_URL", process.env.REDIS_URL);
  const pubClient = new Redis(
    //process.env.REDIS_URL || "redis://localhost:6379"
    process.env.REDIS_URL || "redis://redis:6379"
  );
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("PubClient error", err));
  subClient.on("error", (err) => console.error("SubClient error", err));

  io.adapter(createAdapter(pubClient, subClient, { requestsTimeout: 5000 }));

  // only works with internal cluster mode
  // sticky sessions are handled by @socket.io/sticky in internal clusters, and by nginx in external ones
  if (process.env.CLUSTER_MODE === "internal") {
    setupWorker(io);
  }
};
