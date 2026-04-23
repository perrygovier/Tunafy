export const PLAYER_EVENTS = {
  TRACK_LOADED: "player:track_loaded",
  PLAYBACK_STARTED: "player:playback_started",
  PLAYBACK_PAUSED: "player:playback_paused",
  TIME_UPDATE: "player:time_update",
  SEEKED: "player:seeked",
  ENDED: "player:ended",
  ERROR: "player:error",
} as const;

export type PlayerEventName =
  (typeof PLAYER_EVENTS)[keyof typeof PLAYER_EVENTS];

export type PlaybackTimePayload = {
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
};
