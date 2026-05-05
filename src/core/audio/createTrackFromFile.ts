import { parseBlob } from "music-metadata";
import type { Track } from "../../features/player/types";

export async function createTrackFromFile(file: File): Promise<Track> {
  const src = URL.createObjectURL(file);

  let title = stripExtension(file.name);
  let artist: string | undefined;
  let duration: number | undefined;
  let imgUrl: string | undefined;

  try {
    const metadata = await parseBlob(file);

    if (metadata.common.title) {
      title = metadata.common.title;
    }
    artist = metadata.common.artist;
    duration = metadata.format.duration;

    const picture = metadata.common.picture?.[0];
    if (picture) {
      imgUrl = pictureToDataUrl(picture.data, picture.format);
    }
  } catch (error) {
    console.error("Error parsing metadata for", file.name, error);
  }

  return {
    id: crypto.randomUUID(),
    title,
    src,
    artist,
    duration,
    imgUrl,
  };
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

function pictureToDataUrl(data: Uint8Array, format: string) {
  const binary = Array.from(data)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return `data:${format};base64,${btoa(binary)}`;
}
