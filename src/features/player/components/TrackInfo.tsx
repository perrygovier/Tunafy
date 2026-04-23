import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "../../../shared/utils/formatTime";

export function TrackInfo() {
  const {
    state: { currentTrack, duration, error },
  } = usePlayer();

  if (error) {
    return (
      <section className="rounded-lg border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
        {error}
      </section>
    );
  }

  if (!currentTrack) {
    return (
      <section className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
        No track loaded yet. Choose an MP3 file to start.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Now playing</p>
      <h2 className="mt-1 text-xl font-semibold text-white">{currentTrack.title}</h2>
      <p className="mt-2 text-sm text-slate-400">Duration: {formatTime(duration)}</p>
    </section>
  );
}
