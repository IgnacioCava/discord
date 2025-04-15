import { useEffect, useRef, useState, useCallback } from "react";
import { Device } from "mediasoup-client";
import socket from "@/lib/socket"; // Updated: using your central socket instance
import type {
  RtpCapabilities,
  IceParameters,
  IceCandidate,
  DtlsParameters,
  Transport,
  Producer,
  Consumer,
  MediaKind,
  RtpParameters,
} from "mediasoup-client/types";
import { useSession } from "next-auth/react";
import { useMediaStream } from "./useMediaStream";

interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
}

interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
}

export function useVoiceClient(roomId: string | null) {
  const { data: session } = useSession();
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producerRef = useRef<Producer | null>(null);
  const [joined, setJoined] = useState(false);

  // === Initialize Mediasoup Device ===
  const loadDevice = useCallback(async () => {
    if (!deviceRef.current) {
      const device = new Device();
      const rtpCapabilities: RtpCapabilities = await new Promise((res) => {
        socket.emit("get-router-rtp-capabilities", null, res);
      });
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
    }
  }, []);

  // === Create Send Transport ===
  const createSendTransport = useCallback(async () => {
    if (!deviceRef.current) return;

    const transportOptions: TransportOptions = await new Promise((res) => {
      socket.emit("create-transport", { roomId, direction: 'send' }, res);
    });

    const transport = deviceRef.current.createSendTransport(transportOptions);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connect-transport", { dtlsParameters, direction: 'recv' }, callback);
    });

    transport.on("produce", ({ kind, rtpParameters }, callback) => {
      socket.emit(
        "produce",
        { kind, rtpParameters, transportId: transport.id },
        ({ id }: { id: string }) => {
          callback({ id });
        }
      );
    });

    sendTransportRef.current = transport;
  }, [roomId]);

  // === Create Receive Transport ===
  const createRecvTransport = useCallback(async () => {
    if (!deviceRef.current) return;

    const transportOptions: TransportOptions = await new Promise((res) => {
      socket.emit("create-transport", { roomId, direction: 'recv' }, res);
    });

    const transport = deviceRef.current.createRecvTransport(transportOptions);

    transport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connect-transport", { dtlsParameters, direction: 'recv' }, callback);
    });

    recvTransportRef.current = transport;
  }, [roomId]);

  // === Produce Audio ===
  const joinVoice = useCallback(async () => {
    if (!sendTransportRef.current) return;
    if (!roomId) return;
    await loadDevice();
    await createSendTransport();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];

    const producer = await sendTransportRef.current.produce({ track });
    producerRef.current = producer;

    setJoined(true);
  }, [roomId, loadDevice, createSendTransport]);

  // === Consume Audio ===
  const consumeAudio = useCallback(
    async (producerId: string) => {
      if (!recvTransportRef.current || !deviceRef.current) return;
      await createRecvTransport();

      const consumerOptions: ConsumerOptions = await new Promise((res) => {
        socket.emit(
          "consume",
          {
            producerId,
            rtpCapabilities: deviceRef.current!.rtpCapabilities,
            kind: 'audio'
          },
          res
        );
      });

      const consumer: Consumer = await recvTransportRef.current.consume({
        id: consumerOptions.id,
        producerId: consumerOptions.producerId,
        kind: consumerOptions.kind,
        rtpParameters: consumerOptions.rtpParameters,
      });

      const stream = new MediaStream();
      stream.addTrack(consumer.track);
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play();
    },
    [createRecvTransport]
  );

  const leaveVoice = useCallback(() => {
    producerRef.current?.close();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    producerRef.current = null;
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    setJoined(false);
  }, []);

  useEffect(() => {
    return () => leaveVoice(); // cleanup on unmount
  }, [leaveVoice]);

  const mute = () => {
    if (!producerRef.current) return;
    socket.emit(
      "mute",
      { producerId: producerRef.current.id },
      (res: { success?: boolean; error?: string }) => {
        if (res?.error) console.error(res.error);
      }
    );
  };

  const unmute = () => {
    if (!producerRef.current) return;
    socket.emit(
      "unmute",
      { producerId: producerRef.current.id },
      (res: { success?: boolean; error?: string }) => {
        if (res?.error) console.error(res.error);
      }
    );
  };

  // useEffect(() => {
  //   const reconnect = async () => {
  //     socket.emit(
  //       "restore-session",
  //       { userId: session?.user.id, roomId },
  //       async (data: {
  //         consumers: { paused: boolean; kind: MediaKind, producerId: string }[];
  //         producers: { paused: boolean; kind: MediaKind }[];
  //         transport: TransportOptions;
  //         error?: string;
  //       }) => {
  //         if (data.error) return console.error("Restore error:", data.error);

  //         const {
  //           transport,
  //           producers,
  //           consumers,
  //         } = data;

  //         // Recreate sendTransport from restored transport
  //         const sendTransport = await createSendTransport(transport);

  //         for (const producer of producers) {
  //           const track = await getUserMediaTrack(producer.kind);
  //           const newProducer = await sendTransport.produce({ track });

  //           if (producer.paused) await newProducer.pause();
  //           socket.emit("store-producer", {
  //             id: newProducer.id,
  //             kind: producer.kind,
  //             paused: producer.paused,
  //             rtpParameters: newProducer.rtpParameters,
  //             transportId: sendTransport.id,
  //           });
  //         }

  //         const recvTransport = await getOrCreateRecvTransport();

  //         for (const consumer of consumers) {
  //           socket.emit(
  //             "consume",
  //             { producerId: consumer.producerId },
  //             async ({ rtpParameters, id, kind }) => {
  //               const newConsumer = await recvTransport.consume({
  //                 id,
  //                 producerId: consumer.producerId,
  //                 kind,
  //                 rtpParameters,
  //               });

  //               if (consumer.paused) await newConsumer.pause();

  //               attachAudioToDOM(newConsumer.track, consumer.producerId);

  //               socket.emit("store-consumer", {
  //                 id: newConsumer.id,
  //                 kind: consumer.kind,
  //                 producerId: consumer.producerId,
  //                 paused: consumer.paused,
  //                 rtpParameters: newConsumer.rtpParameters,
  //               });
  //             }
  //           );
  //         }
  //       }
  //     );
  //   };

  //   socket.on("connect", reconnect);
  //   return () => {
  //     socket.off("connect", reconnect);
  //   };
  // }, [userId, roomId]);

  const attachAudioToDOM = (track: MediaStreamTrack, id: string) => {
    if (audioRefs.current.has(id)) return;

    const audio = new Audio();
    audio.srcObject = new MediaStream([track]);
    audio.autoplay = true;
    audioRefs.current.set(id, audio);
  };

  const getOrCreateRecvTransport = async (device, socket) => {
    if (recvTransport) return recvTransport;

    return new Promise((resolve, reject) => {
      socket.emit(
        "create-recv-transport",
        {},
        async ({ transportOptions, error }) => {
          if (error) return reject(error);

          try {
            recvTransport = device.createRecvTransport(transportOptions);

            recvTransport.on(
              "connect",
              ({ dtlsParameters }, callback, errback) => {
                socket.emit(
                  "connect-transport",
                  {
                    transportId: recvTransport.id,
                    dtlsParameters,
                  },
                  (response) => {
                    if (response.error) return errback(response.error);
                    callback();
                  }
                );
              }
            );

            resolve(recvTransport);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  async function getUserMediaTrack(kind: "audio" | "video") {
    const stream = await navigator.mediaDevices.getUserMedia({
      [kind]: true,
    });
    return stream.getTracks()[0];
  }

  return {
    joinVoice,
    consumeAudio,
    leaveVoice,
    joined,
    mute,
    unmute,
  };
}
