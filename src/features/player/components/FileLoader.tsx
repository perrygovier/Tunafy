import { useId, type ChangeEvent } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function FileLoader() {
  const inputId = useId();
  const {
    state: { isLoadingTrack },
    loadFile,
  } = usePlayer();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await loadFile(file);
    event.target.value = "";
  };

  return (
    <section className="space-y-3">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        Load an MP3
      </label>
      <input
        id={inputId}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={onFileChange}
        className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition hover:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      />
      {isLoadingTrack ? (
        <p className="text-xs text-purple-300">Loading selected track...</p>
      ) : null}
    </section>
  );
}
