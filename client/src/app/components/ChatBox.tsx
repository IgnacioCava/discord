"use client";
import socket from "@/lib/socket";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect } from "react";
import debounce from "lodash.debounce";
import { Channel, useChannelStore } from "@/store/channelSlice";
import { useMessageStore } from "@/store/messageSlice";
import { Message } from "@/store/types";
import Image from "next/image";
import { useMessageListener } from "../hooks/useMessageHandler";
import { useSocket } from "./SocketProvider";
import TypingIndicator from "./TypingIndicator";
// import VoiceChat from "./VoiceChat";
// import SFUVoiceChatTest from "./SFUVoiceChatTest";
import SFUVoiceTest2 from "./SFUVoiceTest2";

const ChatBox = ({ channel }: { channel: Channel }) => {
  const { data: session } = useSession();
  const {
    messages,
    addMessage,
    verifySentMessage,
    verifyUpdatedMessage,
    updateMessage,
    revertUpdateMessage,
  } = useMessageStore((state) => state);
  const { activeChannelId } = useChannelStore();
  const { isConnected, transport } = useSocket();

  useMessageListener();
  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!channel.id) return;
    const formData = new FormData(event.currentTarget);
    const content = formData.get("sendmessage") as string;

    if (content?.trim() && socket && session?.user) {
      socket.emit("typing-stopped", activeChannelId);
      const tempId = crypto.randomUUID();
      const messageData: Omit<Message, "status"> = {
        id: "0",
        tempId, // Temporary ID for optimistic UI,
        content,
        authorId: session.user.id,
        channelId: channel.id,
        author: session.user,
        messageType: "MESSAGE",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
      };
      addMessage(channel.id, messageData);
      socket.emit("send-message", messageData, (ack: Message) => {
        verifySentMessage(ack.channelId, ack);
      });

      event.currentTarget.reset();
    }
  };

  // useEffect(() => {
  //   socket.on(`room-${channel.roomId}-notifications-test`, (messageData) => {
  //     console.log("update-message-error:", messageData);
  //   });
  // }, [])

  // useEffect(() => {
  //   if (!socket.connected) {
  //     console.log('xd')
  //     socket.on("connect", () => console.log("Socket connected!"));
  //   }
  // });

  const handleEditMessage = (
    event: FormEvent<HTMLFormElement>,
    msg: Message
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = formData.get("updatemessage") as string;
    const updateMessageData: Message = {
      ...msg,
      content,
      status: "Pending",
    };
    updateMessage(channel.id, updateMessageData);
    socket.emit(
      "edit-message",
      {
        id: updateMessageData.id,
        content: updateMessageData.content,
        prevContent: msg.content,
        channelId: updateMessageData.channelId,
      },
      (ack: Message) => {
        if (ack.status === "Success") verifyUpdatedMessage(ack.channelId, ack);
        else revertUpdateMessage(channel.id, ack.id, ack.content, ack.status); // server sends content as prevContent
      }
    );

    event.currentTarget.reset();
  };

  const handleTypingIndicator = debounce(
    () => {
      socket.emit("typing", activeChannelId);
    },
    1000,
    { leading: true, trailing: false }
  );

  const handleStopTypingIndicator = debounce(
    () => {
      socket.emit("typing-stopped", activeChannelId); // User stopped typing
    },
    3000,
    { leading: false, trailing: true }
  );

  const handleChange = () => {
    handleTypingIndicator();
    handleStopTypingIndicator();
  };
  useEffect(() => {
    return () => handleTypingIndicator.cancel();
  }, [handleTypingIndicator]);

  if (!activeChannelId) return;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h1>Chat</h1>
      <p>Name: {channel.name}</p>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <button onClick={() => socket.emit("typing-check")}>typing check</button>
      <button onClick={() => socket.disconnect()}>disconnect</button>
      <button onClick={() => socket.connect()}>connect</button>
      {channel.type === "VOICE" && <SFUVoiceTest2 channelId={channel.id} />}

      {channel.type === "TEXT" && (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: "1px solid red",
          }}
        >
          <div style={{ flex: 1, overflow: "auto" }}>
            {messages[activeChannelId].map((msg, index) => (
              <div
                key={index}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {msg.messageType === "MESSAGE" && msg.author.image && (
                  <Image
                    src={msg.author.image}
                    height={40}
                    width={40}
                    alt="some"
                  />
                )}
                {msg.messageType === "SYSTEM" ? (
                  "System: "
                ) : (
                  <strong>
                    {msg.authorId === session?.user.id
                      ? "You"
                      : msg.author?.name}
                    :
                  </strong>
                )}
                {msg.content}{" "}
                <span
                  style={{
                    color:
                      msg.status === "Pending"
                        ? "lightblue"
                        : msg.status === "Error"
                        ? "red"
                        : "green",
                  }}
                >
                  <span>{msg.status || "Success"}</span>
                </span>
                <form onSubmit={(event) => handleEditMessage(event, msg)}>
                  <input placeholder={msg.content} name="updatemessage" />
                  <button type="submit">Edit</button>
                </form>
              </div>
            ))}
          </div>
          <TypingIndicator />
          <form style={{ display: "flex" }} onSubmit={sendMessage}>
            <input
              name="sendmessage"
              style={{ flex: 1 }}
              onChange={handleChange}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
