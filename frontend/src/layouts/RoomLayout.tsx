import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/Navbar";
import { AlertCircle } from "lucide-react";

const RoomLayout = () => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {/* Mobile warning banner */}
      <div className="lg:hidden">
        <div className="bg-blue-50 p-3 fixed  left-0 right-0 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <p className="text-xs text-blue-700">
              For the best experience, use a larger screen
            </p>
          </div>
        </div>
      </div>
      <main className="container mx-auto py-6 px-4 mt-16 lg:mb-0 mb-12">
        <Outlet />
      </main>
    </>
  );
};

export default RoomLayout;
