import type { ReactNode } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function PlayerControls() {
  const {
    state: {
      currentTrack,
      queue,
      isPlaying,
      isLoadingTrack,
      shuffle,
      repeatMode,
    },
    togglePlayPause,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();

  const hasTracks = queue.length > 0;
  const playDisabled = (!currentTrack && !hasTracks) || isLoadingTrack;
  const navDisabled = !hasTracks || isLoadingTrack;

  const repeatLabel =
    repeatMode === "off"
      ? "Repeat off"
      : repeatMode === "all"
        ? "Repeat all"
        : "Repeat one";

  return (
    <section className="flex flex-wrap items-center gap-3">
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

      <button
        type="button"
        disabled={playDisabled}
        onClick={() => void togglePlayPause()}
        className="rounded-full bg-purple-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>

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

      <p className="ml-auto text-sm text-slate-400">
        Status:{" "}
        <span className="font-medium text-slate-200">
          {isPlaying ? "Playing" : "Paused"}
        </span>
      </p>
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
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-purple-400 bg-purple-500/20 text-purple-200"
          : "border-slate-700 bg-slate-900 text-slate-200 hover:border-purple-400 hover:text-white"
      }`}
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
