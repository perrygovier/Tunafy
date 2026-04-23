import { usePlayer } from "../hooks/usePlayer";

export function PlayerControls() {
  const {
    state: { currentTrack, isPlaying, isLoadingTrack },
    togglePlayPause,
  } = usePlayer();

  const disabled = !currentTrack || isLoadingTrack;

  return (
    <section className="flex items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void togglePlayPause()}
        className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <p className="text-sm text-slate-400">
        Status:{" "}
        <span className="font-medium text-slate-200">
          {isPlaying ? "Playing" : "Paused"}
        </span>
      </p>
    </section>
  );
}
