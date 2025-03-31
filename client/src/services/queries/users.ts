import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "@/lib/axiosInstance";
import { Message, Room, RoomMember, User } from "@prisma/client";

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
