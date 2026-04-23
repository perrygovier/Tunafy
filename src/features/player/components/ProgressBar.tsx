import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "../../../shared/utils/formatTime";

export function ProgressBar() {
  const {
    state: { currentTrack, currentTime, duration },
    seekTo,
  } = usePlayer();

  const disabled = !currentTrack || duration <= 0;

  return (
    <section className="space-y-2">
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={Math.min(currentTime, duration || 0)}
        disabled={disabled}
        onChange={(event) => seekTo(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Playback progress"
      />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </section>
  );
}
