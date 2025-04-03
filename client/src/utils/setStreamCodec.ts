export const setStreamCodec = (
  transceiver: RTCRtpTransceiver,
  type: "video" | "audio"
) => {
  const capabilities = RTCRtpReceiver.getCapabilities(type);
  const mimeType = type === "audio" ? "audio/opus" : "video/VP8";
  const preferredCodecs = capabilities?.codecs.filter(
    (codec) => codec.mimeType === mimeType
  );
  if (preferredCodecs && preferredCodecs.length > 0) {
    transceiver?.setCodecPreferences(preferredCodecs);
  }
};
