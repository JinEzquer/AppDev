/** Build ISO datetime for API from YYYY-MM-DD and HH:MM (24h). */
export function buildDeliveryScheduledAt(dateStr: string, timeStr: string): string | null {
  const date = dateStr.trim();
  const time = timeStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) {
    return null;
  }
  const [h, m] = time.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  const padded = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const iso = new Date(`${date}T${padded}:00`);
  if (Number.isNaN(iso.getTime())) {
    return null;
  }
  return iso.toISOString();
}

export function defaultDeliveryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function formatDeliveryWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
