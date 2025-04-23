"use client";

import { Device } from "mediasoup-client";
import React, { useRef, useState } from "react";
import { sfuSocket } from "@/lib/socket";
import {
  RtpCapabilities,
  Device as DeviceType,
  Transport,
  Producer,
  IceParameters,
  IceCandidate,
  DtlsParameters,
  MediaKind,
  RtpParameters,
} from "mediasoup-client/types";
import { useLocalMedia } from "../providers/MediaConfigProvider";

interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
}

interface JoinRoomResponse {
  sendTransportOptions: TransportOptions;
  recvTransportOptions: TransportOptions;
  peerIds: string[];
  rtpCapabilities: RtpCapabilities;
  existingProducers: {
    producerId: string;
    peerId: string;
    kind: MediaKind;
  }[];
  error?: string;
}

interface RemoteStream {
  peerId: string;
  producerId: string;
  stream: MediaStream;
}

export default function SFUVoiceTest2({ channelId }: { channelId: string }) {
  const {
    localAudioSource,
    localVideoSource,
    localWebcamSource,
    startScreenShare,
    stopScreenShare,
    startWebcam,
    stopWebcam,
  } = useLocalMedia();
  const [device, setDevice] = useState<DeviceType | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<RemoteStream[]>(
    []
  );
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<RemoteStream[]>(
    []
  );

  const [sendTransport, setSendTransport] = useState<Transport | null>(null);
  const [recvTransport, setRecvTransport] = useState<Transport | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [joined, setJoined] = useState(false);
  const [videoProducer, setVideoProducer] = useState<Producer | null>(null);
  const [audioProducer, setAudioProducer] = useState<Producer | null>(null);
  const [screenProducer, setScreenProducer] = useState<Producer | null>(null);
  const [roomId, setRoomId] = useState<string | null>(channelId);
  const localVideoRef = useRef<MediaStream>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const deviceRef = useRef<DeviceType | null>(null);

  const createDevice = async (rtpCapabilities: RtpCapabilities) => {
    const newDevice = new Device();
    await newDevice.load({ routerRtpCapabilities: rtpCapabilities });
    setDevice(newDevice);
    deviceRef.current = newDevice;
    return newDevice;
  };

  const createSendTransport = (
    device: DeviceType,
    transportOptions: TransportOptions
  ) => {
    const newSendTransport = device.createSendTransport(transportOptions);
    newSendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      try {
        sfuSocket.emit(
          "connect-transport",
          {
            transportId: newSendTransport.id,
            dtlsParameters,
            roomId,
            peerId: sfuSocket.id,
          },
          async (response: { connected?: boolean; error?: string }) => {
            if (response.error) return console.log(response.error);
            callback();
          }
        );
      } catch (error) {
        errback(error as Error);
      }
    });

    newSendTransport.on(
      "produce",
      ({ kind, rtpParameters }, callback, errback) => {
        try {
          sfuSocket.emit(
            "produce",
            {
              transportId: newSendTransport.id,
              kind,
              rtpParameters,
              roomId,
              peerId: sfuSocket.id,
            },
            (response: { producerId: string; error?: string }) => {
              if (response.error) return console.log(response.error);
              callback({ id: response.producerId });
              setSendTransport(newSendTransport);
            }
          );
        } catch (error) {
          errback(error as Error);
        }
      }
    );

    return newSendTransport;
  };

  const createRecvTransport = (
    device: DeviceType,
    transportOptions: TransportOptions
  ) => {
    const newRecvTransport = device.createRecvTransport(transportOptions);
    newRecvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
      try {
        sfuSocket.emit(
          "connect-transport",
          {
            transportId: newRecvTransport.id,
            dtlsParameters,
            roomId,
            peerId: sfuSocket.id,
          },
          async (response: { connected?: boolean; error?: string }) => {
            if (response.error) return console.log(response.error);
            callback();
          }
        );
      } catch (error) {
        errback(error as Error);
      }
    });
    setRecvTransport(newRecvTransport);
    recvTransportRef.current = newRecvTransport;
    return newRecvTransport;
  };

  const getLocalAudioStreamAndTrack = async () => {
    if (!localAudioSource) return;
    const audioTrack = localAudioSource.getAudioTracks()[0];
    return audioTrack;
  };

  const joinRoom = () => {
    if (!sfuSocket || !roomId) return;
    if (window.confirm("join?")) {
      sfuSocket.emit(
        "join-room",
        { roomId, peerId: sfuSocket.id },
        async (response: JoinRoomResponse) => {
          if (response.error) {
            console.error("Error joining room:", response.error);
            return;
          }

          const {
            sendTransportOptions,
            recvTransportOptions,
            rtpCapabilities,
            peerIds,
            existingProducers,
          } = response;

          const newDevice = await createDevice(rtpCapabilities);
          const newSendTransport = createSendTransport(
            newDevice,
            sendTransportOptions
          );

          createRecvTransport(newDevice, recvTransportOptions);

          if (!newDevice.canProduce("audio")) console.log("no audio");

          sfuSocket.on("new-producer", handleNewProducer);
          sfuSocket.on("closed-remote-producer", handleCloseRemoteProducer);

          const audioTrack = await getLocalAudioStreamAndTrack();
          const newAudioProducer = await newSendTransport.produce({
            track: audioTrack,
          });
          newAudioProducer.resume();
          setAudioProducer(newAudioProducer);

          setPeers(peerIds.filter((id) => id !== sfuSocket.id));
          sfuSocket.on("peer-left", ({ peerId }) => {
            setPeers((prevPeers) => prevPeers.filter((id) => id !== peerId));
            setRemoteAudioStreams((prev) =>
              prev.filter((stream) => stream.peerId !== peerId)
            );
            setRemoteVideoStreams((prev) =>
              prev.filter((stream) => stream.peerId !== peerId)
            );
          });

          sfuSocket.on("new-peer", ({ peerId }) => {
            setPeers((prevPeers) => [...prevPeers, peerId]);
          });

          for (const producerInfo of existingProducers) {
            await consume(producerInfo);
          }

          setJoined(true);
        }
      );
    }
  };

  const leaveRoom = () => {
    if (!sfuSocket) return;
    sfuSocket.off("new-producer");
    sfuSocket.emit("leave-room", (response: { error?: string }) => {
      if (response && response.error) {
        console.error("Error leaving room:", response.error);
        return;
      }

      setJoined(false);
      setPeers([]);
      setRemoteAudioStreams([]);
      setRemoteVideoStreams([]);

      // if (localStream) {
      //   localStream.getTracks().forEach((track) => track.stop());
      //   setLocalStream(null);
      // }
      // if (sendTransport) {
      //   sendTransport.close();
      //   setSendTransport(null);
      // }
      // if (recvTransport) {
      //   recvTransport.close();
      //   setRecvTransport(null);
      // }
      // if (device) {
      //   setDevice(null);
      // }
    });
  };

  const handleNewProducer = async ({
    producerId,
    peerId,
  }: {
    producerId: string;
    peerId: string;
  }) => {
    await consume({ producerId, peerId });
  };

  const consume = async ({
    producerId,
    peerId,
  }: {
    producerId: string;
    peerId: string;
  }) => {
    const device = deviceRef.current;
    const recvTransport = recvTransportRef.current;
    if (!device || !recvTransport) {
      console.log("Device or RecvTransport not initialized");
      return;
    }

    sfuSocket.emit(
      "consume",
      {
        transportId: recvTransport?.id,
        producerId,
        roomId,
        peerId: sfuSocket.id,
        rtpCapabilities: device?.rtpCapabilities,
      },
      async (response: {
        id: string;
        producerId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
        error?: string;
      }) => {
        if (response.error)
          return console.error("Error consuming:", response.error);

        const consumerData = response;
        const consumer = await recvTransport.consume({
          id: consumerData.id,
          producerId: consumerData.producerId,
          kind: consumerData.kind,
          rtpParameters: consumerData.rtpParameters,
        });

        consumer.resume();
        consumer.on("@close", () => console.log("close"));
        consumer.on("trackended", () => console.log("close"));
        consumer.on("transportclose", () => console.log("close"));
        consumer.on("@pause", () => console.log("close"));
        consumer.track.onended = () => console.log("close");
        const remoteStream = new MediaStream();
        remoteStream.addTrack(consumer.track);

        if (consumer.track.kind === "audio")
          setRemoteAudioStreams((prev) => [
            ...prev,
            { peerId, stream: remoteStream, producerId },
          ]);
        if (consumer.track.kind === "video")
          setRemoteVideoStreams((prev) => [
            ...prev,
            { peerId, stream: remoteStream, producerId },
          ]);
      }
    );
  };

  const startCamera = async () => {
    try {
      if (!sendTransport) return;

      const stream = await startWebcam();
      if (!stream) return;
      setLocalStream(localWebcamSource);

      if (localVideoRef.current) {
        localVideoRef.current = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];

      const newVideoProducer = await sendTransport.produce({
        track: videoTrack,
      });
      setVideoProducer(newVideoProducer);
    } catch (error) {
      console.log(error);
    }
  };

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      stopWebcam();
    }
    if (localVideoRef.current) {
      localVideoRef.current = null;
    }
    if (videoProducer) {
      videoProducer.close();
      setVideoProducer(null);
    }
    if (audioProducer) {
      audioProducer.close();
      setAudioProducer(null);
    }
  };

  const startScreen = async () => {
    if (!sendTransport) return;
    const stream = await startScreenShare();
    if (!stream) return;
    const screenTrack = stream.getVideoTracks()[0];

    const newScreenProducer = await sendTransport.produce({
      track: screenTrack,
    });
    newScreenProducer.on("trackended", () => {
      sfuSocket.emit("close-producer", {
        producerId: newScreenProducer.id,
        roomId,
      });
      setScreenProducer(null);
    });
    setScreenProducer(newScreenProducer);

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        stopScreenShare();
      };
    });
  };

  const stopScreen = () => {
    if (screenProducer) {
      stopScreenShare();
      screenProducer.close();
      sfuSocket.emit("close-producer", {
        producerId: screenProducer.id,
        roomId,
      });
      setScreenProducer(null);
    }
  };

  const handleCloseRemoteProducer = ({
    producerId,
    kind,
  }: {
    producerId: string;
    kind: MediaKind;
  }) => {
    if (kind === "audio")
      setRemoteAudioStreams((prev) =>
        prev.filter((stream) => stream.producerId !== producerId)
      );
    if (kind === "video")
      setRemoteVideoStreams((prev) =>
        prev.filter((stream) => stream.producerId !== producerId)
      );
  };

  return (
    <div>
      <h1>Mediasoup</h1>
      <h2>My Id: {sfuSocket ? sfuSocket.id : "Not connected"}</h2>
      <h2>Room: {roomId || "none"}</h2>
      {!joined ? (
        <div>
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <button onClick={leaveRoom}>Leave Room</button>
          <button onClick={localStream ? stopCamera : startCamera}>
            {localStream ? "Stop Camera" : "Start Camera"}
          </button>
          <button onClick={screenProducer ? stopScreen : startScreen}>
            {screenProducer ? "Stop Screen Share" : "Start Screen Share"}
          </button>
        </div>
      )}
      <div>
        <h2>Peers in Room</h2>
        <ul>
          {peers.map((peerId) => (
            <li key={peerId}>{peerId}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2>Remote Media</h2>
        {remoteAudioStreams.map((data) => (
          <div key={data.stream.id}>
            {data.peerId}
            <audio
              ref={(audio) => {
                if (audio) {
                  audio.srcObject = data.stream;
                  audio.volume = 1;
                }
              }}
              autoPlay
              muted={false}
              controls
            />
          </div>
        ))}
        {remoteVideoStreams.map((data) => (
          <div key={data.stream.id}>
            {data.peerId}
            <video
              style={{ width: "100%" }}
              ref={(audio) => {
                if (audio) {
                  audio.srcObject = data.stream;
                  audio.volume = 1;
                }
              }}
              autoPlay
              muted={false}
              controls
            />
          </div>
        ))}
      </div>
    </div>
  );
}
