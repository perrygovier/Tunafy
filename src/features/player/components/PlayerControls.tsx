import { usePlayer } from "../hooks/usePlayer";

export function PlayerControls() {
  const {
    state: { currentTrack, isPlaying, isLoadingTrack, currentTime, duration },
    togglePlayPause,
    seekTo,
  } = usePlayer();

  const disabled = !currentTrack || isLoadingTrack;

  const seekBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    seekTo(newTime);
  };

  const seekForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    seekTo(newTime);
  };

  return (
    <section className="flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={seekBackward}
        className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-purple-500 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        title="Rewind 5 seconds"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 4v8l-4-4 4-4z"/>
          <path d="M8 4v8l-4-4 4-4z"/>
        </svg>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void togglePlayPause()}
        className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={seekForward}
        className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-purple-500 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        title="Fast forward 5 seconds"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 4v8l4-4-4-4z"/>
          <path d="M8 4v8l4-4-4-4z"/>
        </svg>
      </button>
    </section>
  );
}
