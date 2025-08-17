import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center">
      {/* Radial Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #7c3aed 100%)",
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="z-10 text-center px-4"
      >
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6"
        >
          Welcome to <span className="text-purple-600">Muzz</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-lg md:text-xl text-gray-700 max-w-xl mx-auto mb-10"
        >
          Listen, chat, and vibe together. Join music rooms, discover new tracks,
          and connect with friends in real time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="px-8 py-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md transition"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-8 py-5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition"
            onClick={() => navigate("/register")}
          >
            Register
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
