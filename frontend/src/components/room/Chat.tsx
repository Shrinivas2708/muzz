import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";

const Chat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [message, setMessage] = useState("");
  const messages = useRoomStore((state) => state.messages);
  const addMessage = useRoomStore((state) => state.addMessage);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up existing listeners first
    socket.off("newMessage");
    socket.off("previousMessages");
    socket.off("error");

    // Then set up new listeners
    socket.on("newMessage", (message) => {
      addMessage(message);
    });

    socket.on("previousMessages", (messages) => {
      useRoomStore.getState().setMessages(messages);
    });

    socket.on("error", ({ message: errorMessage }) => {
      toast.error(errorMessage || "An error occurred");
    });

    return () => {
      socket.off("newMessage");
      socket.off("previousMessages");
      socket.off("error");
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;

    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    if (!roomId) {
      toast.error("Invalid room");
      return;
    }

    const messageData = {
      roomId,
      userId: user._id,
      sender: user.username,
      message: message.trim(),
    };

    // Clear input immediately for better UX
    setMessage("");

    socket.emit(
      "sendMessage",
      messageData,
      (acknowledgment: { success: boolean }) => {
        if (!acknowledgment?.success) {
          toast.error("Message failed to send. Please try again.");
          // Optionally restore the message
          setMessage(messageData.message);
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 flex flex-col"
      >
        {messages.map((msg, index) => (
          <div
            key={msg.timestamp || index}
            className={`flex ${
              msg.sender === user?.username ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === user?.username
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              <p className="text-sm font-medium mb-1">{msg.sender}</p>
              <p className="text-sm break-words">{msg.message}</p>
              <span className="text-xs opacity-75 block mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t bg-white mt-auto">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isAuthenticated ? "Type a message..." : "Please login to chat"
            }
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            disabled={!isAuthenticated}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!isAuthenticated}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
