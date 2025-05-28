import {
  WorkerSettings,
  RouterOptions,
  WebRtcTransportOptions,
} from "mediasoup/node/lib/types";

export const webRtcTransportOptions: WebRtcTransportOptions = {
  listenIps: [
    {
      ip: process.env.PUBLIC_IP || '0.0.0.0', // Use 'localhost' for local testing, '0.0.0.0' for production
      announcedIp: process.env.ANNOUNCED_IP || '0.0.0.0',
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

export const routerOptions: RouterOptions = {
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {
        "x-google-start-bitrate": 300,
      },
    },
  ],
};
export const workerSettings: WorkerSettings = {
  logLevel: "warn",
  logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
  rtcMinPort: 40000,
  rtcMaxPort: 49999,
};
