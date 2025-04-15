import { useVoiceClientTest } from "../hooks/useVoiceClientTest";

const SFUVoiceChatTest = ({ roomId }: { roomId: string }) => {
  const { joinVoiceChat, leaveVoiceChat, remoteAudio, track } =
    useVoiceClientTest(roomId);

  return (
    <div>
      <button onClick={() => joinVoiceChat()}>Join Voice Chat</button>
      <button onClick={() => leaveVoiceChat()}>Leave Voice Chat</button>
      SFU VOICE TEST
      {remoteAudio && (
        <audio
          ref={(audio) => {
            if (audio) {
              audio.srcObject = remoteAudio;
              audio.volume = 1;
            }
          }}
          autoPlay
          controls
        />
      )}
      {/* {track && <audio
        ref={(audio) => {
          console.log(track)
          if (audio && track) {
            audio.srcObject = track;
            audio.volume = 1;
          }
        }}
        autoPlay
        controls
      />} */}
    </div>
  );
};

export default SFUVoiceChatTest;
