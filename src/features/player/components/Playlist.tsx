import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { formatTime } from "../../../shared/utils/formatTime";

const scrollingTitleStyles = `
  @keyframes scroll-left {
    0% {
      transform: translateX(0);
    }
    10% {
      transform: translateX(0);
    }
    65% {
      transform: translateX(calc(-100% + 2rem));
    }
    90% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(0);
    }
  }

  .scrolling-title {
    animation: scroll-left 5s ease-in-out infinite;
    white-space: nowrap;
  }

  .returning-title {
    white-space: nowrap;
  }
`;

export function Playlist() {
  const {
    state: { queue, currentIndex, isPlaying },
    playTrackAt,
    removeTrack,
    clearQueue,
  } = usePlayer();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [returningIndex, setReturningIndex] = useState<number | null>(null);
  const [returningStyles, setReturningStyles] = useState<Record<number, React.CSSProperties>>({});
  const titleRefs = useRef<Record<number, HTMLParagraphElement | null>>({});
  const returnTimerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (returnTimerRef.current !== null) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }

    if (returningIndex !== null) {
      frameRef.current = window.requestAnimationFrame(() => {
        setReturningStyles((prev) => ({
          ...prev,
          [returningIndex]: {
            ...prev[returningIndex],
            transform: "translateX(0)",
          },
        }));
      });

      returnTimerRef.current = window.setTimeout(() => {
        setReturningIndex((current) => (current === returningIndex ? null : current));
        setReturningStyles((prev) => {
          const next = { ...prev };
          delete next[returningIndex];
          return next;
        });
      }, 400);
    }

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      if (returnTimerRef.current !== null) {
        window.clearTimeout(returnTimerRef.current);
      }
    };
  }, [returningIndex]);

  if (queue.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-400">
        Your playlist is empty. Add some MP3s to get started.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/60">
      <style>{scrollingTitleStyles}</style>
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
          className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:cursor-pointer hover:border-rose-400 hover:text-rose-200"
        >
          Clear
        </button>
      </header>

      <ol className="divide-y divide-slate-800">
        {queue.map((track, index) => {
          const isActive = index === currentIndex;
          const isHovered = index === hoveredIndex;
          const isReturning = index === returningIndex;
          const shouldScroll = isActive || isHovered;

          const handleMouseLeave = () => {
            setHoveredIndex(null);
            if (isActive) {
              return;
            }

            const titleEl = titleRefs.current[index];
            if (!titleEl) {
              setReturningIndex(index);
              return;
            }

            const computed = window.getComputedStyle(titleEl);
            const transform = computed.transform;
            let translateX = 0;

            if (transform && transform !== "none") {
              const matrix2d = transform.match(/matrix\(([^)]+)\)/);
              const matrix3d = transform.match(/matrix3d\(([^)]+)\)/);
              if (matrix2d && matrix2d[1]) {
                const parts = matrix2d[1].split(",").map((part) => parseFloat(part.trim()));
                if (parts.length === 6) {
                  translateX = parts[4];
                }
              } else if (matrix3d && matrix3d[1]) {
                const parts = matrix3d[1].split(",").map((part) => parseFloat(part.trim()));
                if (parts.length === 16) {
                  translateX = parts[12];
                }
              }
            }

            setReturningStyles((prev) => ({
              ...prev,
              [index]: {
                transform: `translateX(${translateX}px)`,
                transition: "transform 0.35s ease-out",
                willChange: "transform",
                whiteSpace: "nowrap",
              },
            }));
            setReturningIndex(index);
          };

          return (
            <li
              key={track.id}
              className={`flex items-center gap-3 px-4 py-3 transition hover:cursor-pointer ${
                isActive ? "bg-purple-500/10" : "hover:bg-slate-900/60"
              }`}
              onClick={() => void playTrackAt(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => void playTrackAt(index)}
                className="cursor-pointer flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-md"
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
                  <div className="overflow-hidden">
                    <p
                      ref={(element) => {
                        titleRefs.current[index] = element;
                      }}
                      className={`text-sm ${
                        isActive ? "font-semibold text-white" : "text-slate-200"
                      } ${
                        isReturning
                          ? "returning-title"
                          : shouldScroll
                            ? "scrolling-title"
                            : "truncate"
                      }`}
                      style={returningStyles[index]}
                    >
                      {track.title}
                    </p>
                  </div>
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
                className="ml-auto shrink-0 rounded-md border border-rose-500/30 p-2 text-slate-400 transition hover:cursor-pointer hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                aria-label={`Remove ${track.title} from playlist`}
                title="Remove from playlist"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
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
