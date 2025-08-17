import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AuthLayout = () => {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 -z-10" style={{background: "radial-gradient(120% 120% at 50% 90%, #fff 40%, #a78bfa 100%)"}} />
      <div className="w-full max-w-md rounded-3xl bg-white/90 shadow-2xl p-6 md:p-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;