import { PlayerProvider } from "./app/providers/PlayerProvider";
import { FileLoader } from "./features/player/components/FileLoader";
import { PlayerControls } from "./features/player/components/PlayerControls";
import { ProgressBar } from "./features/player/components/ProgressBar";
import { TrackInfo } from "./features/player/components/TrackInfo";

function App() {
  return (
    <PlayerProvider>
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex w-full min-h-screen flex-col gap-6 rounded-2xl p-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-purple-300">
              Tunafy MVP
            </p>
            <h1 className="text-3xl font-semibold text-white">
              Local MP3 Player
            </h1>
            <p className="text-sm text-slate-400">
              Load a single track, then play, pause, and seek with synchronized
              playback events.
            </p>
          </header>

          <FileLoader />
          <TrackInfo />
          <ProgressBar />
          <PlayerControls />
        </div>
      </main>
    </PlayerProvider>
  );
}

export default App;
