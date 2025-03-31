import mediasoup from "mediasoup";
import { workerSettings } from "./mediasoupConfig";

let worker: mediasoup.types.Worker | null = null;

export const createWorker = async () => {
  worker = await mediasoup.createWorker(workerSettings);

  worker.on("died", () => {
    console.error("Mediasoup worker died, restarting...");
    setTimeout(() => createWorker(), 2000);
  });

  return worker;
};

export const getWorker = () => {
  if (!worker) {
    throw new Error("Mediasoup worker not created yet.");
  }
  return worker;
};
