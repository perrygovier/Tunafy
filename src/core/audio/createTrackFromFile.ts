import { parseBlob } from "music-metadata";
import { trackDB } from "../storage/indexedDB";
import type { Track } from "../../features/player/types";

async function computeHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createTrackFromFile(file: File): Promise<Track> {
  const hash = await computeHash(file);
  const existing = await trackDB.get(hash);
  if (existing) {
    // Duplicate found, return existing track with new src
    const src = URL.createObjectURL(existing.file);
    return { ...existing.metadata, src };
  }

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

  const track: Track = {
    id: crypto.randomUUID(),
    title,
    src,
    artist,
    duration,
    imgUrl,
  };

  // Store in IndexedDB
  await trackDB.put({
    hash,
    file: new Blob([file]),
    metadata: { ...track, src: undefined } as Omit<Track, 'src'>,
  });

  return track;
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
