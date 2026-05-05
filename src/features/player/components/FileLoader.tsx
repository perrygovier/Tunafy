import { useId, useRef, type ChangeEvent } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function FileLoader() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    state: { currentTrack, isLoadingTrack },
    addFiles,
  } = usePlayer();

  const buttonText = currentTrack ? "Add more MP3s" : "Add MP3s to your playlist";

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    await addFiles(Array.from(files));
    event.target.value = "";
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  return (
    <section className="space-y-3">
      <label htmlFor={inputId} className="sr-only">
        Choose MP3 files to add to your playlist
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
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
        <p className="text-xs text-purple-300">Reading metadata...</p>
      ) : (
        <p className="text-xs text-slate-500">
          Tip: Hold Cmd/Ctrl or Shift in the file picker to select multiple
          tracks at once.
        </p>
      )}
    </section>
  );
}
