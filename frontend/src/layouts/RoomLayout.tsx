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
        <div className="bg-purple-100 p-3 fixed left-0 right-0 z-50 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-purple-500" />
            <p className="text-xs text-purple-700">
              For the best experience, use a larger screen
            </p>
          </div>
        </div>
      </div>
      {/* Radial gradient background */}
      <div className="fixed inset-0 -z-10" style={{background: "radial-gradient(120% 120% at 50% 90%, #fff 40%, #a78bfa 100%)"}} />
      <main className="container mx-auto py-10 px-4 mt-16 lg:mb-0 mb-12 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl bg-white/90 shadow-2xl p-6 md:p-10">
          <Outlet />
        </div>
      </main>
    </>
  );
};

export default RoomLayout;
