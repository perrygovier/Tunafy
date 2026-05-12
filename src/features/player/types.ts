export type Track = {
  id: string;
  title: string;
  src: string;
  duration?: number;
  artist?: string;
  imgUrl?: string;
};

export type RepeatMode = "off" | "all" | "one";

export type PlayerState = {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  volume: number;
  isLoadingTrack: boolean;
  error: string | null;
  message: string | null;
  repeatMode: RepeatMode;
  shuffle: boolean;
};
