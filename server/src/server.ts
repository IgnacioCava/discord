import express, { Express } from "express";
import https from "https";
import cors from "cors";
import dotenv from "dotenv";
import initSocket from "@socket";
import messageRoutes from "./routes/messageRoutes";
import roomRoutes from "./routes/roomRoutes";
import channelRoutes from "./routes/channelRoutes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initWorkers } from "@lib/mediasoup/mediasoupService";

dotenv.config();
try {
  initWorkers()
  
  const app: Express = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "https://localhost:3000",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use("/api/messages", messageRoutes);
  app.use("/api/rooms", roomRoutes);
  app.use("/api/channels", channelRoutes);
  // app.use('/api/users', messageRoutes);
  app.get("/", (_, res) => {
    res.send("Backend is running");
  });

  if (
    !fs.existsSync("src/certs/cert-key.pem") ||
    !fs.existsSync("src/certs/cert.pem")
  ) throw "Missing cert files!";
  
  const key = fs.readFileSync("src/certs/cert-key.pem");
  const cert = fs.readFileSync("src/certs/cert.pem");
  const server = https.createServer({ key, cert }, app);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  initSocket(server);
} catch (error) {
  console.log(error);
}
