import { useEffect } from "react";
import { PlayerProvider } from "./app/providers/PlayerProvider";
import { FileLoader } from "./features/player/components/FileLoader";
import { PlayerControls } from "./features/player/components/PlayerControls";
import { Playlist } from "./features/player/components/Playlist";
import { ProgressBar } from "./features/player/components/ProgressBar";
import { TrackInfo } from "./features/player/components/TrackInfo";
import { usePlayer } from "./features/player/hooks/usePlayer";

function AppContent() {
  const { state, togglePlayPause, seekTo } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if the file input is focused
      if (document.activeElement?.getAttribute("type") === "file") {
        return;
      }

      if (event.code === "Space") {
        // Prevent page scroll
        event.preventDefault();
        togglePlayPause();
      } else if (event.code === "ArrowLeft") {
        if (!state.currentTrack) return;
        event.preventDefault();
        const newTime = Math.max(0, state.currentTime - 5);
        seekTo(newTime);
      } else if (event.code === "ArrowRight") {
        if (!state.currentTrack) return;
        event.preventDefault();
        const newTime = Math.min(state.duration, state.currentTime + 5);
        seekTo(newTime);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, seekTo, state]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full min-h-screen max-w-6xl flex-col gap-6 p-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-purple-300">
            Tunafy
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Local MP3 Player
          </h1>
          <p className="text-sm text-slate-400">
            Build a playlist from local MP3s, then play, pause, seek, and jump
            between tracks.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <FileLoader />
            <TrackInfo />
            <ProgressBar />
            <PlayerControls />
          </div>

          <aside>
            <Playlist />
          </aside>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;
