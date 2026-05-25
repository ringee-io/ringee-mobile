// Lightweight, locale-agnostic formatters. No moment/date-fns: we keep the
// bundle small and ship native-feeling text.

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDayLabel(value: string | Date | null | undefined) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7)
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLong(value: string | Date | null | undefined) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeFromNow(value: string | Date | null | undefined) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';

  const diffMs = d.getTime() - Date.now();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);

  let body: string;
  if (minutes < 1) body = 'just now';
  else if (minutes < 60) body = `${minutes}m`;
  else if (hours < 24) body = `${hours}h`;
  else if (days < 7) body = `${days}d`;
  else return formatDayLabel(d);

  if (body === 'just now') return body;
  return past ? `${body} ago` : `in ${body}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 1) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 1) return `${s}s`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPhone(value: string | null | undefined) {
  if (!value) return '';
  return value.trim();
}

export function initialsFor(name?: string | null, fallback?: string | null) {
  const source = (name || fallback || '').trim();
  if (!source) return '·';
  const parts = source.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase();
}
