import express, { Express } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import initSocket from "@socket";
import messageRoutes from "./routes/messageRoutes";
import roomRoutes from "./routes/roomRoutes";
import channelRoutes from "./routes/channelRoutes";

import { authenticateUser } from "./middleware/auth";

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/channels", channelRoutes);
// app.use('/api/users', messageRoutes);

initSocket(server);

app.get("/", (_, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
