import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useRoomStore } from "@/store/roomStore";
import { useAuthStore } from "@/store/authStore";
import { socket } from "@/lib/socket";
import { useParams } from "react-router-dom";
import { SkipForward, Pause, Play, Volume2, VolumeX } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
// import { debounce } from "lodash";

const MusicPlayer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = useRef(1);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const currentSong = useRoomStore((state) => state.currentSong);
  const setCurrentSong = useRoomStore((state) => state.setCurrentSong);
  const user = useAuthStore((state) => state.user);
  const lastPlaybackTime = useRef(0);
  const lastKnownPosition = useRef(0);
  // const errorToastShown = useRef(false);
  const queue = useRoomStore((state) => state.queue);

  useEffect(() => {
    const checkRoomCreator = async () => {
      try {
        if (!roomId || !user?._id) return;
        const response = await api.get(`/rooms/${roomId}`);
        setIsRoomCreator(response.data.creator === user._id);
      } catch (error) {
        console.error("Failed to check room creator status:", error);
      }
    };

    checkRoomCreator();
  }, [roomId, user?._id]);

  useEffect(() => {
    if (currentSong && audioRef.current) {
      // Simple setup without complex error handling
      audioRef.current.src = currentSong.url;
      audioRef.current.load();
      audioRef.current.volume = volume;

      const playAudio = async () => {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Autoplay failed:", error);
          setIsPlaying(false);
        }
      };

      // Add basic event listeners
      audioRef.current.addEventListener("canplay", playAudio);
      audioRef.current.addEventListener("error", () => {
        console.error("Audio error, trying next song");
        if (queue.length > 1) {
          setCurrentSong(queue[1]); // Skip to next song on error
        }
      });

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("canplay", playAudio);
        }
      };
    }
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;

    // Listen for playback sync updates
    socket.on("playbackTimeUpdate", ({ time }) => {
      if (
        !isRoomCreator &&
        Math.abs(audioRef.current!.currentTime - time) > 1
      ) {
        audioRef.current!.currentTime = time;
      }
    });

    socket.on("seekUpdate", ({ time }) => {
      if (!isRoomCreator) {
        audioRef.current!.currentTime = time;
      }
    });

    socket.on("songPaused", () => {
      if (!isRoomCreator) {
        audioRef.current!.pause();
        setIsPlaying(false);
      }
    });

    socket.on("songPlayed", () => {
      if (!isRoomCreator) {
        audioRef.current!.play();
        setIsPlaying(true);
      }
    });

    // Listen for next song events
    socket.on("nextSong", ({ song }) => {
      setCurrentSong(song);
      if (song) {
        setProgress(0);
        setIsPlaying(true);
        lastKnownPosition.current = 0;
      }
    });

    // Add ended event listener
    audioRef.current.addEventListener("ended", handleSongEnd);

    return () => {
      socket.off("playbackTimeUpdate");
      socket.off("seekUpdate");
      socket.off("songPaused");
      socket.off("songPlayed");
      socket.off("nextSong");
      audioRef.current?.removeEventListener("ended", handleSongEnd);
    };
  }, [roomId, currentSong, setCurrentSong]);

  useEffect(() => {
    if (!currentSong && queue.length > 0) {
      setCurrentSong(queue[0]);
    }
  }, [queue, currentSong, setCurrentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setProgress(currentTime);
      setDuration(audioRef.current.duration);
      lastKnownPosition.current = currentTime;

      // Emit time updates more frequently for better sync
      if (
        isRoomCreator &&
        Math.abs(currentTime - lastPlaybackTime.current) > 0.5
      ) {
        lastPlaybackTime.current = currentTime;
        socket.emit("updatePlaybackTime", { roomId, time: currentTime });
      }
    }
  };

  const handleSongEnd = () => {
    if (currentSong) {
      socket.emit("songEnded", { roomId, songId: currentSong._id });
    }
  };

  const handleSeek = (value: number) => {
    if (!isRoomCreator || !audioRef.current) return;
    audioRef.current.currentTime = value;
    socket.emit("seekTime", { roomId, time: value });
  };

  const handlePlay = async () => {
    if (!audioRef.current?.src || !isRoomCreator) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);

      if (isRoomCreator) {
        socket.emit("songPlayed", {
          roomId,
          currentTime: audioRef.current.currentTime,
        });
      }
    } catch (error) {
      console.error("Play failed:", error);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (isRoomCreator) {
        socket.emit("songPaused", {
          roomId,
          currentTime: audioRef.current.currentTime,
        });
      }
    }
  };

  const handleVolumeChange = ([value]: number[]) => {
    const newVolume = value / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = previousVolume.current;
        setVolume(previousVolume.current);
      } else {
        previousVolume.current = volume;
        audioRef.current.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  // Add this effect to handle initial room state
  useEffect(() => {
    if (roomId) {
      // Request initial room state when joining
      socket.emit("joinRoom", { roomId });

      // Handle initial room state
      socket.on(
        "roomState",
        ({ currentSong,  playbackTime, isPlaying }) => {
          setCurrentSong(currentSong);
          if (audioRef.current && currentSong) {
            audioRef.current.src = currentSong.url;
            audioRef.current.currentTime = playbackTime;
            if (isPlaying) {
              audioRef.current.play().catch(console.error);
              setIsPlaying(true);
            }
          }
        }
      );

      return () => {
        socket.off("roomState");
      };
    }
  }, [roomId, setCurrentSong]);

  return (
    <div className="w-full space-y-4">
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnd}
        onError={(e) => {
          console.error("Audio error:", e);
          toast.error("Playback error occurred");
          setIsPlaying(false);
        }}
        preload="auto"
      />

      {currentSong ? (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{currentSong.title}</h3>
              <p className="text-sm text-gray-500">{currentSong.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              {isRoomCreator && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isPlaying ? handlePause : handlePlay}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSongEnd}>
                    <SkipForward className="h-6 w-6" />
                  </Button>
                </>
              )}
              <div
                className="flex items-center gap-2 ml-4"
                style={{ width: "150px" }}
              >
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
          <Slider
            value={[progress]}
            max={duration}
            step={1}
            onValueChange={([value]) => handleSeek(value)}
            disabled={!isRoomCreator}
            className="mt-2"
          />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No songs in queue</p>
          <p className="text-sm text-gray-400">Add songs to start playing</p>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
