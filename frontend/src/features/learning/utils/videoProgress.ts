const VIDEO_COMPLETION_WATCH_RATIO = 0.95;

export interface VideoProgressCheckpoint {
  positionSeconds: number;
  watchedSeconds: number;
  mediaDurationSeconds?: number;
  savedAt: number;
}

export function formatVideoTime(seconds: number): string {
  const normalized = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const remainingSeconds = normalized % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function resolveVideoResumePosition(
  serverPositionSeconds: number | undefined,
  checkpoint: VideoProgressCheckpoint | null,
  mediaDurationSeconds?: number,
): number {
  const serverPosition = normalizeSeconds(serverPositionSeconds);
  const checkpointPosition = normalizeSeconds(checkpoint?.positionSeconds);
  const position = Math.max(serverPosition, checkpointPosition);
  const duration = normalizeSeconds(mediaDurationSeconds);

  return duration > 0 ? Math.min(position, Math.max(0, duration - 1)) : position;
}

function normalizeSeconds(value: number | undefined): number {
  return Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : 0;
}

export function normalizeWatchedSecondsAtVideoEnd(
  watchedSeconds: number,
  mediaDurationSeconds: number,
): number {
  if (!Number.isFinite(mediaDurationSeconds) || mediaDurationSeconds <= 0) {
    return watchedSeconds;
  }

  const normalizedDuration = Math.floor(mediaDurationSeconds);
  const completionThreshold = Math.floor(normalizedDuration * VIDEO_COMPLETION_WATCH_RATIO);
  return watchedSeconds >= completionThreshold
    ? Math.max(watchedSeconds, normalizedDuration)
    : watchedSeconds;
}
