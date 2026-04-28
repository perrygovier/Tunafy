export type Track = {
  id: string;
  title: string;
  src: string;
  duration?: number;
  artist?: string;
  imgUrl?: string;
};

export type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  volume: number;
  isLoadingTrack: boolean;
  error: string | null;
};
