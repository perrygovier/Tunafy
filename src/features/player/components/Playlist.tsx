import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "../../../shared/utils/formatTime";

export function Playlist() {
  const {
    state: { queue, currentIndex, isPlaying },
    playTrackAt,
    removeTrack,
    clearQueue,
  } = usePlayer();

  if (queue.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
        Your playlist is empty. Add some MP3s to get started.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/60">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Playlist
          </p>
          <p className="text-sm text-slate-300">
            {queue.length} track{queue.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={clearQueue}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-rose-400 hover:text-rose-200"
        >
          Clear
        </button>
      </header>

      <ol className="divide-y divide-slate-800">
        {queue.map((track, index) => {
          const isActive = index === currentIndex;

          return (
            <li
              key={track.id}
              className={`flex items-center gap-3 px-4 py-3 transition ${
                isActive ? "bg-purple-500/10" : "hover:bg-slate-900/60"
              }`}
            >
              <button
                type="button"
                onClick={() => void playTrackAt(index)}
                className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-md"
                aria-label={`Play ${track.title}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                    isActive
                      ? "bg-purple-500 text-white"
                      : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {isActive && isPlaying ? (
                    <PlayingIndicator />
                  ) : (
                    index + 1
                  )}
                </span>

                {track.imgUrl ? (
                  <img
                    src={track.imgUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded bg-slate-800" />
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      isActive ? "font-semibold text-white" : "text-slate-200"
                    }`}
                  >
                    {track.title}
                  </p>
                  {track.artist ? (
                    <p className="truncate text-xs text-slate-400">
                      {track.artist}
                    </p>
                  ) : null}
                </div>

                {track.duration ? (
                  <span className="ml-2 shrink-0 text-xs text-slate-400">
                    {formatTime(track.duration)}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => removeTrack(track.id)}
                className="rounded-md p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                aria-label={`Remove ${track.title} from playlist`}
                title="Remove from playlist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PlayingIndicator() {
  // Simple three-bar equalizer made out of plain divs + Tailwind animations.
  return (
    <span
      className="flex h-3 items-end gap-0.5"
      aria-hidden="true"
    >
      <span className="block w-0.5 animate-pulse bg-white" style={{ height: "60%" }} />
      <span className="block w-0.5 animate-pulse bg-white" style={{ height: "100%", animationDelay: "120ms" }} />
      <span className="block w-0.5 animate-pulse bg-white" style={{ height: "40%", animationDelay: "240ms" }} />
    </span>
  );
}
