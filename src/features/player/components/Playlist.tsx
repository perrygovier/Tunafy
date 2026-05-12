import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { flushSync } from "react-dom";
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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

// Wraps a state mutation in the View Transitions API so reordering rows
// animates between their old and new positions. Falls back to a plain
// synchronous update on browsers that don't support it (and when the user
// has requested reduced motion).
function withViewTransition(mutate: () => void) {
  const supportsTransitions =
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function";

  if (!supportsTransitions || prefersReducedMotion()) {
    mutate();
    return;
  }

  document.startViewTransition(() => {
    flushSync(mutate);
  });
}

export function Playlist() {
  const {
    state: { queue, currentIndex, isPlaying },
    playTrackAt,
    removeTrack,
    reorderTracks,
    clearQueue,
  } = usePlayer();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [returningIndex, setReturningIndex] = useState<number | null>(null);
  const [returningStyles, setReturningStyles] = useState<Record<number, CSSProperties>>({});
  const titleRefs = useRef<Record<number, HTMLParagraphElement | null>>({});
  const returnTimerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const resetDrag = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragStart =
    (index: number) => (event: DragEvent<HTMLSpanElement>) => {
      setDraggingIndex(index);
      event.dataTransfer.effectAllowed = "move";
      // Firefox refuses to start a drag without data being set.
      event.dataTransfer.setData("text/plain", String(index));
    };

  const handleDragOver =
    (index: number) => (event: DragEvent<HTMLLIElement>) => {
      if (draggingIndex === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    };

  const handleDrop =
    (index: number) => (event: DragEvent<HTMLLIElement>) => {
      event.preventDefault();

      if (draggingIndex === null || draggingIndex === index) {
        resetDrag();
        return;
      }

      const fromIdx = draggingIndex;
      withViewTransition(() => {
        reorderTracks(fromIdx, index);
        resetDrag();
      });
    };

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

      <ol
        className="divide-y divide-slate-800"
        onDragEnd={resetDrag}
        onDragLeave={(event) => {
          // Only reset when leaving the list entirely.
          if (
            event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            return;
          }
          setDragOverIndex(null);
        }}
      >
        {queue.map((track, index) => {
          const isActive = index === currentIndex;
          const isHovered = index === hoveredIndex;
          const isReturning = index === returningIndex;
          const shouldScroll = isActive || isHovered;
          const isDragging = draggingIndex === index;
          const isDropTarget =
            draggingIndex !== null &&
            dragOverIndex === index &&
            draggingIndex !== index;
          // Show the drop indicator on the side the dragged item is coming from.
          const indicatorAbove =
            isDropTarget && draggingIndex !== null && draggingIndex > index;
          const indicatorBelow =
            isDropTarget && draggingIndex !== null && draggingIndex < index;

          // Unique view-transition-name per row so the browser can match each
          // <li> to its old/new position and morph between them on reorder.
          const rowStyle: CSSProperties = {
            viewTransitionName: `track-${track.id}`,
          };

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
              style={rowStyle}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={handleMouseLeave}
              className={`relative flex items-center gap-2 px-2 py-3 transition ${
                isActive ? "bg-purple-500/10" : "hover:bg-slate-900/60"
              } ${isDragging ? "opacity-40" : ""}`}
            >
              {indicatorAbove ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-0 h-0.5 rounded-full bg-purple-400"
                />
              ) : null}
              {indicatorBelow ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-purple-400"
                />
              ) : null}

              <span
                role="button"
                tabIndex={0}
                draggable
                onDragStart={handleDragStart(index)}
                onDragEnd={resetDrag}
                aria-label={`Drag to reorder ${track.title}`}
                title="Drag to reorder"
                className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-slate-500 transition hover:text-slate-200 active:cursor-grabbing"
              >
                <DragHandleIcon />
              </span>

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

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="6" cy="4" r="1.2" />
      <circle cx="10" cy="4" r="1.2" />
      <circle cx="6" cy="8" r="1.2" />
      <circle cx="10" cy="8" r="1.2" />
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="10" cy="12" r="1.2" />
    </svg>
  );
}

function PlayingIndicator() {
  return (
    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
      <span
        className="block w-0.5 animate-pulse bg-white"
        style={{ height: "60%" }}
      />
      <span
        className="block w-0.5 animate-pulse bg-white"
        style={{ height: "100%", animationDelay: "120ms" }}
      />
      <span
        className="block w-0.5 animate-pulse bg-white"
        style={{ height: "40%", animationDelay: "240ms" }}
      />
    </span>
  );
}
