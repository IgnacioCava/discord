import { RoomData } from "@/services/queries/types";
import { create } from "zustand";

export type CurrentRoomState = Omit<RoomData, "channels">;

interface RoomState {
  currentRoom: CurrentRoomState | null;
  setCurrentRoom: (room: CurrentRoomState | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,

  setCurrentRoom: (room) => set({ currentRoom: room }),
}));
