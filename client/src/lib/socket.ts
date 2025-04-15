"use client";

import { io } from "socket.io-client";
import { getSession } from "next-auth/react";

const defaultSocketConfig = {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
};

const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://localhost:5000",
  defaultSocketConfig
);

const sfuSocket = io("https://localhost:5000/sfu", defaultSocketConfig);

console.log("Socket instance created");

export const connectSocket = async () => {
  const session = await getSession(); // ✅ Get the session data
  if (session?.user.idToken) {
    socket.auth = { token: session.user.idToken, id: session.user.id }; // ✅ Add token to auth property
  }
  socket.connect(); // ✅ Connect only after setting auth
};

export const connectSfuSocket = async () => {
  const session = await getSession(); // ✅ Get the session data
  if (session?.user.idToken) {
    sfuSocket.auth = { token: session.user.idToken, id: session.user.id }; // ✅ Add token to auth property
  }
  sfuSocket.connect(); // ✅ Connect only after setting auth
};

export default socket;
export { sfuSocket };
