import { create } from 'zustand';

interface Message {
  sender: string;
  message: string;
  timestamp: string;
}

interface Song {
  _id: string;
  title: string;
  artist: string;
  url: string;
  thumbnail?: string;
  duration: number;
  addedBy: string;
  votes: number;
  upvoters: string[];
  downvoters: string[];
  upvotes: number;
  downvotes: number;
}

interface RoomState {
  messages: Message[];
  queue: Song[];
  currentSong: Song | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setQueue: (queue: Song[]) => void;
  setCurrentSong: (song: Song | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  messages: [],
  queue: [],
  currentSong: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message].slice(-50) // Keep only last 50 messages
  })),
  setQueue: (queue) => set({ queue }),
  setCurrentSong: (song) => set({ currentSong: song }),
}));