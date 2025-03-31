import { ChannelMember, Role } from '@prisma/client';
import { create } from 'zustand';

export interface Channel {
  id: string;
  name: string;
  roomId: string;
  type: 'VOICE' | 'TEXT'
  roles: Role[]
  members: ChannelMember[]
}

interface ChannelState {
  channels: Channel[];
  activeChannelId: string | null;
  setActiveChannelId: (channelId: string) => void;
  setChannels: (channels: Channel[]) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  activeChannelId: null,

  setActiveChannelId: (channelId) => set({ activeChannelId: channelId }),

  setChannels: (channels) => set({ channels }),
}));
