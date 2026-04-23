# Tunafy Project Plan (MVP)

## Project Overview

Build **Tunafy**, an spotify-inspired music player web app that feels playful while staying modern under the hood.

This first phase focuses on a lightweight MVP:

- Tauri desktop application
- React app powered by Vite
- Tailwind CSS for styling
- Load and play individual MP3 files
- No playlist management yet
- Architecture designed so playlists can be added later without rewrites
- Central playback events (especially current playback time updates) so multiple UI parts can stay in sync

---

## Goals for This Phase

1. Create a clean, maintainable React codebase with clear separation between UI and audio logic.
2. Implement reliable MP3 playback (play, pause, seek, and basic track metadata display).
3. Expose playback state/events in a reusable way so future features (playlist, queue, visualizer, analytics) can plug in easily.
4. Establish visual language for an spotify-inspired interface using Tailwind (colors, typography, spacing, pixel-ish styling).

---

## Non-Goals (MVP)

- User authentication
- Backend/database
- Real streaming service integration
- Playlist CRUD or queue management
- Social features (likes/follows/sharing)
- Full mobile app (tauri responsive only for now)

---

## Tech Stack

- **Frontend:** Tauri + React + Vite
- **Styling:** Tailwind CSS
- **State/Events:** React Context + reducer (or lightweight event bus abstraction)
- **Audio Engine:** HTML5 Audio API wrapped in a service/controller layer
- **Optional utility packages (only if needed):**
  - `ionicons` (or equivalent) for control icons

---

## MVP Functional Requirements

### 1) Track Loading

- User can select/load a single MP3 file from local input.
- App stores selected track metadata in app state:
  - `id` (generated)
  - `title` (fallback to filename)
  - `src` (object URL)
  - `duration` (once metadata loads)

### 2) Playback Controls

- Play/Pause toggle
- Seek bar (scrub to a time position)
- Display:
  - current time
  - duration
  - play/pause status

### 3) Playback Time Events (important for extensibility)

- Audio subsystem emits regular playback updates (ex: 4-10 times per second).
- Event payload should include:
  - `currentTime`
  - `duration`
  - `progress` (0-1)
  - `isPlaying`
- UI components subscribe through a shared state layer (not directly to raw audio element).
- This enables future sync features (global progress bar, mini player, waveform, etc.).

### 4) Spotify-Inspired Visual Direction

- Dark retro base palette with purple accents.
- Keep accessibility baseline:
  - contrast-aware color choices
  - keyboard-focus states on controls

---

## Recommended Architecture

### Core Idea

Use an **Audio Controller Layer** between React UI and the native audio element.

This avoids tightly coupling components to browser APIs and makes future upgrades easier.

### Suggested Structure

```txt
src/
  app/
    App.tsx
    providers/
      PlayerProvider.tsx
  features/
    player/
      components/
        PlayerControls.tsx
        ProgressBar.tsx
        TrackInfo.tsx
        FileLoader.tsx
      hooks/
        usePlayer.ts
      types.ts
  core/
    audio/
      AudioController.ts
      audioEvents.ts
  shared/
    utils/
      formatTime.ts
```

### Responsibilities

- `AudioController`:
  - owns `HTMLAudioElement`
  - exposes commands: `loadTrack`, `play`, `pause`, `seek`, `destroy`
  - publishes normalized playback state updates
- `PlayerProvider`:
  - creates controller instance
  - stores player state in reducer/context
  - maps controller events -> React state updates
- UI components:
  - stateless/presentational where possible
  - dispatch actions through hooks

---

## Data Model (Initial)

```ts
type Track = {
  id: string;
  title: string;
  src: string;
  duration?: number;
  artist?: string;
};

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 1
  volume: number;   // optional MVP stretch
  error?: any;
};
```

---

## Event Contract (Initial Draft)

Standardize internal event names now so future features can hook in.

- `player:track_loaded`
- `player:playback_started`
- `player:playback_paused`
- `player:time_update`
- `player:seeked`
- `player:ended`
- `player:error`

`player:time_update` payload:

```ts
{
  currentTime: number;
  duration: number;
  progress: number;
  isPlaying: boolean;
}
```

---

## Milestones

### Milestone 1 - Project Setup

- Use existing Tauri + Vite + React app
- Install/configure Tailwind
- Set up base layout and retro theme tokens
- Create folder structure + provider skeleton

### Milestone 2 - Audio Core

- Implement `AudioController`
- Handle loading MP3 from file input
- Wire metadata + duration loading
- Implement play/pause/seek commands

### Milestone 3 - UI Integration

- Build controls, progress bar, and track info display
- Subscribe UI to shared playback state
- Emit and handle `time_update` events for synced UI refresh

### Milestone 4 - MVP Polish

- Add empty/loading/error states
- Improve keyboard and focus behavior
- Basic responsive behavior
- Final pass on Spotify visual consistency

---

## Future-Ready Extensions (Post-MVP)

- Playlist support (`Track[]` + current index + next/prev)
- Queue and autoplay behavior
- Persist recent tracks in local storage
- Visualizer and beat-reactive UI elements
- Remote source loading (signed URLs / cloud storage)

Because the controller/provider/event boundary is established now, these can be added with limited UI rewrites.

---

## AI Scaffolding Prompt Seed (Copy/Paste Starter)

Use this as an initial instruction block when asking AI to scaffold code:

> Build a Tauri + Vite + React + Tailwind app called Tunafy (Spotify-inspired style).  
> Implement an MVP single-track MP3 player using a dedicated AudioController abstraction (wrap HTMLAudioElement).  
> Include components for FileLoader, TrackInfo, PlayerControls, and ProgressBar.  
> Use a PlayerProvider (Context + reducer) to hold global playback state and receive events from the AudioController.  
> Emit standardized events including `player:time_update` with `{ currentTime, duration, progress, isPlaying }` so multiple components can stay synchronized.  
> No playlist features yet, but keep architecture ready for future playlist/queue support.

---

## Definition of Done (MVP)

- App boots with Tauri + Vite + Tailwind and spotify-inspired base styling
- User can load an MP3 and see track title + duration
- Play/pause and seek work reliably
- Progress UI updates continuously from centralized playback events
- Code structure clearly separates audio engine logic from UI
- Architecture can be extended to playlists without major refactor
