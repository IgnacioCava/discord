import { ChannelData } from "@/services/queries/types";

export type ChannelId = string;

export type StoredMessages = Record<ChannelId, Messages>;

export type Messages = Array<
  ChannelData["messages"][number] & {
    status: "Pending" | "Success" | "Error";
    edited?: boolean;
    tempId?: string;
  }
>;
export type Message = Messages[number];
