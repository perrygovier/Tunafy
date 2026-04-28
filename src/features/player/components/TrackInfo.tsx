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

  const trackImgStyles = {
    width: 100,
    height: 100,
    outline: "1px solid black",
    background: "gray",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Now playing</p>
      <div style={trackImgStyles}>
        {currentTrack.imgUrl ? (<img src={currentTrack.imgUrl} alt={`Image for ${currentTrack.title}`}/>) : (<p>no image</p>)}
      </div>
      <h2 className="mt-1 text-xl font-semibold text-white">{currentTrack.title}</h2>
      <p className="mt-2 text-sm text-slate-400">Duration: {formatTime(duration)}</p>
    </section>
  );
}
