export const alterAudioTrack = (audioTrack: MediaStreamTrack) => {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));
  const gainNode = ctx.createGain();

  source.connect(gainNode);
  gainNode.gain.value = 1;

  const muteAudio = () => {
    gainNode.gain.value = 0;
  };

  // Function to unmute
  const unmuteAudio = () => {
    gainNode.gain.value = 1;
  };

  return { source, muteAudio, unmuteAudio };
};

const setupAudioGainNode = (stream: MediaStream, gainNode) => {
  const audioContext = new AudioContext();
  // used for muting / unmuting from clientside
  const audioTrack = stream.getAudioTracks()[0];
  const source = audioContext.createMediaStreamSource(
    new MediaStream([audioTrack])
  );

  gainNodeRef.current = audioContext.createGain();
  gainNodeRef.current.gain.value = 1; // Start unmuted

  const destination = audioContext.createMediaStreamDestination();

  source.connect(gainNodeRef.current).connect(destination);

  return destination.stream;
};
