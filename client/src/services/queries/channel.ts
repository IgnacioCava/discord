import { useMutation, useQueryClient } from "react-query";
import axios from "@/lib/axiosInstance";

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["createChannel"],
    mutationFn: async (channelData: {
      roomId: string;
      channelName: string;
      channelDescription?: string;
    }) => {
      const { data } = await axios.post("/api/channels/create", channelData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
};
