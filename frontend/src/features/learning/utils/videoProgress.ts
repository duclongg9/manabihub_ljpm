const VIDEO_COMPLETION_WATCH_RATIO = 0.95;

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
