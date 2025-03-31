import { setVideoBitrate } from "@/utils/setVideoBitrate";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export const useMediaStream = (
  peerConnectionsRef: RefObject<
    Record<
      string,
      {
        connection: RTCPeerConnection;
        socketId: string;
      }
    >
  >
) => {
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);

  const gainNodeRef = useRef<GainNode | null>(null);
  const screenGainNodeRef = useRef<GainNode | null>(null);

  const [micAvailable, setMicAvailable] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const setupAudioNode = async () => {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.onended = () => {
        console.log("🎧 Audio track ended");
        setMicAvailable(false);
      };

      const source = audioContext.createMediaStreamSource(
        new MediaStream([audioTrack])
      );
      gainNodeRef.current = audioContext.createGain();
      gainNodeRef.current.gain.value = 1;

      const destination = audioContext.createMediaStreamDestination();
      source.connect(gainNodeRef.current).connect(destination);

      localAudioStreamRef.current = destination.stream;
      setMicAvailable(true);
    };

    const handleDeviceChange = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevice = devices.find((device) => device.kind === "audioinput");
      if (!micDevice) setupAudioNode();
    };

    navigator.mediaDevices.ondevicechange = handleDeviceChange;

    // ⚠️ Only create AudioContext on user interaction
    const handleUserInteraction = () => {
      setupAudioNode();
      window.removeEventListener("click", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);

    return () => {
      navigator.mediaDevices.ondevicechange = null;
      window.removeEventListener("click", handleUserInteraction);
    };
  }, [peerConnectionsRef]);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Request screen audio if available
      });

      screenStream.getAudioTracks().forEach((track) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(
          new MediaStream([track])
        );

        screenGainNodeRef.current = audioContext.createGain();
        screenGainNodeRef.current.gain.value = 1;

        const destination = audioContext.createMediaStreamDestination();
        source.connect(screenGainNodeRef.current).connect(destination);

        // Replace screen audio track with modified one
        screenStream.removeTrack(track);
        destination.stream
          .getAudioTracks()
          .forEach((track) => screenStream.addTrack(track));
      });
      localScreenStreamRef.current = screenStream;

      Object.values(peerConnectionsRef.current).forEach(({ connection }) => {
        const transceivers = connection.getTransceivers();
        screenStream.getTracks().forEach((track) => {
          let transceiver = transceivers.find(
            (t) => t.sender.track?.kind === track.kind
          );

          if (transceiver) transceiver.sender.replaceTrack(track);
          else
            transceiver = connection.addTransceiver(track, {
              direction: "sendonly",
              streams: [screenStream],
            });

          if (track.kind === "video") {
            setVideoBitrate(transceiver.sender, 1_000_000); // ~1 Mbps for screen sharing
          }

          track.onended = () => {
            console.log("onended");
            if (transceiver) {
              transceiver.sender.replaceTrack(null);

              transceiver.stop();
            }
            track.stop();
            console.log("ended share");
            localScreenStreamRef.current = null;
          };
        });
      });
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
    }
  };

  useEffect(() => {
    console.log("peer");
    if (!localScreenStreamRef.current) return;
    localScreenStreamRef.current.getTracks().forEach((track) => {
      console.log("track local");
      Object.values(peerConnectionsRef.current).forEach(({ connection }) => {
        //const senders = connection.getSenders();

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
            streams: [localScreenStreamRef.current!],
          });

        if (track.kind === "video") {
          setVideoBitrate(transceiver.sender, 1_000_000); // ~1 Mbps for screen sharing
        }
        track.onended = () => {
          transceiver.sender.replaceTrack(null);
          transceiver.stop();
          track.stop();
          localScreenStreamRef.current = null;
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
  }, [peerConnectionsRef]);
  const stopScreenShare = useCallback(() => {
    if (localScreenStreamRef.current) {
      const screenStream = localScreenStreamRef.current;

      screenStream.getTracks().forEach((track) => {
        Object.values(peerConnectionsRef.current).forEach(({ connection }) => {
          //const senders = connection.getSenders();
          const transceivers = connection.getTransceivers();
          const transceiver = transceivers.find(
            (t) => t.sender.track?.id === track.id
          );
          if (transceiver) {
            transceiver.sender.replaceTrack(null);
            transceiver.stop();
          } // Properly stops transmission and removes the sender
        });
        track.stop(); // Stop the local track
      });

      localScreenStreamRef.current = null;
    }
  }, [peerConnectionsRef]);
  const muteAudio = useCallback(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 0;
    }
  }, []);

  const unmuteAudio = useCallback(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 1;
    }
  }, []);

  const muteScreenAudio = useCallback(() => {
    if (screenGainNodeRef.current) {
      screenGainNodeRef.current.gain.value = 0;
    }
  }, []);

  const unmuteScreenAudio = useCallback(() => {
    if (screenGainNodeRef.current) {
      screenGainNodeRef.current.gain.value = 1;
    }
  }, []);

  const clearAudioStream = () => {
    localAudioStreamRef.current = null;
    localScreenStreamRef.current = null;
  };

  const checkGainNode = () => {
    console.log(gainNodeRef.current);
  };

  return {
    localAudioSource: localAudioStreamRef.current,
    localVideoSource: localScreenStreamRef.current,
    muteAudio,
    unmuteAudio,
    clearAudioStream,
    checkGainNode,
    startScreenShare,
    stopScreenShare,
    muteScreenAudio,
    unmuteScreenAudio,
  };
};
