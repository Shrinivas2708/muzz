import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
// import Navbar from "@/components/Navbar";
import { Suspense, lazy } from "react";
import Loading from "@/components/ui/loading";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ReactNode } from "react";
import RoomLayout from "@/layouts/RoomLayout";

// Lazy load pages for better performance
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Room = lazy(() => import("@/pages/Room"));
const Home = lazy(() => import("@/pages/Home"));

// Protected Route wrapper component
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Save the attempted URL
    return <Navigate to={`/login?from=${location.pathname}`} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  <Login />
                </ErrorBoundary>
              }
            />
            <Route
              path="/register"
              element={
                <ErrorBoundary>
                  <Register />
                </ErrorBoundary>
              }
            />

            {/* Protected routes with RoomLayout */}
            <Route element={<RoomLayout />}>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/room/:roomId"
                element={
                  <PrivateRoute>
                    <Room />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </ErrorBoundary>
    </Router>
    
  );
}

export default App;
