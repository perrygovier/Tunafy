import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AudioController } from "../../core/audio/AudioController";
import {
  PLAYER_EVENTS,
  type PlaybackTimePayload,
} from "../../core/audio/audioEvents";
import { createTrackFromFile } from "../../core/audio/createTrackFromFile";
import { trackDB } from "../../core/storage/indexedDB";
import type {
  PlayerState,
  RepeatMode,
  Track,
} from "../../features/player/types";

type PlayerContextValue = {
  state: PlayerState;
  addFiles: (files: File[]) => Promise<void>;
  playTrackAt: (index: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (time: number) => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  removeTrack: (id: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

type PlayerAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD_TRACKS"; payload: Track[] }
  | { type: "REMOVE_TRACK"; payload: string }
  | { type: "REORDER"; payload: { fromIndex: number; toIndex: number } }
  | { type: "CLEAR_QUEUE" }
  | { type: "SET_INDEX"; payload: number }
  | { type: "TRACK_LOADED"; payload: Track }
  | { type: "TIME_UPDATE"; payload: PlaybackTimePayload }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_MESSAGE"; payload: string | null }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "CYCLE_REPEAT" };

const initialState: PlayerState = {
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  progress: 0,
  volume: 1,
  isLoadingTrack: false,
  error: null,
  message: null,
  repeatMode: "off",
  shuffle: false,
};

function nextRepeatMode(mode: RepeatMode): RepeatMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingTrack: action.payload };

    case "ADD_TRACKS": {
      const existingIds = new Set(state.queue.map((track) => track.id));
      return {
        ...state,
        queue: [
          ...state.queue,
          ...action.payload.filter((track) => !existingIds.has(track.id)),
        ],
      };
    }

    case "REMOVE_TRACK": {
      const removeIndex = state.queue.findIndex((t) => t.id === action.payload);
      if (removeIndex === -1) {
        return state;
      }

      const nextQueue = state.queue.filter((t) => t.id !== action.payload);
      let nextIndex = state.currentIndex;
      let nextTrack = state.currentTrack;

      if (removeIndex === state.currentIndex) {
        // Removed the playing track. Reset current track; provider will handle advance.
        nextIndex = -1;
        nextTrack = null;
      } else if (removeIndex < state.currentIndex) {
        nextIndex = state.currentIndex - 1;
      }

      return {
        ...state,
        queue: nextQueue,
        currentIndex: nextIndex,
        currentTrack: nextTrack,
      };
    }

    case "REORDER": {
      const { fromIndex, toIndex } = action.payload;
      const len = state.queue.length;

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= len ||
        toIndex < 0 ||
        toIndex >= len
      ) {
        return state;
      }

      // Track the playing song by id so we can keep currentIndex pointing at it
      // regardless of where it lands in the new order.
      const playingId =
        state.currentIndex >= 0 ? state.queue[state.currentIndex]?.id : null;

      const queue = state.queue.slice();
      const [moved] = queue.splice(fromIndex, 1);
      queue.splice(toIndex, 0, moved);

      const nextIndex = playingId
        ? queue.findIndex((t) => t.id === playingId)
        : state.currentIndex;

      return {
        ...state,
        queue,
        currentIndex: nextIndex,
      };
    }

    case "CLEAR_QUEUE":
      return {
        ...state,
        queue: [],
        currentIndex: -1,
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        progress: 0,
      };

    case "SET_INDEX":
      return { ...state, currentIndex: action.payload };

    case "TRACK_LOADED": {
      // Sync resolved duration back into the queue entry too.
      const queue = state.queue.map((t) =>
        t.id === action.payload.id ? action.payload : t,
      );
      return {
        ...state,
        queue,
        currentTrack: action.payload,
        duration: action.payload.duration ?? 0,
        currentTime: 0,
        progress: 0,
        isPlaying: false,
        error: null,
      };
    }

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
      return {
        ...state,
        error: action.payload,
        message: null,
        isPlaying: false,
        isLoadingTrack: false,
      };

    case "SET_MESSAGE":
      return {
        ...state,
        message: action.payload,
      };

    case "TOGGLE_SHUFFLE":
      return { ...state, shuffle: !state.shuffle };

    case "CYCLE_REPEAT":
      return { ...state, repeatMode: nextRepeatMode(state.repeatMode) };

    default:
      return state;
  }
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const controller = useMemo(() => new AudioController(), []);
  const [loaded, setLoaded] = useState(false);

  // Keep a live ref to state so stable callbacks (and event handlers) can read it
  // without becoming sources of re-subscriptions.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const playTrackAt = useCallback(
    async (index: number) => {
      const queue = stateRef.current.queue;
      if (index < 0 || index >= queue.length) {
        return;
      }

      const track = queue[index];
      dispatch({ type: "SET_INDEX", payload: index });
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        await controller.loadTrack(track);
        await controller.play();
      } catch {
        dispatch({
          type: "SET_ERROR",
          payload: `Failed to play "${track.title}".`,
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [controller],
  );

  const next = useCallback(async () => {
    const { queue, currentIndex, repeatMode, shuffle } = stateRef.current;
    if (queue.length === 0) {
      return;
    }

    let nextIndex: number;

    if (shuffle) {
      if (queue.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex);
      }
    } else if (currentIndex + 1 < queue.length) {
      nextIndex = currentIndex + 1;
    } else if (repeatMode === "all") {
      nextIndex = 0;
    } else {
      // End of queue, no repeat: stop.
      return;
    }

    await playTrackAt(nextIndex);
  }, [playTrackAt]);

  const prev = useCallback(async () => {
    const { queue, currentIndex, currentTime } = stateRef.current;
    if (queue.length === 0) {
      return;
    }

    // If we're more than 3s into the song, restart it instead of going back a track
    // (matches the convention most music players use).
    if (currentTime > 3) {
      controller.seek(0);
      return;
    }

    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : Math.max(queue.length - 1, 0);
    await playTrackAt(prevIndex);
  }, [controller, playTrackAt]);

  // `next` may change on every render; route the ENDED handler through a ref so the
  // subscription effect below stays stable and does not tear down event listeners.
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // Subscribe to controller events exactly once per controller instance.
  useEffect(() => {
    const unsubs = [
      controller.subscribe<Track>(PLAYER_EVENTS.TRACK_LOADED, (track) =>
        dispatch({ type: "TRACK_LOADED", payload: track }),
      ),
      controller.subscribe<PlaybackTimePayload>(
        PLAYER_EVENTS.TIME_UPDATE,
        (payload) => dispatch({ type: "TIME_UPDATE", payload }),
      ),
      controller.subscribe<null>(PLAYER_EVENTS.PLAYBACK_STARTED, () =>
        dispatch({ type: "SET_PLAYING", payload: true }),
      ),
      controller.subscribe<null>(PLAYER_EVENTS.PLAYBACK_PAUSED, () =>
        dispatch({ type: "SET_PLAYING", payload: false }),
      ),
      controller.subscribe<string>(PLAYER_EVENTS.ERROR, (message) =>
        dispatch({ type: "SET_ERROR", payload: message }),
      ),
      controller.subscribe<null>(PLAYER_EVENTS.ENDED, () => {
        dispatch({ type: "SET_PLAYING", payload: false });

        const { repeatMode, currentIndex, queue } = stateRef.current;
        if (repeatMode === "one") {
          const track = queue[currentIndex];
          if (track) {
            controller
              .loadTrack(track)
              .then(() => controller.play())
              .catch(() => {
                /* error already emitted by controller */
              });
          }
          return;
        }

        void nextRef.current?.();
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [controller]);

  // Load persisted tracks on mount
  useEffect(() => {
    const loadPersistedTracks = async () => {
      try {
        const storedTracks = await trackDB.getAll();
        const tracks: Track[] = storedTracks.map((stored) => ({
          ...stored.metadata,
          src: URL.createObjectURL(stored.file),
        }));

        // Load playlist order from localStorage
        const storedQueue = localStorage.getItem('tunafy-queue');
        if (storedQueue === null) {
          // First time, add all tracks.
          dispatch({ type: "ADD_TRACKS", payload: tracks });
        } else {
          try {
            const queueHashes: string[] = JSON.parse(storedQueue);
            if (queueHashes.length > 0) {
              const orderedTracks = queueHashes
                .map((hash) => tracks.find((t) => t.id === hash))
                .filter(Boolean) as Track[];
              if (orderedTracks.length > 0) {
                dispatch({ type: "ADD_TRACKS", payload: orderedTracks });
              } else {
                // If the saved order doesn't match any stored IDs, restore all tracks.
                dispatch({ type: "ADD_TRACKS", payload: tracks });
              }
            }
            // If length == 0, keep empty (user cleared)
          } catch {
            // Invalid JSON, add all
            dispatch({ type: "ADD_TRACKS", payload: tracks });
          }
        }
        setLoaded(true);
      } catch (error) {
        console.error('Failed to load persisted tracks:', error);
      }
    };

    loadPersistedTracks();
  }, []);

  // Save queue order on changes
  useEffect(() => {
    if (loaded) {
      const queueHashes = state.queue.map((track) => track.id);
      localStorage.setItem('tunafy-queue', JSON.stringify(queueHashes));
    }
  }, [state.queue, loaded]);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    const timeout = window.setTimeout(() => {
      dispatch({ type: "SET_MESSAGE", payload: null });
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [state.message]);

  // Tear down the controller and revoke any blob URLs we still own when the provider
  // unmounts. Kept in its own effect so transient dep changes don't destroy the audio.
  useEffect(() => {
    return () => {
      controller.destroy();
      stateRef.current.queue.forEach((track) => {
        if (track.src.startsWith("blob:")) {
          URL.revokeObjectURL(track.src);
        }
      });
    };
  }, [controller]);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      const wasEmpty = stateRef.current.queue.length === 0;
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_MESSAGE", payload: null });

      try {
        const tracks = await Promise.all(files.map((file) => createTrackFromFile(file)));
        const existingIds = new Set(stateRef.current.queue.map((t) => t.id));
        const newTracks = tracks.filter((track) => !existingIds.has(track.id));
        const duplicateCount = tracks.length - newTracks.length;

        if (duplicateCount > 0) {
          const note =
            duplicateCount === 1
              ? "One duplicate track was skipped."
              : `${duplicateCount} duplicate tracks were skipped.`;
          dispatch({ type: "SET_MESSAGE", payload: note });
        }

        if (newTracks.length > 0) {
          dispatch({ type: "ADD_TRACKS", payload: newTracks });

          if (wasEmpty) {
            // Auto-load (but don't auto-play) the first added track so the user sees
            // it queued up in the player UI.
            const firstIndex = 0;
            dispatch({ type: "SET_INDEX", payload: firstIndex });
            await controller.loadTrack(newTracks[firstIndex]);
          }
        }
      } catch {
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to load one or more MP3 files.",
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [controller],
  );

  const togglePlayPause = useCallback(async () => {
    const { currentTrack, isPlaying, queue, currentIndex } = stateRef.current;

    if (!currentTrack) {
      // Nothing loaded yet but there is a queue: start from the beginning.
      if (queue.length > 0) {
        await playTrackAt(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    if (isPlaying) {
      controller.pause();
      return;
    }

    await controller.play();
  }, [controller, playTrackAt]);

  const seekTo = useCallback(
    (time: number) => {
      controller.seek(time);
    },
    [controller],
  );

  const removeTrack = useCallback(
    (id: string) => {
      const before = stateRef.current;
      const removeIndex = before.queue.findIndex((t) => t.id === id);
      if (removeIndex === -1) return;

      const wasPlayingRemoved = removeIndex === before.currentIndex;
      const track = before.queue[removeIndex];

      if (wasPlayingRemoved) {
        // Stop playback; the user can pick another track to resume.
        controller.pause();
      }

      dispatch({ type: "REMOVE_TRACK", payload: id });

      if (track.src.startsWith("blob:")) {
        URL.revokeObjectURL(track.src);
      }
    },
    [controller],
  );

  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: "REORDER", payload: { fromIndex, toIndex } });
  }, []);

  const clearQueue = useCallback(() => {
    controller.pause();
    stateRef.current.queue.forEach((track) => {
      if (track.src.startsWith("blob:")) {
        URL.revokeObjectURL(track.src);
      }
    });
    dispatch({ type: "CLEAR_QUEUE" });
    trackDB.clear();
    localStorage.removeItem('tunafy-queue');
  }, [controller]);

  const toggleShuffle = useCallback(() => {
    dispatch({ type: "TOGGLE_SHUFFLE" });
  }, []);

  const cycleRepeat = useCallback(() => {
    dispatch({ type: "CYCLE_REPEAT" });
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      state,
      addFiles,
      playTrackAt,
      togglePlayPause,
      seekTo,
      next,
      prev,
      removeTrack,
      reorderTracks,
      clearQueue,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      addFiles,
      clearQueue,
      cycleRepeat,
      next,
      playTrackAt,
      prev,
      removeTrack,
      reorderTracks,
      seekTo,
      state,
      togglePlayPause,
      toggleShuffle,
    ],
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
