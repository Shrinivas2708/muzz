import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

interface SaavnImage {
  quality: string;
  url: string;
}

interface SaavnArtist {
  id: string;
  name: string;
  url: string;
}

interface SearchResult {
  id: string;
  name: string;
  url: string;
  duration: number | null;
  image: SaavnImage[];
  downloadUrl: { quality: string; url: string }[];
  artists: {
    primary: SaavnArtist[];
    featured: SaavnArtist[];
    all: SaavnArtist[];
  };
  album: {
    id: string | null;
    name: string | null;
    url: string | null;
  };
}

interface SongSearchProps {
  isRoomCreator: boolean;
}

const SongSearch = ({ isRoomCreator }: SongSearchProps) => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const searchSaavn = async () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://saavn.dev/api/search/songs?query=${encodeURIComponent(
          searchTerm
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from Saavn API");
      }

      const data = await response.json();

      if (!data.success || !data.data.results) {
        throw new Error("No results found");
      }

      setResults(data.data.results);
    } catch (error) {
      console.error("Saavn search error:", error);
      toast.error("Failed to search songs");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToQueue = async (song: SearchResult) => {
    if (!roomId || !user?._id) {
      toast.error("Must be logged in to add songs");
      return;
    }

    if (!isRoomCreator) {
      toast.error("Only room creator can add songs");
      return;
    }

    try {
      // Get the highest quality download URL
      const downloadUrl = song.downloadUrl.sort((a, b) => {
        const qualityA = parseInt(a.quality.replace("kbps", ""));
        const qualityB = parseInt(b.quality.replace("kbps", ""));
        return qualityB - qualityA;
      })[0]?.url;

      if (!downloadUrl) {
        throw new Error("No download URL available");
      }

      console.log('Attempting to add song as user:', user._id);

      const songData = {
        title: song.name,
        artist: song.artists.primary.map((artist) => artist.name).join(", "),
        url: downloadUrl,
        addedBy: user._id,
        thumbnail:
          song.image.find((img) => img.quality === "500x500")?.url ||
          song.image[0]?.url,
        duration: song.duration,
        albumName: song.album.name,
        id: song.id,
      };

      socket.emit("addSong", {
        roomId,
        song: songData,
        userId: user._id,
      });

      setSearchTerm(""); // Clear search after adding
      setResults([]); // Clear results after adding
      toast.success("Song added to queue");
    } catch (error) {
      console.error("Add to queue error:", error);
      toast.error("Failed to add song to queue");
    }
  };

  if (!isRoomCreator) {
    return (
      <div className="text-center p-4 text-gray-500">
        Only room creator can add songs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for songs..."
          onKeyPress={(e) => e.key === "Enter" && searchSaavn()}
          disabled={isLoading}
        />
        <Button onClick={searchSaavn} disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="grid gap-4">
        {results.map((song) => (
          <Card key={song.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <img
                src={
                  song.image.find((img) => img.quality === "500x500")?.url ||
                  song.image[0]?.url
                }
                alt={song.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{song.name}</h3>
                <p className="text-sm text-gray-500">
                  {song.artists.primary.map((artist) => artist.name).join(", ")}
                </p>
                {song.album.name && (
                  <p className="text-xs text-gray-400">
                    Album: {song.album.name}
                  </p>
                )}
              </div>
              <Button onClick={() => addToQueue(song)}>Add to Queue</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SongSearch;
