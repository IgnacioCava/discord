import { create } from "zustand";
import { ChannelId, Message, StoredMessages } from "./types";

interface MessageState {
  messages: StoredMessages; // Channel ID as key
  addMessage: (channelId: string, message: Omit<Message, "status">) => void;
  receiveMessage: (channelId: string, message: Omit<Message, "status">) => void;
  updateMessage: (channelId: ChannelId, message: Message) => void;
  revertUpdateMessage: (
    channelId: ChannelId,
    messageId: string,
    content: string,
    status: Message["status"]
  ) => void;
  deleteMessage: (channelId: ChannelId, messageId: string) => void;
  setMessages: (messages: StoredMessages) => void;
  verifyUpdatedMessage: (channelId: ChannelId, message: Message) => void;
  verifySentMessage: (
    channelId: ChannelId,
    message: Message | { tempId: string; status: Message["status"] }
  ) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},

  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [
          ...(state.messages[channelId] || []),
          { ...message, status: "Pending" },
        ],
      },
    })),

  receiveMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [
          ...(state.messages[channelId] || []),
          { ...message, status: "Success" },
        ],
      },
    })),

  verifySentMessage(channelId, message) {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.map((msg) =>
          msg.tempId === message.tempId
            ? message.status === "Success"
              ? (message as Message)
              : { ...msg, status: message.status }
            : msg
        ),
      },
    }));
  },
  updateMessage: (channelId, updatedMessage) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.map((msg) =>
          msg.id === updatedMessage.id ? updatedMessage : msg
        ),
      },
    })),
  verifyUpdatedMessage: (channelId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.map((msg) =>
          msg.id === message.id ? message : msg
        ),
      },
    }));
  },
  revertUpdateMessage: (channelId, messageId, content, status) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.map((msg) =>
          msg.id === messageId ? { ...msg, content, status } : msg
        ),
      },
    }));
  },

  deleteMessage: (channelId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.filter(
          (msg) => msg.id !== messageId
        ),
      },
    })),

  setMessages: (messages) => {
    set(() => ({
      messages,
    }));
  },
}));
