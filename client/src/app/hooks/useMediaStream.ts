import { useCallback, useEffect, useRef, useState } from "react";

export const useMediaStream = () => {
  const [localAudioStreamSource, setLocalAudioStreamSource] =
    useState<MediaStream | null>(null);
  const [localScreenStreamSource, setLocalScreenStreamSource] =
    useState<MediaStream | null>(null);
  const [localWebcamStreamSource, setLocalWebcamStreamSource] =
    useState<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const screenGainNodeRef = useRef<GainNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const [micAvailable, setMicAvailable] = useState(false);

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

      destination.stream
        .getTracks()
        .forEach((track) => (track.contentHint = "speech"));

      setLocalAudioStreamSource(destination.stream);
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
  }, []);

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
        destination.stream.getAudioTracks().forEach((track) => {
          screenStream.addTrack(track);
          track.contentHint = "detail";
          track.onended = () => {
            setLocalScreenStreamSource(null);
          };
        });
      });
      setLocalScreenStreamSource(screenStream);
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
    }
  };

  const stopScreenShare = useCallback(
    (callback: (trackId: string) => void) => {
      if (localScreenStreamSource) {
        localScreenStreamSource.getTracks().forEach((track) => {
          callback(track.id);
        });
        setLocalScreenStreamSource(null);
      }
    },
    [localScreenStreamSource]
  );

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      stream.getTracks().forEach((track) => (track.contentHint = "detail"));

      setLocalWebcamStreamSource(stream);
    } catch (error) {
      console.log(error);
    }
  };

  const stopWebcam = () => {
    if (localWebcamStreamSource)
      localWebcamStreamSource.getTracks().forEach((track) => track.stop());
  };
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

  const clearStream = () => {
    setLocalAudioStreamSource(null);
    setLocalScreenStreamSource(null);
    setLocalWebcamStreamSource(null);
  };

  const checkGainNode = () => {
    console.log(gainNodeRef.current);
  };

  return {
    localAudioSource: localAudioStreamSource,
    localVideoSource: localScreenStreamSource,
    localWebcamSource: localWebcamStreamSource,
    muteAudio,
    unmuteAudio,
    checkGainNode,
    startScreenShare,
    stopScreenShare,
    muteScreenAudio,
    unmuteScreenAudio,
    startWebcam,
    stopWebcam,
    clearStream,
    micAvailable
  };
};
