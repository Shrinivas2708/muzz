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
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Music2 className="h-6 w-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900">Muzz</h1>
            </div>

            <div className="absolute left-1/2 transform -translate-x-1/2">
              <p className="text-red-500 font-medium animate-pulse">
                Under Development • May Experience Bugs
              </p>
            </div>

            <div className="flex items-center gap-4">
              {!isInRoom && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Room
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Welcome, {user?.username}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
