import mediasoup from "mediasoup";
import { Io, SocketServer } from "@socket/types";
import { Consumer, Producer, WebRtcTransport } from "mediasoup/node/lib/types";
import { Namespace } from "socket.io";

type TransportType = "send" | "recv";

let worker: mediasoup.types.Worker;
let router: mediasoup.types.Router;
const transports = new Map<
  string,
  { [K in TransportType]?: WebRtcTransport }
>(); // socket.id -> { send, recv }
const producers = new Map<string, Producer>(); // socket.id -> Producer
const consumers = new Map<string, Consumer[]>(); // socket.id -> [Consumers]

export const setupTransportTest2 = async (
  io: Namespace,
  socket: SocketServer
) => {
  if (!worker) {
    worker = await mediasoup.createWorker();
    console.log("Mediasoup worker created", worker.pid);

    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
      ],
    });
  }

  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room-sfu", async (channelId: string, callback) => {
    try {
      if (!socket.userDB || !channelId)
        return callback({ error: "Unauthorized" });
      const userId = socket.userDB.id;

      const sendTransport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        appData: {
          direction: "send",
          userId,
        },
      });

      const recvTransport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: undefined }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        appData: {
          direction: "recv",
          userId,
        },
      });

      transports.set(socket.id, {
        send: sendTransport,
        recv: recvTransport,
      });

      socket.data.channelId = `sfu-${channelId}`;
      socket.join(`sfu-${channelId}`);
      socket.to(socket.data.channelId).emit("user-joined", { userId });
      console.log(
        `join-room: ${socket.userDB.name} joined and created transports`
      );

      const sendTransportOptions = {
        id: sendTransport.id,
        iceParameters: sendTransport.iceParameters,
        iceCandidates: sendTransport.iceCandidates,
        dtlsParameters: sendTransport.dtlsParameters,
      };
      const recvTransportOptions = {
        id: recvTransport.id,
        iceParameters: recvTransport.iceParameters,
        iceCandidates: recvTransport.iceCandidates,
        dtlsParameters: recvTransport.dtlsParameters,
      };

      return callback({
        sendTransportOptions,
        recvTransportOptions,
        rtpCapabilities: router.rtpCapabilities,
        existingProducers: [...producers.values()].map(
          ({ id, appData, kind, paused, type }) => ({
            id,
            appData,
            kind,
            paused,
          })
        ),
      });
    } catch (error) {
      return callback({ error });
    }
  });

  socket.on(
    "connect-transport",
    ({ dtlsParameters, transportId, direction }, callback) => {
      try {
        if (!socket.data.channelId || !socket.userDB)
          return callback({ error: "Unauthorized" });
        const userTransport = transports.get(socket.id)?.[
          direction as TransportType
        ];
        console.log(socket.id, direction);
        if (!userTransport || userTransport.id !== transportId)
          return callback({ error: "No transport found" });
        userTransport.connect({ dtlsParameters });
        console.log(
          `connect-transport: ${direction} transport connected for user ${socket.userDB.name}`
        );
        return callback({ connected: true });
      } catch (error) {
        return callback({ error });
      }
    }
  );

  socket.on(
    "produce",
    async ({ kind, transportId, rtpParameters }, callback) => {
      try {
        if (!socket.data.channelId || !socket.userDB)
          return callback({ error: "Unauthorized" });

        const sendTransport = transports.get(socket.id)?.send;
        if (!sendTransport || sendTransport.id !== transportId)
          return callback({ error: "No producer transport found" });

        const producer = await sendTransport.produce({ rtpParameters, kind });
        await producer.resume();

        producers.set(socket.id, producer);
        socket.to(socket.data.channelId).emit("new-producer", producer.id);
        console.log(`produce: producer created for user ${socket.userDB.name}`);
        return callback({ producerId: producer.id });
      } catch (error) {
        return callback({ error });
      }
    }
  );

  socket.on(
    "consume",
    async ({ rtpCapabilities, transportId, producerId }, callback) => {
      try {
        if (!socket.data.channelId || !socket.userDB)
          return callback({ error: "Unauthorized" });

        if (!router.canConsume({ producerId, rtpCapabilities })) {
          console.error("Cannot consume this producer with given capabilities");
          return callback({ error: "Cannot consume" });
        }

        const recvTransport = transports.get(socket.id)?.recv;
        if (!recvTransport || recvTransport.id !== transportId)
          return callback({ error: "No consumer transport found" });
        console.log({ producerId });
        const consumer = await recvTransport.consume({
          rtpCapabilities,
          producerId,
          paused: false,
        });
        await consumer.resume();
        if (!consumers.has(socket.id)) consumers.set(socket.id, [consumer]);
        consumers.get(socket.id)?.push(consumer);
        console.log(`consume: consumer created for user ${socket.userDB.name}`);

        callback({
          id: consumer.id,
          rtpParameters: consumer.rtpParameters,
          kind: consumer.kind,
          producerId,
        });
      } catch (error) {
        console.log("Error consume:", error);
        return callback({ error });
      }
    }
  );

  socket.on("transports", async () => {
    const transport = transports.get(socket.id);
    console.log(
      "prod",
      transport?.send?.dtlsState,
      transport?.send?.iceState,
      transport?.send?.sctpParameters,
      transport?.send?.sctpState
    );
    console.log(
      "cons",
      transport?.recv?.dtlsState,
      transport?.recv?.iceState,
      transport?.recv?.sctpParameters,
      transport?.recv?.sctpState
    );
  });

  socket.on("leave-room-sfu", () => {
    if (!socket.data.channelId || !socket.userDB)
      return console.log({ error: "Unauthorized" });
    producers.get(socket.id)?.close();
    consumers.get(socket.id)?.forEach((c) => c.close());
    const userTransports = transports.get(socket.id);
    if (userTransports?.send) userTransports.send.close();
    if (userTransports?.recv) userTransports.recv.close();

    transports.delete(socket.id);
    producers.delete(socket.id);
    consumers.delete(socket.id);

    const channelId = socket.data.channelId;

    socket.leave(channelId);
    socket.to(channelId).emit("user-left", { userId: socket.userDB.id });
  });

  // Cleanup
  socket.on("disconnect", () => {
    const userTransports = transports.get(socket.id);
    if (userTransports?.send) userTransports.send.close();
    if (userTransports?.recv) userTransports.recv.close();
    if (producers.get(socket.id)) producers.get(socket.id)?.close();
    if (consumers.get(socket.id))
      consumers.get(socket.id)?.forEach((c) => c.close());

    transports.delete(socket.id);
    producers.delete(socket.id);
    consumers.delete(socket.id);
    console.log("Client disconnected:", socket.id);
  });
};
