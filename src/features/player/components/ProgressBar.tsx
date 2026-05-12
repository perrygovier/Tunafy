import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "../../../shared/utils/formatTime";

export function ProgressBar() {
  const {
    state: { currentTrack, currentTime, duration },
    seekTo,
  } = usePlayer();

  const disabled = !currentTrack || duration <= 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    seekTo(Math.max(0, Math.min(duration, newTime)));
  };

  return (
    <section className="space-y-2">
      <div
        className={`relative h-2 w-full rounded-lg cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : 'bg-slate-700'}`}
        onClick={handleSeek}
        role="slider"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            seekTo(Math.max(0, currentTime - 5));
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            seekTo(Math.min(duration, currentTime + 5));
          }
        }}
      >
        <div
          className="absolute top-0 left-0 h-full bg-purple-500 rounded-lg"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </section>
  );
}
