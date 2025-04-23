import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type MediaKey = "mic" | "screen" | "webcam";

type AtLeastOne<T extends Record<string, unknown>> = {
  [K in keyof T]: Pick<T, K> & Partial<Omit<T, K>>;
}[keyof T];

interface MediaConfigContextType {
  muteAudio: () => void;
  unmuteAudio: () => void;
  startScreenShare: () => Promise<MediaStream | undefined>;
  stopScreenShare: (callback?: (trackId: string) => void) => void;
  muteScreenAudio: () => void;
  unmuteScreenAudio: () => void;
  startWebcam: () => void;
  stopWebcam: () => void;
  clearStream: () => void;
  checkGainNode: () => void;
  startVolumeDetector: () => void;
  stopVolumeDetector: () => void;
  localAudioSource: MediaStream | null;
  localVideoSource: MediaStream | null;
  localWebcamSource: MediaStream | null;
  micAvailable: boolean;
  mediaState: {
    mic: boolean;
    screen: boolean;
    webcam: boolean;
  };
  noiseLevel: number | null;
}

const MediaConfigContext = createContext<MediaConfigContextType | undefined>(
  undefined
);

export const LocalMediaConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mediaState, setMediaState] = useState({
    mic: false,
    screen: false,
    webcam: false,
  });
  const [localAudioStreamSource, setLocalAudioStreamSource] =
    useState<MediaStream | null>(null);
  const [localScreenStreamSource, setLocalScreenStreamSource] =
    useState<MediaStream | null>(null);
  const [localWebcamStreamSource, setLocalWebcamStreamSource] =
    useState<MediaStream | null>(null);

  const micGainNodeRef = useRef<GainNode | null>(null);
  const screenGainNodeRef = useRef<GainNode | null>(null);

  const [noiseLevel, setNoiseLevel] = useState<number | null>(null);
  const noiseAnalyser = useRef<AnalyserNode | null>(null);
  const animationFrameId = useRef<number>(null);

  const toggleMediaState = (state: AtLeastOne<Record<MediaKey, boolean>>) => {
    setMediaState((prev) => ({ ...prev, ...state }));
  };

  const audioContextRef = useRef<AudioContext | null>(null);

  const [micAvailable, setMicAvailable] = useState(false);

  const setupAudioNode = useCallback(
    async () => {
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
        toggleMediaState({ mic: false });
      };

      const source = audioContext.createMediaStreamSource(
        new MediaStream([audioTrack])
      );
      micGainNodeRef.current = audioContext.createGain();
      micGainNodeRef.current.gain.value = 1;

      const destination = audioContext.createMediaStreamDestination();
      source.connect(micGainNodeRef.current).connect(destination);

      destination.stream
        .getTracks()
        .forEach((track) => (track.contentHint = "speech"));

      // const analyser = audioContext.createAnalyser();
      // analyser.fftSize = 128;
      // const dataArray = new Uint8Array(analyser.fftSize);

      // micGainNodeRef.current.connect(analyser);

      // const detectVolume = () => {
      //   analyser.getByteTimeDomainData(dataArray);
      //   let max = 0;
      //   for (let i = 0; i < dataArray.length; i++) {
      //     const val = Math.abs(dataArray[i] - 128);
      //     if (val > max) max = val;
      //   }

      //   setNoiseLevel(max > 5 ? max : 0);
      //   requestAnimationFrame(detectVolume);
      // };
      // detectVolume();
      // console.log("test");
      setLocalAudioStreamSource(destination.stream);
      setMicAvailable(true);
      toggleMediaState({ mic: true });
    },
    []
  );

  useEffect(() => {
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
  }, [setupAudioNode]);

  const startVolumeDetector = () => {
    if (noiseAnalyser.current) return;
    if (!audioContextRef.current || !micGainNodeRef.current) return;
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 128;
    noiseAnalyser.current = analyser;
    const dataArray = new Uint8Array(analyser.fftSize);

    micGainNodeRef.current.connect(analyser);

    const detectVolume = () => {
      analyser.getByteTimeDomainData(dataArray);
      let max = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = Math.abs(dataArray[i] - 128);
        if (val > max) max = val;
      }

      setNoiseLevel(max > 5 ? max : 0);
      animationFrameId.current = requestAnimationFrame(detectVolume);
    };
    detectVolume();
  };

  const stopVolumeDetector = () => {
    if (!animationFrameId.current || !noiseAnalyser.current) return;
    cancelAnimationFrame(animationFrameId.current);
    noiseAnalyser.current?.disconnect();
    noiseAnalyser.current = null;
    setNoiseLevel(null);
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Request screen audio if available
      });
      screenStream.getVideoTracks().forEach((track) => {
        track.contentHint = "detail";
        track.onended = () => {
          setLocalScreenStreamSource(null);
          toggleMediaState({ screen: false });
        };
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
        });
      });
      setLocalScreenStreamSource(screenStream);
      toggleMediaState({ screen: true });
      return screenStream
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
    }
  };

  const stopScreenShare = useCallback(
    (callback?: (trackId: string) => void) => {
      if (localScreenStreamSource) {
        localScreenStreamSource
          .getTracks()
          .forEach((track) => (callback ? callback(track.id) : track.stop()));
        setLocalScreenStreamSource(null);
        toggleMediaState({ screen: false });
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
      toggleMediaState({ webcam: true });
    } catch (error) {
      console.log(error);
    }
  };

  const stopWebcam = () => {
    if (localWebcamStreamSource) {
      localWebcamStreamSource.getTracks().forEach((track) => track.stop());
      toggleMediaState({ webcam: false });
    }
  };
  const muteAudio = useCallback(() => {
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = 0;
      toggleMediaState({ mic: false });
    }
  }, []);

  const unmuteAudio = useCallback(() => {
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = 1;
      toggleMediaState({ mic: true });
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
    toggleMediaState({ mic: false, screen: false, webcam: false });
  };

  const checkGainNode = () => {
    console.log(micGainNodeRef.current);
  };

  return (
    <MediaConfigContext.Provider
      value={{
        muteAudio,
        unmuteAudio,
        startScreenShare,
        stopScreenShare,
        muteScreenAudio,
        unmuteScreenAudio,
        startWebcam,
        stopWebcam,
        clearStream,
        checkGainNode,
        startVolumeDetector,
        stopVolumeDetector,
        localAudioSource: localAudioStreamSource,
        localVideoSource: localScreenStreamSource,
        localWebcamSource: localWebcamStreamSource,
        micAvailable,
        mediaState,
        noiseLevel,
      }}
    >
      {children}
    </MediaConfigContext.Provider>
  );

  // return {
  //   localAudioSource: localAudioStreamSource,
  //   muteAudio,
  //   unmuteAudio,
  //   localVideoSource: localScreenStreamSource,
  //   startScreenShare,
  //   stopScreenShare,
  //   muteScreenAudio,
  //   unmuteScreenAudio,
  //   localWebcamSource: localWebcamStreamSource,
  //   startWebcam,
  //   stopWebcam,
  //   clearStream,
  //   checkGainNode,
  //   micAvailable,
  //   mediaState,
  //   noiseLevel,
  //   startVolumeDetector,
  //   stopVolumeDetector,
  // };
};

export const useLocalMedia = () => {
  const context = useContext(MediaConfigContext);
  if (!context) {
    throw new Error(
      "useLocalMedia must be used within a LocalMediaConfigProvider"
    );
  }
  return context;
};
