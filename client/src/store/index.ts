import { useMessageStore } from "./messageSlice";
import { useChannelStore } from "./channelSlice";
import { useRoomStore } from "./roomSlice";

export const useStore = () => ({
  messages: useMessageStore(),
  channels: useChannelStore(),
  room: useRoomStore(),
});
