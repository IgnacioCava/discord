import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken'

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow frontend access
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth.token; // Get the token from the handshake
  
    if (!token) {
      return next(new Error("Authentication error"));
    }
  
    try {
        // If token is a JWT:
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Attach decoded user data to the socket object
        next();
      } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
};

io.use(authenticateSocket); 

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.emit("welcome", `Welcome, ${socket.user.name}`);

    socket.on("send-message", (messageData) => {
        console.log("Message received:", messageData);
    
        // Broadcast the message to all connected clients
        // io.emit("message", `${socket.user?.name}: ${messageData.content}`);
    });

    socket.on("message", (data) => {
        io.emit("message", data); // Broadcast message
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

app.get("/", (req, res) => {
    res.send("Backend is running...");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));