import socket from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
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
import { useMediaStream } from "./useMediaStream";

interface ProducerData {
  id: string;
  userId: string;
  kind: MediaKind;
  paused: boolean;
  channelId: string;
  transportId: string;
  rtpParameters: string;
  [key: string]: unknown;
}

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
  availableProducers?: ProducerData[];
}

export const useVoiceClientTest = (channelId: string) => {
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producerRef = useRef<Producer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>();
  const [remoteAudio, setRemoteAudio] = useState<MediaStream | null>(null);

  const { localAudioSource } = useMediaStream();

  // === Initialize Mediasoup Device ===
  const loadDevice = async () => {
    try {
      if (!deviceRef.current) {
        const rtpCapabilities: RtpCapabilities = await new Promise((res) => {
          socket.emit("get-router-rtp-capabilities", null, res);
        });
        const device = new Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = device;
      }
    } catch (error) {
      console.log(error);
    }
  };

  // === Create Send Transport ===
  const createSendTransport = async () => {
    if (!deviceRef.current) return;

    const transportOptions: TransportOptions = await new Promise((res) => {
      socket.emit("create-transport", { channelId, direction: "send" }, res);
    });
    console.log(transportOptions);
    const transport = deviceRef.current.createSendTransport(transportOptions);

    const transportConnectPromise = new Promise<void>((resolve, reject) => {
      transport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit(
          "connect-transport",
          { dtlsParameters, transportId: transport.id, direction: "send" },
          () => {
            callback();
            resolve();
          }
        );
      });

      transport.on("connectionstatechange", (state) => {
        console.log({ state });
        if (state === "failed" || state === "disconnected") {
          reject(new Error(`Send transport connection failed: ${state}`));
        }
      });
    });
    transport.on("produce", ({ kind, rtpParameters }, callback) => {
      socket.emit(
        "produce",
        { kind, rtpParameters, transportId: transport.id },
        callback
      );
    });

    console.log({ localAudioSource });
    if (localAudioSource) {
      const track = localAudioSource.getTracks()[0];
      //console.log("Publishing local track:", track);
      track.enabled = true;
      const producer = await transport.produce({ track });
      console.log({ producer });
      producer.resume();
      producerRef.current = producer;
      const newTrack = new MediaStream();
      newTrack.addTrack(track);
      setLocalStream(newTrack);
    }
    await transportConnectPromise;
    sendTransportRef.current = transport;
  };

  // === Consume Audio ===
  const consumeAudio = async (producerId: string, userId: string) => {
    if (!deviceRef.current || !recvTransportRef.current) {
      console.warn("Missing device or transport");
      return;
    }
    if (!deviceRef.current) return;
    if (!recvTransportRef.current) return;
    const consumerOptions: ConsumerOptions = await new Promise((res) => {
      socket.emit(
        "consume",
        {
          transportId: recvTransportRef.current!.id,
          producerId,
          rtpCapabilities: deviceRef.current!.rtpCapabilities,
          kind: "audio",
          userId,
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
    consumer.resume();
    console.log(consumer.track);

    //console.log("Received track:", consumer.track);

    const stream = new MediaStream();
    stream.addTrack(consumer.track);
    setRemoteAudio(stream);
  };

  // === Create Receive Transport ===
  const createRecvTransport = async () => {
    try {
      if (!deviceRef.current) return;
      const transportOptions: TransportOptions = await new Promise((res) => {
        socket.emit("create-transport", { channelId, direction: "recv" }, res);
      });

      const transport = deviceRef.current.createRecvTransport(transportOptions);
      recvTransportRef.current = transport;

      // const transportConnectPromise = new Promise<void>((resolve, reject) => {
      //   transport.on("connect", ({ dtlsParameters }, callback) => {
      //     socket.emit(
      //       "connect-transport",
      //       { dtlsParameters, direction: "recv" },
      //       () => {
      //         callback();
      //         resolve();
      //       }
      //     );
      //   });

      //   transport.on("connectionstatechange", (state) => {
      //     if (state === "failed" || state === "disconnected") {
      //       reject(new Error(`Recv transport connection failed: ${state}`));
      //     }
      //   });
      // });

      transport.on("connect", ({ dtlsParameters }, callback) => {
        socket.emit(
          "connect-transport",
          { dtlsParameters, transportId: transport.id, direction: "recv" },
          async () => {
            callback();
            if (transportOptions.availableProducers?.length) {
              console.log("transportOptions");
              await Promise.all(
                transportOptions.availableProducers.map((producer) => {
                  consumeAudio(producer.id, producer.userId);
                })
              );
            }
          }
        );
      });

      // transport.on("connectionstatechange", (state) => {
      //   console.log("Send Transport state:", state);
      // });
      //await transportConnectPromise;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleNewProducer = async ({
      producerId,
      userId,
    }: {
      producerId: string;
      userId: string;
    }) => {
      await consumeAudio(producerId, userId);
    };

    socket.on("new-producer", handleNewProducer);
    return () => {
      socket.off("new-producer", handleNewProducer);
      recvTransportRef.current?.close();
      recvTransportRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!remoteAudio) return;
    const audio = new Audio();
    audio.srcObject = remoteAudio;
    audio.autoplay = true;
    audio.play().catch((err) => console.warn("Audio playback error", err));
  }, [remoteAudio]);

  const joinVoiceChat = async () => {
    socket.emit("join-sfu-voice-channel", { channelId }, async () => {
      await loadDevice();
      await createRecvTransport();
      await createSendTransport();
    });
  };

  const leaveVoiceChat = () => {
    socket.emit("leave-sfu-voice-channel", { channelId }, () => {});
  };

  return {
    joinVoiceChat,
    leaveVoiceChat,
    remoteAudio,
    track: localStream,
  };
};
