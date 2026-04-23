export function formatTime(rawSeconds: number) {
  if (!Number.isFinite(rawSeconds) || rawSeconds < 0) {
    return "0:00";
  }

  const seconds = Math.floor(rawSeconds);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
