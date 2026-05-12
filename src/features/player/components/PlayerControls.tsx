import type { ReactNode } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function PlayerControls() {
  const {
    state: {
      currentTrack,
      queue,
      isPlaying,
      isLoadingTrack,
      currentTime,
      duration,
      shuffle,
      repeatMode,
    },
    togglePlayPause,
    seekTo,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const hasTracks = queue.length > 0;
  const playDisabled = (!currentTrack && !hasTracks) || isLoadingTrack;
  const navDisabled = !hasTracks || isLoadingTrack;
  const seekDisabled = !currentTrack || isLoadingTrack || duration <= 0;

  const repeatLabel =
    repeatMode === "off"
      ? "Repeat off"
      : repeatMode === "all"
        ? "Repeat all"
        : "Repeat one";

  const seekBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    seekTo(newTime);
  };

  const seekForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    seekTo(newTime);
  };

  return (
    <section className="flex flex-wrap justify-center gap-2">
      <IconButton
        label="Shuffle"
        onClick={toggleShuffle}
        active={shuffle}
        disabled={!hasTracks}
      >
        <ShuffleIcon />
      </IconButton>

      <IconButton
        label="Previous track"
        onClick={() => void prev()}
        disabled={navDisabled}
      >
        <PrevIcon />
      </IconButton>

      <IconButton
        label="Rewind 5 seconds"
        onClick={seekBackward}
        disabled={seekDisabled}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 4v8l-4-4 4-4z"/>
          <path d="M8 4v8l-4-4 4-4z"/>
        </svg>
      </IconButton>

      <button
        type="button"
        disabled={playDisabled}
        onClick={() => void togglePlayPause()}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex cursor-pointer items-center justify-center rounded-lg bg-purple-500 px-4 py-2.5 text-white transition hover:bg-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <IconButton
        label="Fast forward 5 seconds"
        onClick={seekForward}
        disabled={seekDisabled}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 4v8l4-4-4-4z"/>
          <path d="M8 4v8l4-4-4-4z"/>
        </svg>
      </IconButton>

      <IconButton
        label="Next track"
        onClick={() => void next()}
        disabled={navDisabled}
      >
        <NextIcon />
      </IconButton>

      <IconButton
        label={repeatLabel}
        onClick={cycleRepeat}
        active={repeatMode !== "off"}
        disabled={!hasTracks}
      >
        {repeatMode === "one" ? <RepeatOneIcon /> : <RepeatAllIcon />}
      </IconButton>
    </section>
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
};

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed ${
        active
          ? "bg-purple-500/30 text-purple-300 hover:bg-purple-500/40"
          : "bg-slate-700 text-purple-400 hover:bg-slate-600 hover:text-purple-300"
      } disabled:bg-slate-800 disabled:text-slate-500`}
    >
      {children}
    </button>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M6 5h2v14H6zM20 5l-12 7 12 7z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M16 5h2v14h-2zM4 5l12 7-12 7z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

function RepeatAllIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function RepeatOneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <text x="11" y="15" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">
        1
      </text>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
