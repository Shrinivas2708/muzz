import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import MusicPlayer from "./MusicPlayer";
import Queue from "./Queue";
import SongSearch from "./SongSearch";
import Chat from "./Chat";
import { socket } from "@/lib/socket";
import api from "@/lib/axios";

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setMessages = useRoomStore((state) => state.setMessages);
  const addMessage = useRoomStore((state) => state.addMessage);
  const setQueue = useRoomStore((state) => state.setQueue);
  // const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      const currentPath = `/room/${roomId}`;
      navigate(`/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    const checkRoomAndShowPrompt = async () => {
      try {
        const response = await api.get(`/rooms/${roomId}`);
        const isAdmin = response.data.creator === user?._id;

        if (!isAdmin) {
          setShowJoinPrompt(true);
        } else {
          await initializeRoom();
        }
      } catch (error) {
        console.error("Failed to check room:", error);
        toast.error("Failed to load room");
        navigate("/");
      }
    };

    checkRoomAndShowPrompt();

    return () => {
      socket.off("roomState");
      socket.off("previousMessages");
      socket.off("newMessage");
      socket.off("updateQueue");
    };
  }, [isAuthenticated, roomId, user?._id]);

  const initializeRoom = async () => {
    try {
      setIsLoading(true);
      // setError(null);

      socket.emit("joinRoom", { roomId, userId: user?._id });

      // socket.on("roomState", ({ participantCount, onlineUsers = [] }) => {
      //   setParticipantCount(participantCount || 0);
      //   setOnlineUsers(onlineUsers);
      // });

      socket.on("previousMessages", (messages) => {
        setMessages(messages || []);
      });

      socket.on("newMessage", (message) => {
        addMessage(message);
      });

      socket.on("updateQueue", (updatedQueue) => {
        setQueue(updatedQueue || []);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error initializing room:", error);
      toast.error("Failed to initialize room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    setShowJoinPrompt(false);
    await initializeRoom();
  };

  if (isLoading) {
    return <Loading />;
  }

  if (showJoinPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Join Room?</h2>
          <p className="mb-6">Would you like to join this music room?</p>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => navigate("/")}>
              No, thanks
            </Button>
            <Button onClick={handleJoinRoom}>Yes, join room</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MusicPlayer />
          <Queue />
        </div>
        <div>
          <SongSearch />
          <div className="mt-8">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
