import { useId, useRef, type ChangeEvent } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function FileLoader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    state: { currentTrack, isLoadingTrack },
    loadFile,
  } = usePlayer();

  const buttonText = currentTrack ? "Load a new MP3" : "Load an MP3";

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await loadFile(file);
    event.target.value = "";
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <section className="space-y-3">
      <label htmlFor={inputId} className="sr-only">
        Choose an MP3 file to load
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={onFileChange}
        tabIndex={-1}
        className="sr-only"
      />
      <button
        type="button"
        onClick={openFilePicker}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-purple-400 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      >
        {buttonText}
      </button>
      {isLoadingTrack ? (
        <p className="text-xs text-purple-300">Loading selected track...</p>
      ) : null}
    </section>
  );
}
