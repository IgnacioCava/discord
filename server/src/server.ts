import { initWorkers } from "@lib/mediasoup/mediasoupService";
import initSocket from "@socket";
import cluster from "cluster";
import cors from "cors";
import dotenv from "dotenv";
import express, { Express } from "express";
import fs from "fs";
import https from "https";
import { cpus } from "os";
import { channelRoutes, messageRoutes, roomRoutes, userRoutes } from "./routes";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { createProxyMiddleware } from "http-proxy-middleware";
import crypto from "crypto";

dotenv.config();

const clusterMode = process.env.CLUSTER_MODE || "internal";
const numCPUs = process.env.WORKER_COUNT
  ? Number(process.env.WORKER_COUNT)
  : cpus().length;

const workerBasePort = 5001; // Base port for workers
const workerPorts = Array.from(
  { length: numCPUs },
  (_, i) => workerBasePort + i
);
let currentWorkerIndex = 0;
const PORT = Number(process.env.PORT) || 5000;

const getNextWorkerPort = () => {
  const port = workerPorts[currentWorkerIndex];
  currentWorkerIndex = (currentWorkerIndex + 1) % workerPorts.length;
  return port;
};

// Hash IP to pick a consistent worker
const getWorkerPortForIp = (ip: string) => {
  const hash = crypto.createHash("sha1").update(ip).digest("hex");
  const numericHash = parseInt(hash.substring(0, 8), 16);
  const index = numericHash % workerPorts.length;
  return workerPorts[index];
};

async function forkWorkers() {
  const workers = [];
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork({ WORKER_PORT: 5001 + i });
    workers.push(worker);
  }
  return workers;
}

(async () => {
  try {
    if (
      !fs.existsSync("certs/cert-key.pem") ||
      !fs.existsSync("certs/cert.pem")
    )
      throw new Error("Missing cert files!");

    const key = fs.readFileSync("certs/cert-key.pem");
    const cert = fs.readFileSync("certs/cert.pem");

    const role = process.env.SERVER_ROLE || "primary";

    if (role === "primary") {
      if (clusterMode === "internal" && cluster.isPrimary) {
        console.log(
          `Primary ${process.pid} is running in internal cluster mode`
        );

        const app = express();
        app.set("trust proxy", true);
        app.use(
          cors({
            origin: process.env.FRONTEND_URL || "https://localhost:3000",
            credentials: true,
          })
        );

        const server = https.createServer({ key, cert }, app);

        // 👇 ADD this: setup sticky sessions before forking workers
        // Doesn't work well with DNS resolution (dynamic worker discovery, auto-assigned worker ports)
        // setupMaster(server, {
        //   loadBalancingMethod: "round-robin",
        // });

        server.listen(PORT, "0.0.0.0", () =>
          console.log(
            `Primary load balancer ${process.pid} running on port ${PORT}`
          )
        );

        await forkWorkers();

        cluster.on("exit", (worker, code, signal) => {
          console.log(`Worker ${worker.process.pid} died`);
          const newPort = getNextWorkerPort();
          cluster.fork({ WORKER_PORT: newPort });
        });

        process.on("SIGINT", () => {
          console.log("Gracefully shutting down");
          cluster.disconnect(() => {
            console.log("Cluster disconnected");
            process.exit(0);
          });
        });
      } else {
        // If someone starts a primary container in container mode (not internal cluster), just run load balancer
        const app = express();
        app.set("trust proxy", true);
        app.use(
          cors({
            origin: process.env.FRONTEND_URL || "https://localhost:3000",
            credentials: true,
          })
        );
        const server = https.createServer({ key, cert }, app);

        server.listen(PORT, "0.0.0.0", () =>
          console.log(
            `Primary load balancer ${process.pid} running on port ${PORT}`
          )
        );
      }
    }
    if (role === "worker") {
      await initWorkers();
      const app: Express = express();
      app.use(
        cors({
          origin: process.env.FRONTEND_URL || "https://localhost:3000",
          credentials: true,
        })
      );
      app.set("trust proxy", true);
      app.use(express.json());
      app.use("/api/messages", messageRoutes);
      app.use("/api/rooms", roomRoutes);
      app.use("/api/channels", channelRoutes);
      app.use("/api/users", userRoutes);
      app.get("/", (_, res) => {
        res.send("Backend is running");
      });
      app.get("/health", (_, res) => {
        res.status(200).send("OK");
      });

      const server = https.createServer({ key, cert }, app);
      const workerPort = process.env.WORKER_PORT;
      const port = process.env.PORT || 500;
      const hostname = process.env.HOSTNAME; // Assigned by docker
      const workerStatus =
        clusterMode === "external"
          ? `Worker ${hostname} running (:${port}) (${clusterMode})`
          : `Worker ${process.pid} running (:${workerPort}) (${clusterMode})`;
      server.listen(port, () => console.log(workerStatus));
      const io = await initSocket(server);
    }
  } catch (error) {
    console.log(error);
  }
})();
