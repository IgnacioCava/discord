import os from "os";
import {
  WorkerSettings,
  RouterOptions,
  WebRtcTransportOptions,
} from "mediasoup/node/lib/types";

export const workerSettings: WorkerSettings = {
  logLevel: "warn",
  logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
  rtcMinPort: 10000,
  rtcMaxPort: 20000,
};

export const routerOptions: RouterOptions = {
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
  ],
};

export const webRtcTransportOptions: WebRtcTransportOptions = {
  listenIps: [
    {
      ip: "localhost", // Use 'localhost' for local testing, '0.0.0.0' for production
      announcedIp: process.env.PUBLIC_IP || undefined,
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};
