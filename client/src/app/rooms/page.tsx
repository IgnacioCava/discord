"use client";

import socket from "@/lib/socket";
import {
  useCreateRoom,
  useFetchRooms,
  useRoomById,
} from "@/services/queries/room";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";

const Room = () => {
  const query = useFetchRooms();
  const [roomId, setRoomId] = useState<string>("");
  const { data: room, isLoading, isError, refetch } = useRoomById(roomId);
  const router = useRouter();

  const handleSearchRoom = () => {
    if (roomId.trim()) {
      refetch(); // 👈 Manually trigger the query
    }
  };

  const [roomName, setRoomName] = useState<string>("");
  const createRoom = useCreateRoom();

  const handleCreateRoom = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roomName.trim()) return;
    createRoom.mutate(roomName, {
      onSuccess: () => {
        query.refetch();
        setRoomName(""); // Clear input on success
      },
      onError: (error) => {
        console.error("Failed to create room:", error);
      },
    });
  };

  const handleJoinRoom = async (
    event: MouseEvent<HTMLButtonElement>,
    roomId: string
  ) => {
    event.preventDefault();
    socket.emit("apply-for-room-membership", { roomId });
    socket.on("apply-for-room-membership-success", () => router.push(`/rooms/${roomId}`));
  };

  return (
    <div>
      <div>room</div>
      <div>
        rooms:
        <div style={{ display: "flex", flexDirection: "column" }}>
          {query.data?.map((room) => (
            <div
              key={room.id}
              style={{ display: "flex", flexDirection: "row", gap: 10 }}
            >
              <Link href={`rooms/${room.id}`}>{room.name}</Link>
              {room.isMember ? (
                <div>Member</div>
              ) : (
                <button onClick={(event) => handleJoinRoom(event, room.id)}>
                  Join
                </button>
              )}
            </div>
          ))}
        </div>
        {query.isLoading && <div>Loading...</div>}
        {!query.data?.length && !query.isLoading && <div>No rooms</div>}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="border p-2 rounded-md w-full"
          />
          <button
            onClick={handleSearchRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Search
          </button>
          {isLoading && <p>Loading room details...</p>}
          {isError && <p className="text-red-500">Room not found.</p>}
          {room && (
            <div className="p-4 border rounded-md bg-gray-100">
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <p>Room ID: {room.id}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter Room Name"
            className="border p-2 rounded-md w-full"
          />
          <button
            onClick={handleCreateRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
