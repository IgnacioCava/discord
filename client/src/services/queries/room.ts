import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "@/lib/axiosInstance";
import { RoomData } from "./types";

interface Rooms {
  id: string;
  name: string;
  isMember: boolean;
}

const fetchRooms = async (): Promise<Rooms[]> => {
  const response = await axios.get<Rooms[]>("/api/rooms");
  return response.data;
};

export const useFetchRooms = () => {
  return useQuery("rooms", fetchRooms, {
    refetchOnWindowFocus: false,
  });
};

export const useRoomById = (roomId: string) => {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const response = await axios.get<RoomData>(`/api/rooms/${roomId}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!roomId,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createRoom"],
    mutationFn: async (roomName: string) => {
      const { data } = await axios.post("/api/rooms/create", {
        name: roomName,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
};
