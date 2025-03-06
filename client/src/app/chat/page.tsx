"use client";
import { useEffect, useState } from "react";
import useSocket from "@/lib/socket";
import { useSession } from "next-auth/react";

const Chat = () => {
  const { data: session } = useSession();
  const socket = useSocket(); // Get the socket connection

  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return; // Exit if no socket connection

    socket.on("welcome", (message) => {
      console.log(message); // Welcome message sent from the server
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off("message");
    };
  }, [socket, session]);
  const sendMessage = () => {
    console.log(socket, session)
    if (message.trim() && socket && session?.user?.id) {
      socket.emit("send-message", {
        userId: session?.user?.id,
        content: message,
      });
      setMessage(""); // Clear the input field after sending
    }
  };

  return (
    <div>
      <h1>Chat</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
