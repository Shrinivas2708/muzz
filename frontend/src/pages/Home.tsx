import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { socket } from "@/lib/socket";
import { Users } from "lucide-react";

interface Room {
  _id: string;
  name: string;
  creator: {
    _id: string;
    username: string;
  };
  participantCount: number;
}

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchRooms();

    socket.on("roomUpdate", ({ roomId, participantCount }) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room._id === roomId ? { ...room, participantCount } : room
        )
      );
    });

    socket.on("roomDeleted", ({ roomId }) => {
      setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId));
      toast("A room has been deleted due to inactivity");
    });

    return () => {
      socket.off("roomUpdate");
      socket.off("roomDeleted");
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/rooms");
      setRooms(response.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      await api.post(`/rooms/join/${roomId}`);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-purple-600 font-semibold animate-pulse">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (

      <div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-purple-700 mb-8 tracking-tight text-center drop-shadow-lg">Available Rooms</h1>
        {rooms.length === 0 ? (
          <div className="text-center py-12 mt-12">
            <p className="text-gray-600 text-lg font-medium">No rooms available. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 w-full">
            {rooms.map((room) => (
              <Card key={room._id} className="rounded-2xl bg-white/90 shadow-xl hover:shadow-2xl transition-shadow border-0">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-purple-700 mb-1">{room.name}</h2>
                      {/* <p className="text-sm text-gray-500">Created by {room.creator.username}</p> */}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span>{room.participantCount || 0} participants</span>
                    </div>
                    <Button
                      onClick={() => joinRoom(room._id)}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition"
                      variant={room.creator._id === user?._id ? "outline" : "default"}
                    >
                      {room.creator._id === user?._id ? "Enter Room" : "Join Room"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    
  );
};

export default Home;
