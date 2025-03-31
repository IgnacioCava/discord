"use client";
import ChatBox from "@/app/components/ChatBox";
import { useOnlineList } from "@/app/hooks/useOnlineList";
import socket from "@/lib/socket";
import { useCreateChannel } from "@/services/queries/channel";
import { useRoomById } from "@/services/queries/room";
import { Channel, useChannelStore } from "@/store/channelSlice";
import { useMessageStore } from "@/store/messageSlice";
import { useRoomStore } from "@/store/roomSlice";
import { StoredMessages } from "@/store/types";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Room = () => {
  // asynchronous access of `params.id`.
  const { id } = useParams<{ id: string }>();
  const { data: room } = useRoomById(id); // Fetch room data by ID
  //const router = useRouter();
  const { data: session } = useSession();
  const createChannel = useCreateChannel();

  const [channelData, setChannelData] = useState<{
    channelName: string;
    channelDescription?: string;
    type: 'TEXT' | 'VOICE'
  }>({ channelName: "", channelDescription: "", type: 'TEXT' });

  const { setActiveChannelId, setChannels, activeChannelId, channels } =
    useChannelStore();
  const { setMessages } = useMessageStore();
  const { setCurrentRoom } = useRoomStore();
  const [channel, setChannel] = useState<Channel>();
  const { onlineUsers, offlineUsers } = useOnlineList();

  useEffect(() => {
    const foundChannel = channels.find((ch) => ch.id === activeChannelId);
    if (foundChannel) setChannel(foundChannel);
  }, [channels, activeChannelId]);

  const handleSwitchChannel = (index: string) => {
    setActiveChannelId(index);
    const newChannelId = index;
    socket.emit("switch-channel", { newChannelId });
  };

  useEffect(() => {
    if (!room) return;
    const { channels, ...data } = room;
    if (room) {
      setCurrentRoom(data);
      setChannels(channels);
      setActiveChannelId(channels[0]?.id);
      // const initialMessages = room.channels.reduce((acc, channel) => {
      //   acc[channel.id] = channel.messages || [];
      //   return acc;
      // }, {} as Record<string, any[]>);
      const mappedChannels = channels.map((ch) => ({ [ch.id]: ch.messages }));
      const finalMessages = Object.assign(
        {},
        ...mappedChannels
      ) as StoredMessages;
      setMessages(finalMessages);
    }
  }, [room, setCurrentRoom, setChannels, setMessages, setActiveChannelId]);

  useEffect(() => {
    if (!session?.user.id || !room?.id) return;
    socket.emit("join-room", { roomId: room.id });
    socket.on(
      `join-room-${room.id}-notifications-success`,
      ({ roomId, userId }) => {
        console.log(
          `join-room-${roomId}-notifications-success`,
          roomId,
          userId
        );
      }
    );

    socket.on("switch-channel-success", ({ channelId }) => {
      console.log("switch-channel-success", channelId);
    });

    return () => {
      socket.off(`join-room-${room.id}-notifications-success`);
    };
  }, [room, session]);

  // const handleLeaveRoom = () => {
  //   if (!session?.user) return router.push("/auth");
  //   if (!room?.id) return;
  //   try {
  //     socket.emit("leave-room", {
  //       roomId: room.id,
  //     });
  //     router.push("/rooms");
  //   } catch (error) {
  //     console.error("Failed to leave the room", error);
  //   }
  // };

  const deleteAll = () => {
    socket.emit("delete-all");
  };

  const handleCreateChannel = (event: React.FormEvent) => {
    event.preventDefault();
    if (!room) return;
    if (!channelData.channelName.trim()) return;
    createChannel.mutate(
      { roomId: room.id, ...channelData },
      {
        onSuccess: () => {
          setChannelData({ channelName: "", channelDescription: "", type: 'TEXT' }); // Clear input on success
        },
        onError: (error) => {
          console.error("Failed to create room:", error);
        },
      }
    );
  };

  return (
    <div
      style={{
        padding: 10,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <button onClick={deleteAll}>DELETE ALL MESSAGES</button>
      {room ? (
        <>
          <div>Room name: {room.name}</div>
          <div>Room ID: {room.id}</div>
        </>
      ) : (
        <div>Loading room...</div>
      )}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={channelData.channelName}
          onChange={(e) =>
            setChannelData((cd) => ({ ...cd, channelName: e.target.value }))
          }
          placeholder="Enter Channel Name"
          className="border p-2 rounded-md w-full"
        />
        <input
          type="text"
          value={channelData.channelDescription}
          onChange={(e) =>
            setChannelData((cd) => ({
              ...cd,
              channelDescription: e.target.value,
            }))
          }
          placeholder="Enter Channel Description"
          className="border p-2 rounded-md w-full"
        />
        <select onChange={e => setChannelData(data => ({...data, type: e.target.value as ('TEXT' | 'VOICE')}))}>
          <option value='TEXT' defaultChecked>text</option>
          <option value='VOICE'>voice</option>
        </select>
        <button
          onClick={handleCreateChannel}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Create
        </button>
      </div>
      <div>
        {room?.channels.map((channel) => (
          <div key={channel.id}>
            {channel.name}
            <button onClick={() => handleSwitchChannel(channel.id)}>
              select
            </button>
          </div>
        ))}
      </div>
      <div>
        <div>Online: {onlineUsers.map((u) => u.user.name)}</div>
        <div>Offline: {offlineUsers.map((u) => u.user.name)}</div>
      </div>
      {/* <div>{room?.channels[activeChannelId].name}</div> */}
      {/* <div>
        <h2>Room: {room?.name}</h2>
        <button onClick={handleLeaveRoom}>Leave Room</button>
      </div>
      <ChatBox roomId={id} prevMessages={room?.messages} /> */}
      {channel && <ChatBox channel={channel} />}
    </div>
  );
};

export default Room;
