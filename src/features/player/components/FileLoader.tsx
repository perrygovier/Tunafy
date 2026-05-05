import { useId, type ChangeEvent } from "react";
import { usePlayer } from "../hooks/usePlayer";

export function FileLoader() {
  const inputId = useId();
  const {
    state: { isLoadingTrack },
    addFiles,
  } = usePlayer();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    await addFiles(Array.from(files));
    event.target.value = "";
  };

  return (
    <section className="space-y-3">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
        Add MP3s to your playlist
      </label>
      <input
        id={inputId}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        onChange={onFileChange}
        className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 transition hover:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      />
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
