import type { ReleaseType } from "@/components/types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * "2027-03-14" → "March 14, 2027".
 * Parsed as a calendar date in UTC so the day never shifts with the server's
 * or the fan's timezone. Non-ISO input is returned untouched rather than
 * throwing: a bad row in Supabase must not take a page down.
 */
export function formatReleaseDate(isoDate: string): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** 245 → "4:05"; 3725 → "1:02:05"; null / negative → "–:––". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "–:––";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
}

const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  single: "Single",
  ep: "EP",
  album: "Album",
};

export function releaseTypeLabel(type: ReleaseType): string {
  return RELEASE_TYPE_LABEL[type];
}

/**
 * Covnant codes are shown as "CBT-XXXX". Yeshua pastes the code by hand, so
 * accept it with or without the prefix and never render "CBT-CBT-".
 */
export function formatCbtCode(code: string): string {
  const bare = code.trim().replace(/^cbt-?/i, "");
  return `CBT-${bare}`;
}
