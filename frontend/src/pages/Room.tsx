import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import Chat from "@/components/room/Chat";
import MusicPlayer from "@/components/room/MusicPlayer";
import Queue from "@/components/room/Queue";
import SongSearch from "@/components/room/SongSearch";
import { ErrorBoundary } from "react-error-boundary";
import toast from "react-hot-toast";
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="p-4 text-red-500">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
};

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const setMessages = useRoomStore((state) => state.setMessages);
  // const addMessage = useRoomStore((state) => state.addMessage);
  const setQueue = useRoomStore((state) => state.setQueue);
  // const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !roomId) {
      const currentPath = `/room/${roomId}`;
      navigate(`/login?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    const checkRoomAndShowPrompt = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/rooms/${roomId}`);

        // Convert IDs to strings for comparison
        const creatorId = response.data.creator._id || response.data.creator;
        const userId = user?._id;
        const isCreator = creatorId.toString() === userId?.toString();

        console.log("Room creator check:", { creatorId, userId, isCreator });

        setIsRoomCreator(isCreator);

        const isParticipant = response.data.participants.some(
          (p: any) => p.toString() === userId?.toString()
        );

        if (!isCreator && !isParticipant) {
          setShowJoinPrompt(true);
        } else {
          await initializeRoom();
        }
      } catch (error) {
        console.error("Failed to check room:", error);
        toast.error("Failed to load room");
        navigate("/");
      } finally {
        setIsLoading(false);
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

      // Join the room
      socket.emit("joinRoom", { roomId, userId: user?._id });

      // Set up socket listeners
      socket.on("roomInitialState", ({ messages, queue, isCreator }) => {
        useRoomStore.getState().setMessages(messages || []);
        useRoomStore.getState().setQueue(queue || []);
        setIsRoomCreator(isCreator);
      });

      socket.on("updateQueue", (updatedQueue) => {
        setQueue(updatedQueue || []);
      });

      // Wait a bit for socket connections to establish
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Error initializing room:", error);
      toast.error("Failed to initialize room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      setIsLoading(true); // Set loading while joining
      await api.post(`/rooms/join/${roomId}`);
      setShowJoinPrompt(false);
      await initializeRoom();
    } catch (error) {
      console.error("Failed to join room:", error);
      toast.error("Failed to join room");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
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
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-6">
          {/* Simple Room Title */}
          <div className="py-4">
            <h1 className="text-2xl font-semibold text-gray-900">Music Room</h1>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Side - Music Player, Queue, and Song Search */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Music Player Section */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <MusicPlayer />
              </div>

              {/* Queue Section */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">Queue</h2>
                <Queue />
              </div>

              {/* Song Search Component */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">Add Songs</h2>
                <SongSearch isRoomCreator={isRoomCreator} />
              </div>
            </div>

            {/* Right Side - Chat */}
            <div className="col-span-12 lg:col-span-4">
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold">Chat</h2>
                </div>
                <Chat />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Room;
