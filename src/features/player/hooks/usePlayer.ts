import { usePlayerContext } from "../../../app/providers/PlayerProvider";

export function usePlayer() {
  return usePlayerContext();
}
