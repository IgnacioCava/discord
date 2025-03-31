import { useVoice } from "../hooks/useVoiceChat";

export default function VoiceChat({ roomId }: { roomId: string }) {
  // const { startVoiceChat, leaveVoiceChat, localStream, remoteStreams } =
  //   useVoiceChat();
  const {
    startVoiceChat,
    leaveVoiceChat,
    remoteVideoStreams,
    remoteStreams,
    muteAudio,
    unmuteAudio,
    checkGainNode,
    startScreenShare,
    stopScreenShare,
    localAudioSource,
    muteScreenAudio,
    unmuteScreenAudio,
  } = useVoice();

  return (
    <div>
      <button onClick={() => startVoiceChat(roomId)}>Join Voice Chat</button>
      <button onClick={() => leaveVoiceChat(roomId)}>Leave Voice Chat</button>
      {/* <button onClick={() => stopMic()}>stop mic</button> */}
      <button onClick={() => muteAudio()}>mute mic</button>
      <button onClick={() => unmuteAudio()}>unmute mic</button>
      <button onClick={() => checkGainNode()}>check gain</button>
      <button onClick={() => startScreenShare()}>screenshare</button>
      <button onClick={() => stopScreenShare()}>stop screenshare</button>
      <button onClick={() => muteScreenAudio()}>mute screen</button>
      <button onClick={() => unmuteScreenAudio()}>unmute screen</button>

      {/* {localAudioSource && (
        <audio
          ref={(audio) => {
            if (audio) audio.srcObject = localAudioSource;
          }}
          autoPlay
          controls
        />
      )} */}

      {remoteStreams.map(({ userId, stream }, index) => (
        <div key={index}>
          {userId}{" "}
          <audio
            ref={(audio) => {
              if (audio) {
                audio.srcObject = stream;
              }
            }}
            autoPlay
            controls
          />
        </div>
      ))}
      {remoteVideoStreams.map(({ userId, stream }, index) => (
        <div key={index}>
          {userId}{" "}
          <video
            style={{ width: "100%" }}
            ref={(audio) => {
              if (audio) {
                audio.srcObject = stream;
              }
            }}
            autoPlay
            controls
            muted={false}
          />
        </div>
      ))}
    </div>
  );
}
