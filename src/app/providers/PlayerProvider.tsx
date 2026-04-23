import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { AudioController } from "../../core/audio/AudioController";
import { PLAYER_EVENTS, type PlaybackTimePayload } from "../../core/audio/audioEvents";
import type { PlayerState, Track } from "../../features/player/types";

type PlayerContextValue = {
  state: PlayerState;
  loadFile: (file: File) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (time: number) => void;
};

type PlayerAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "TRACK_LOADED"; payload: Track }
  | { type: "TIME_UPDATE"; payload: PlaybackTimePayload }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  volume: 1,
  isLoadingTrack: false,
  error: null,
};

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingTrack: action.payload };
    case "TRACK_LOADED":
      return {
        ...state,
        currentTrack: action.payload,
        duration: action.payload.duration ?? 0,
        currentTime: 0,
        progress: 0,
        isPlaying: false,
        error: null,
      };
    case "TIME_UPDATE":
      return {
        ...state,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration,
        progress: action.payload.progress,
        isPlaying: action.payload.isPlaying,
      };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isPlaying: false, isLoadingTrack: false };
    default:
      return state;
  }
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const controller = useMemo(() => new AudioController(), []);

  useEffect(() => {
    const unsubTrackLoaded = controller.subscribe<Track>(
      PLAYER_EVENTS.TRACK_LOADED,
      (track) => {
        dispatch({ type: "TRACK_LOADED", payload: track });
        dispatch({ type: "SET_LOADING", payload: false });
      },
    );
    const unsubTimeUpdate = controller.subscribe<PlaybackTimePayload>(
      PLAYER_EVENTS.TIME_UPDATE,
      (payload) => dispatch({ type: "TIME_UPDATE", payload }),
    );
    const unsubStarted = controller.subscribe<null>(PLAYER_EVENTS.PLAYBACK_STARTED, () =>
      dispatch({ type: "SET_PLAYING", payload: true }),
    );
    const unsubPaused = controller.subscribe<null>(PLAYER_EVENTS.PLAYBACK_PAUSED, () =>
      dispatch({ type: "SET_PLAYING", payload: false }),
    );
    const unsubEnded = controller.subscribe<null>(PLAYER_EVENTS.ENDED, () =>
      dispatch({ type: "SET_PLAYING", payload: false }),
    );
    const unsubError = controller.subscribe<string>(PLAYER_EVENTS.ERROR, (message) =>
      dispatch({ type: "SET_ERROR", payload: message }),
    );

    return () => {
      unsubTrackLoaded();
      unsubTimeUpdate();
      unsubStarted();
      unsubPaused();
      unsubEnded();
      unsubError();
      controller.destroy();
    };
  }, [controller]);

  const loadFile = useCallback(
    async (file: File) => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        await controller.loadTrack(file);
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to load selected MP3 file." });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [controller],
  );

  const togglePlayPause = useCallback(async () => {
    if (!state.currentTrack) {
      return;
    }

    if (state.isPlaying) {
      controller.pause();
      return;
    }

    await controller.play();
  }, [controller, state.currentTrack, state.isPlaying]);

  const seekTo = useCallback(
    (time: number) => {
      controller.seek(time);
    },
    [controller],
  );

  const value = useMemo(
    () => ({
      state,
      loadFile,
      togglePlayPause,
      seekTo,
    }),
    [loadFile, seekTo, state, togglePlayPause],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayerContext() {
  const value = useContext(PlayerContext);

  if (!value) {
    throw new Error("usePlayerContext must be used within PlayerProvider");
  }

  return value;
}
