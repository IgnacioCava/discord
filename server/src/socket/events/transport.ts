import { Io, SocketServer } from "@socket/types";
import { createWorker, getWorker } from "@lib/mediasoupWorker";
import { routerOptions, webRtcTransportOptions } from "@lib/mediasoupConfig";
import { types as mediasoupTypes } from "mediasoup";
import redis from "@lib/redis";

let router: mediasoupTypes.Router;

const transports = new Map<string, mediasoupTypes.WebRtcTransport>();

export const setupTransport = async (io: Io, socket: SocketServer) => {
  if (!router) {
    const worker = await createWorker();
    router = await worker.createRouter(routerOptions);
  }
  socket.on("create-transport", async (_, callback) => {
    const transport = await createTransport(router, socket, '1')

    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });

    transport.on("dtlsstatechange", (state) => {
      if (state === "closed") transport.close();
    });

    socket.on("disconnect", () => transport.close());
  });

  socket.on("connect-transport", async ({ transportId, dtlsParameters }) => {
    // const transport = router.getTransportById(transportId);

    // await redis.hmset(`transport:${transport.id}`, {
    //   userId: socket.userDB.id,
    //   roomId,
    //   dtlsParameters: JSON.stringify(transport.dtlsParameters),
    //   iceParameters: JSON.stringify(transport.iceParameters),
    // });

    // if (transport) await transport.connect({ dtlsParameters });
  });
};

export const createTransport = async (
  router: mediasoupTypes.Router,
  socket: any,
  roomId: string
) => {
  const transport = await router.createWebRtcTransport(webRtcTransportOptions);

  transports.set(transport.id, transport);

  // Store metadata in Redis
  await redis.hmset(`transport:${transport.id}`, {
    userId: socket.userDB.id,
    roomId,
    dtlsParameters: JSON.stringify(transport.dtlsParameters),
    iceParameters: JSON.stringify(transport.iceParameters),
  });

  return transport;
};

export const restoreTransports = async (router: mediasoupTypes.Router) => {
  const transportKeys = await redis.keys("transport:*");

  for (const key of transportKeys) {
      const transportData = await redis.hgetall(key);

      // const transport = await router.createWebRtcTransport({
      //     listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
      //     enableUdp: true,
      //     enableTcp: true,
      //     preferUdp: true
      // });

      //transports.set(key.split(":")[1], transport); // Store in memory for active use
  }

  console.log(`✅ Restored ${transportKeys.length} transports from Redis.`);
};