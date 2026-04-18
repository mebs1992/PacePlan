export function formatClock(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatRelative(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `${hrs}h ago` : `${hrs}h ${rem}m ago`;
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayLabel(ms: number, nowMs: number): string {
  const dayDiff = Math.round((startOfDay(ms) - startOfDay(nowMs)) / 86_400_000);
  if (dayDiff === 0) return 'today';
  if (dayDiff === 1) return 'tomorrow';
  if (dayDiff === -1) return 'yesterday';
  return new Date(ms).toLocaleDateString([], { weekday: 'short' });
}

export function formatClockWithDay(ms: number, nowMs: number): string {
  return `${formatClock(ms)} ${dayLabel(ms, nowMs)}`;
}
