import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';

const RoomLayout = () => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    < >
      
      <Navbar />
      <main className="container mx-auto py-6 px-4 mt-16">
        <Outlet />
      </main>
    </>
  );
};

export default RoomLayout;