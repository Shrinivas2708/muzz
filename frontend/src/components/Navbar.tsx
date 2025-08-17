import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { Music2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isInRoom = location.pathname.startsWith("/room/");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post("/rooms/create", {
        creator: user?._id,
        name: newRoomName,
      });

      // Join the room immediately after creation
      await api.post(`/rooms/join/${response.data.room._id}`);
      
      toast.success("Room created successfully!");
      setIsCreateDialogOpen(false);
      setNewRoomName("");
      navigate(`/room/${response.data.room._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <nav className="bg-white/90 border-b border-purple-200 fixed w-full top-0 z-50 rounded-b-2xl shadow-lg backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Music2 className="h-7 w-7 text-purple-600" />
              <h1 className="text-2xl font-extrabold text-purple-700 tracking-tight">Muzz</h1>
            </div>
            <div className="flex items-center gap-4">
              {!isInRoom && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden md:block">Create Room</span>
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 font-semibold">
                  Welcome, {user?.username}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 font-semibold rounded-xl"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateRoom();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} disabled={isCreating} className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
