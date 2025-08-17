import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
// import Navbar from "@/components/Navbar";
import { Suspense, lazy } from "react";
import Loading from "@/components/ui/loading";
import ErrorBoundary from "@/components/ErrorBoundary";
import RoomLayout from "@/layouts/RoomLayout";
import PrivateRoute from "./components/PrivateRoute";

// Lazy load pages for better performance
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Room = lazy(() => import("@/pages/Room"));
const Home = lazy(() => import("@/pages/Home"));
const Landing = lazy(() => import("@/pages/Landing"));

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  return <Navigate to="/home" replace />;
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Landing page only for unauthenticated users */}
            <Route
              path="/"
              element={
                <GuestRoute>
                  <ErrorBoundary>
                    <Landing />
                  </ErrorBoundary>
                </GuestRoute>
              }
            />
            {/* Login/Register only for unauthenticated users */}
            <Route
  path="/login"
  element={
    <GuestRoute>
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    </GuestRoute>
  }
/>
<Route
  path="/register"
  element={
    <GuestRoute>
      <ErrorBoundary>
        <Register />
      </ErrorBoundary>
    </GuestRoute>
  }
/>

            {/* Protected routes with RoomLayout */}
            <Route element={<RoomLayout />}>
              <Route
                path="/home"
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
