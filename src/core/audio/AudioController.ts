import { PLAYER_EVENTS, type PlaybackTimePayload } from "./audioEvents";
import type { Track } from "../../features/player/types";

const TIME_UPDATE_INTERVAL_MS = 125;

export class AudioController {
  private audio = new Audio();
  private eventTarget = new EventTarget();
  private activeObjectUrl: string | null = null;
  private ticker: number | null = null;

  constructor() {
    this.audio.preload = "metadata";
    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("seeked", this.handleSeeked);
    this.audio.addEventListener("error", this.handleError);
  }

  async loadTrack(file: File): Promise<Track> {
    this.stopTicker();
    this.audio.pause();

    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
    }

    const src = URL.createObjectURL(file);
    this.activeObjectUrl = src;
    this.audio.src = src;
    this.audio.currentTime = 0;

    const duration = await this.waitForMetadata();

    const track: Track = {
      id: crypto.randomUUID(),
      title: this.getTitleFromFile(file),
      src,
      duration,
    };

    this.emit(PLAYER_EVENTS.TRACK_LOADED, track);
    this.emitTimeUpdate(false);

    return track;
  }

  async play() {
    try {
      await this.audio.play();
      this.emit(PLAYER_EVENTS.PLAYBACK_STARTED, null);
      this.startTicker();
      this.emitTimeUpdate(true);
    } catch (error) {
      this.emit(PLAYER_EVENTS.ERROR, this.errorMessage(error));
    }
  }

  pause() {
    this.audio.pause();
    this.stopTicker();
    this.emit(PLAYER_EVENTS.PLAYBACK_PAUSED, null);
    this.emitTimeUpdate(false);
  }

  seek(time: number) {
    if (!Number.isFinite(this.audio.duration) || this.audio.duration <= 0) {
      return;
    }

    const clamped = Math.max(0, Math.min(time, this.audio.duration));
    this.audio.currentTime = clamped;
    this.emit(PLAYER_EVENTS.SEEKED, clamped);
    this.emitTimeUpdate(!this.audio.paused);
  }

  subscribe<T>(eventName: string, handler: (payload: T) => void) {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      handler(customEvent.detail);
    };

    this.eventTarget.addEventListener(eventName, listener);
    return () => this.eventTarget.removeEventListener(eventName, listener);
  }

  destroy() {
    this.stopTicker();
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio.removeEventListener("ended", this.handleEnded);
    this.audio.removeEventListener("seeked", this.handleSeeked);
    this.audio.removeEventListener("error", this.handleError);

    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
  }

  private handleEnded = () => {
    this.stopTicker();
    this.emit(PLAYER_EVENTS.ENDED, null);
    this.emitTimeUpdate(false);
  };

  private handleSeeked = () => {
    this.emit(PLAYER_EVENTS.SEEKED, this.audio.currentTime);
  };

  private handleError = () => {
    const mediaError = this.audio.error;
    const message = mediaError?.message ?? "Audio playback error";
    this.emit(PLAYER_EVENTS.ERROR, message);
  };

  private waitForMetadata() {
    return new Promise<number>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve(Number.isFinite(this.audio.duration) ? this.audio.duration : 0);
      };

      const onError = () => {
        cleanup();
        reject(new Error("Unable to load track metadata"));
      };

      const cleanup = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
      };

      this.audio.addEventListener("loadedmetadata", onLoaded, { once: true });
      this.audio.addEventListener("error", onError, { once: true });
      this.audio.load();
    });
  }

  private emitTimeUpdate(isPlaying: boolean) {
    const duration =
      Number.isFinite(this.audio.duration) && this.audio.duration > 0
        ? this.audio.duration
        : 0;
    const currentTime =
      Number.isFinite(this.audio.currentTime) && this.audio.currentTime > 0
        ? this.audio.currentTime
        : 0;
    const payload: PlaybackTimePayload = {
      currentTime,
      duration,
      progress: duration > 0 ? Math.min(currentTime / duration, 1) : 0,
      isPlaying,
    };

    this.emit(PLAYER_EVENTS.TIME_UPDATE, payload);
  }

  private startTicker() {
    if (this.ticker !== null) {
      return;
    }

    this.ticker = window.setInterval(() => {
      this.emitTimeUpdate(!this.audio.paused);
    }, TIME_UPDATE_INTERVAL_MS);
  }

  private stopTicker() {
    if (this.ticker === null) {
      return;
    }

    window.clearInterval(this.ticker);
    this.ticker = null;
  }

  private emit<T>(eventName: string, payload: T) {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  }

  private getTitleFromFile(file: File) {
    return file.name.replace(/\.[^/.]+$/, "");
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown playback error";
  }
}
