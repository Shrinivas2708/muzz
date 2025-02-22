import { useRoomStore } from '@/store/roomStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { socket } from '@/lib/socket';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

const Queue = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const queue = useRoomStore((state) => state.queue);
  const currentSong = useRoomStore((state) => state.currentSong);
  const user = useAuthStore((state) => state.user);
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  useEffect(() => {
    const checkRoomCreator = async () => {
      try {
        if (!roomId || !user?._id) return;
        const response = await api.get(`/rooms/${roomId}`);
        setIsRoomCreator(response.data.creator === user._id);
      } catch (error) {
        console.error('Failed to check room creator status:', error);
      }
    };

    checkRoomCreator();
  }, [roomId, user?._id]);

  // Filter out the currently playing song from the queue
  const remainingQueue = queue.filter(song => song._id !== currentSong?._id);

  const handleVote = async (songId: string, voteType: 'upvote' | 'downvote') => {
    try {
      if (!user?._id) {
        toast.error('Must be logged in to vote');
        return;
      }
      socket.emit('voteSong', { roomId, songId, voteType, userId: user._id });
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleDelete = async (songId: string) => {
    try {
      if (!user?._id) {
        toast.error('Must be logged in to delete songs');
        return;
      }
      socket.emit('deleteSong', { roomId, songId, userId: user._id });
    } catch (error) {
      toast.error('Failed to delete song');
    }
  };

  if (remainingQueue.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No songs in queue
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {remainingQueue.map((song) => (
        <Card key={song._id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-semibold">{song.title}</h3>
              <p className="text-sm text-gray-500">{song.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-green-500">+{song.upvotes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(song._id, 'upvote')}
                  className={song.upvoters?.includes(user?._id ?? '') ? 'bg-green-100' : ''}
                >
                  <ThumbsUp className={`h-4 w-4 ${song.upvoters?.includes(user?._id ?? '') ? 'text-green-500' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-red-500">+{song.downvotes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(song._id, 'downvote')}
                  className={song.downvoters?.includes(user?._id ?? '') ? 'bg-red-100' : ''}
                >
                  <ThumbsDown className={`h-4 w-4 ${song.downvoters?.includes(user?._id ?? '') ? 'text-red-500' : ''}`} />
                </Button>
              </div>
              <span className="text-sm text-gray-500 ml-2">Total: {song.votes}</span>
              {(user?._id === song.addedBy || isRoomCreator) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(song._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Queue;