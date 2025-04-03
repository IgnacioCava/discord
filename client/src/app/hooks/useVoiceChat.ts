import socket from "@/lib/socket";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  AnswerProps,
  CreatePeerConnectionArgs,
  IceCandidateProps,
  OfferProps,
  UserJoinedProps,
  UserLeftProps,
} from "./types";
import { useMediaStream } from "./useMediaStream";
import debounce from "lodash.debounce";
import { setVideoBitrate } from "@/utils/setVideoBitrate";
import { setStreamCodec } from "@/utils/setStreamCodec";

export const useVoice = () => {
  const { data: session } = useSession();
  const peerConnections = useRef<
    Record<string, { connection: RTCPeerConnection; socketId: string }>
  >({});
  //const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<
    { userId: string; socketId: string; stream: MediaStream }[]
  >([]);
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<
    { userId: string; socketId: string; stream: MediaStream }[]
  >([]);
  //const gainNodeRef = useRef<GainNode | null>(null);
  const [micAvailable, setMicAvailable] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const {
    localAudioSource,
    localVideoSource,
    muteAudio,
    unmuteAudio,
    clearAudioStream,
    checkGainNode,
    startScreenShare,
    stopScreenShare,
    muteScreenAudio,
    unmuteScreenAudio,
  } = useMediaStream(peerConnections);

  useEffect(() => {
    localVideoSource?.getTracks().forEach((track) => {
      Object.values(peerConnections.current).forEach(({ connection }) => {
        const transceivers = connection.getTransceivers();
        let transceiver = transceivers.find(
          (t) => t.sender.track?.kind === track.kind
        );
        if (transceiver?.sender.track === null) {
          transceiver.stop();
        }

        if (transceiver) transceiver.sender.replaceTrack(track);
        else
          transceiver = connection.addTransceiver(track, {
            direction: "sendonly",
            streams: [localVideoSource],
          });
        const videoCapabilities = RTCRtpReceiver.getCapabilities("video");
        console.log(videoCapabilities);

        if (track.kind === "video") {
          setVideoBitrate(transceiver.sender, 1_000_000); // ~1 Mbps for screen sharing
        }
        track.onended = () => {
          transceiver.sender.replaceTrack(null);
          transceiver.stop();
          track.stop();
        };

        connection.onconnectionstatechange = () => {
          if (connection.connectionState === "closed") {
            transceiver.sender.replaceTrack(null);
            transceiver.stop();
            track.stop();
          }
        };
      });
    });
  }, [peerConnections, localVideoSource, channelId]);

  useEffect(() => {
    socket.on("user-joined", async ({ userId, socketId }: UserJoinedProps) => {
      const peerConnection = createPeerConnection({ userId, socketId });
      const transceivers = peerConnection.getTransceivers();

      if (localAudioSource) {
        localAudioSource.getTracks().forEach((track) => {
          let transceiver = transceivers.find(
            (t) => t.sender.track?.id === track.id
          );
          if (transceiver) {
            setStreamCodec(transceiver, "audio");
            transceiver.sender.replaceTrack(track);
          } else {
            transceiver = peerConnection.addTransceiver(track, {
              direction: "sendonly",
              streams: [localAudioSource],
            });
            setStreamCodec(transceiver, "audio");
          }
          track.onended = () => {
            if (transceiver) transceiver.stop();
          };
        });
      }

      if (localVideoSource && localVideoSource.active) {
        //const senders = peerConnection.getSenders();
        localVideoSource.getTracks().forEach((track) => {
          let transceiver = transceivers.find(
            (t) => t.sender.track?.id === track.id
          );
          if (transceiver) {
            setStreamCodec(transceiver, "video");
            transceiver.sender.replaceTrack(track);
          } else {
            transceiver = peerConnection.addTransceiver(track, {
              direction: "sendonly",
              streams: [localVideoSource],
            });
            setStreamCodec(transceiver, "video");
          }
          setVideoBitrate(transceiver.sender, 1_000_000); // ~1 Mbps for screen sharing

          track.onended = () => {
            if (transceiver) transceiver.stop();
            console.log("ended share");
          };
        });
      }
    });

    socket.on("answer", async ({ answer, userId }: AnswerProps) => {
      const peerConnection = peerConnections.current[userId].connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("offer", async ({ offer, socketId, userId }: OfferProps) => {
      let peerConnection = peerConnections.current[userId]?.connection;
      //const offerCollision = makingOffer || peerConnection.signalingState === 'stable';
      // Only create a new connection if it doesn't already exist
      if (!peerConnection) {
        peerConnection = createPeerConnection({ userId, socketId });
        peerConnections.current[userId] = {
          socketId,
          connection: peerConnection,
        };
      }
      const transceivers = peerConnection.getTransceivers();

      if (localAudioSource) {
        localAudioSource.getTracks().forEach((track) => {
          let transceiver = transceivers.find(
            (t) => t.sender.track?.id === track.id
          );
          if (transceiver) {
            setStreamCodec(transceiver, "audio");
            transceiver.sender.replaceTrack(track);
          } else {
            transceiver = peerConnection.addTransceiver(track, {
              direction: "sendonly",
              streams: [localAudioSource],
            });
            setStreamCodec(transceiver, "audio");
          }
          const audioCapabilities = RTCRtpReceiver.getCapabilities("audio");
          const preferredAudioCodecs = audioCapabilities?.codecs.filter(
            (codec) => codec.mimeType === "audio/opus"
          );
          if (preferredAudioCodecs && preferredAudioCodecs.length > 0) {
            transceiver?.setCodecPreferences(preferredAudioCodecs);
          }
        });
      }
      if (localVideoSource && localVideoSource.active) {
        const transceivers = peerConnection.getTransceivers();
        localVideoSource.getTracks().forEach((track) => {
          let transceiver = transceivers.find(
            (t) => t.sender.track?.id === track.id
          );
          if (transceiver) {
            setStreamCodec(transceiver, "video");
            transceiver.sender.replaceTrack(track);
          } else {
            transceiver = peerConnection.addTransceiver(track, {
              direction: "sendonly",
              streams: [localVideoSource],
            });
            setStreamCodec(transceiver, "video");
          }
          setVideoBitrate(transceiver.sender, 1_000_000); // ~1 Mbps for screen sharing
        });
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { answer, to: socketId });
    });

    socket.on(
      "ice-candidate",
      async ({ candidate, userId }: IceCandidateProps) => {
        const peerConnection = peerConnections.current[userId]?.connection;
        // if (!peerConnection || !peerConnection.remoteDescription) {
        //   // Queue candidate until remote description is set
        //   if (!pendingCandidates.current[userId]) {
        //     pendingCandidates.current[userId] = [];
        //   }
        //   pendingCandidates.current[userId].push(candidate);
        //   return;
        // }
        if (candidate && peerConnection) {
          try {
            //await peerConnections.current[userId].addIceCandidate(candidate);
            await peerConnection.addIceCandidate(candidate);
          } catch (e) {
            console.error("Error adding received ice candidate", e);
          }
        }
      }
    );
    socket.on("user-left", ({ userId }: UserLeftProps) => {
      const connection = peerConnections.current[userId].connection;
      if (connection) {
        peerConnections.current[userId].connection
          .getTransceivers()
          .forEach((transceiver) => {
            transceiver.sender.replaceTrack(null);
            transceiver.stop(); // Properly stop the transceiver
          });
        peerConnections.current[userId].connection.close();
      }

      setRemoteStreams((prev) =>
        prev.filter((stream) => stream.userId !== userId)
      );
      setRemoteVideoStreams((prev) =>
        prev.filter((stream) => stream.userId !== userId)
      );
      delete peerConnections.current[userId];
    });

    socket.on("disconnect", () => {
      peerConnections.current = {};
      setRemoteStreams([]);
      setRemoteVideoStreams([]);
    });

    const createPeerConnection = ({
      userId,
      socketId,
    }: CreatePeerConnectionArgs) => {
      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
      const peerConnection = new RTCPeerConnection(configuration);

      peerConnection.onicecandidate = (event) => {
        if (
          event.candidate?.type &&
          ["relay", "srflx"].includes(event.candidate.type)
        ) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: socketId,
          });
        }
      };
      peerConnection.ontrack = (event) => {
        const incomingStream = event.streams[0];
        incomingStream.getTracks().forEach((track) => {
          //if(track.muted) return
          if (track.kind === "video") {
            setRemoteVideoStreams((prevStreams) => [
              ...prevStreams.filter((stream) => stream.userId !== userId),
              { userId, socketId, stream: incomingStream },
            ]);
          }

          if (track.kind === "audio") {
            setRemoteStreams((prevStreams) => [
              ...prevStreams.filter((stream) => stream.userId !== userId),
              { userId, socketId, stream: incomingStream },
            ]);
          }
        });

        incomingStream.onremovetrack = (event) => {
          if (event.track.kind === "video") {
            setRemoteVideoStreams((prevStreams) =>
              prevStreams.filter((stream) => stream.userId !== userId)
            );
          }
          if (event.track.kind === "audio") {
            setRemoteStreams((prevStreams) =>
              prevStreams.filter((stream) => stream.userId !== userId)
            );
          }
        };
      };

      const debouncedNegotiation = debounce(
        async () => {
          try {
            if (peerConnection.signalingState !== "stable") return;
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", { offer, to: socketId });
          } catch (error) {
            console.log(error);
          }
        },
        50,
        { leading: true }
      );

      peerConnection.onnegotiationneeded = () => {
        debouncedNegotiation();
      };

      peerConnections.current[userId] = {
        connection: peerConnection,
        socketId,
      };
      return peerConnection;
    };

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("user-left");
      socket.off("user-joined");
      socket.off("ice-candidate");
    };
  }, [localAudioSource, localVideoSource, remoteVideoStreams]);
  const startVoiceChat = async (channelId: string) => {
    if (!session?.user.id) return;
    setChannelId(channelId);

    socket.emit("join-voice-channel", channelId);

    //Implement TURN servers for improved NAT traversal.
    // socket.on("user-left", ({ userId, socketId }: UserLeftPayload) => {
    //   if (peerConnections.current[userId]) {
    //     peerConnections.current[userId].getSenders().forEach((sender) => {
    //       peerConnections.current[userId].removeTrack(sender);
    //     });
    //     // localStream.getTracks().forEach((track) => {
    //     //   peerConnections.current[userId].removeTrack(track);
    //     // });
    //     setRemoteStreams((prev) =>
    //       prev.filter((stream) => stream.userId !== userId)
    //     );
    //     peerConnections.current[userId].close();
    //     delete peerConnections.current[userId];
    //   }
    // });
  };

  const leaveVoiceChat = (channelId: string) => {
    socket.emit("leave-voice-channel", channelId);
    Object.values(peerConnections.current).forEach(({ connection }) => {
      connection.getTransceivers().forEach((transceiver) => {
        console.log({ transceiver });
        transceiver.sender.replaceTrack(null); // Ensure no track is sent
        transceiver.stop();
      });

      connection.close();
    });
    localVideoSource?.getTracks().forEach((track) => {
      track.stop();
    });
    peerConnections.current = {};

    setRemoteStreams([]);
    setRemoteVideoStreams([]);
    //clearAudioStream();
  };

  return {
    startVoiceChat,
    leaveVoiceChat,
    localAudioSource,
    remoteStreams,
    remoteVideoStreams,
    muteAudio,
    unmuteAudio,
    checkGainNode,
    startScreenShare,
    stopScreenShare,
    muteScreenAudio,
    unmuteScreenAudio,
  };
};
