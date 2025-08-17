import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import api from "@/lib/axios";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Get the redirect URL from state or search params
  // const from = location.state?.from || new URLSearchParams(location.search).get('from') || '/';

  const handleLoginSuccess = () => {
    // Always redirect to /home after successful login
    navigate('/home', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;
      setAuth(token, user);
      toast.success("Login successful!");
      handleLoginSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 -z-10" style={{background: "radial-gradient(120% 120% at 50% 90%, #fff 40%, #a78bfa 100%)"}} />
      <Card className="w-full max-w-md rounded-3xl bg-white/90 shadow-2xl p-6 md:p-10 border-0">
        <CardHeader>
          <h2 className="text-3xl font-extrabold text-purple-700 text-center mb-2 tracking-tight">Login to Muzz</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-purple-700">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="rounded-xl border-purple-200 focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-purple-700">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="rounded-xl border-purple-200 focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-purple-600 hover:underline font-semibold">Register here</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
