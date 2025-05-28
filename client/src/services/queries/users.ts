import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "@/lib/axiosInstance";

interface Rooms {
  id: string;
  name: string;
  isMember: boolean;
}

type FriendsStatus = "PENDING" | "ACCEPTED";

export type Friends =
  | {
      name: string;
      id: string;
      image: string | null;
      isOnline?: boolean;
      isSender: boolean;
    }[]
  | undefined;

export type FetchFriendsResponse = Record<FriendsStatus, Friends>;

const fetchRooms = async (): Promise<Rooms[]> => {
  const response = await axios.get<Rooms[]>("/api/rooms");
  return response.data;
};

export const useFetchRooms = () => {
  return useQuery("rooms", fetchRooms, {
    refetchOnWindowFocus: false,
  });
};

export const useFetchFriends = () => {
  return useQuery({
    queryKey: ["friendList"],
    queryFn: async () => {
      const response = await axios.get<FetchFriendsResponse>(
        `api/users/@me/relationships`
      );
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["sendFriendRequest"],
    mutationFn: async (username: string) => {
      const response = await axios.post(`api/users/@me/relationships`, {
        username,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendList"] });
    },
    onError: (error) => {
      console.error("Failed to send request", error);
    },
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["cancelFriendRequest"],
    mutationFn: async (receiverId: string) => {
      await axios.delete(`api/users/@me/relationships/${receiverId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendList"] });
    },
    onError: (error) => {
      console.error("Failed to delete friend", error);
    },
  });
};

export const useAnswerFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["answerFriendRequest"],
    mutationFn: async (answer: { senderId: string; accepted: boolean }) => {
      await axios.put(`api/users/@me/relationships/${answer.senderId}`, {
        accepted: answer.accepted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendList"] });
    },
    onError: (error) => {
      console.error("Failed to delete friend", error);
    },
  });
};
