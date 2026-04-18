/**
 * Parse user-typed video length like "6:00", "15:00", "1:30:00" into seconds.
 * Two parts = MM:SS (minutes:seconds). Three parts = H:MM:SS.
 */

const TWO_PART_RE = /^(\d{1,3}):(\d{2})$/
const THREE_PART_RE = /^(\d{1,2}):(\d{2}):(\d{2})$/

export function parseTypedDurationToSeconds(raw: string): number | null {
  const t = raw.trim()
  if (!t) {
    return null
  }
  const two = TWO_PART_RE.exec(t)
  if (two) {
    const minutes = Number(two[1])
    const sec = Number(two[2])
    if (!Number.isFinite(minutes) || !Number.isFinite(sec) || sec > 59) {
      return null
    }
    return minutes * 60 + sec
  }
  const three = THREE_PART_RE.exec(t)
  if (three) {
    const h = Number(three[1])
    const m = Number(three[2])
    const sec = Number(three[3])
    if (
      !Number.isFinite(h) ||
      !Number.isFinite(m) ||
      !Number.isFinite(sec) ||
      m > 59 ||
      sec > 59
    ) {
      return null
    }
    return h * 3600 + m * 60 + sec
  }
  return null
}

export function parseDurationBounds(
  minRaw: string,
  maxRaw: string,
): { minSec: number | undefined; maxSec: number | undefined } {
  const minParsed = parseTypedDurationToSeconds(minRaw)
  const maxParsed = parseTypedDurationToSeconds(maxRaw)
  let minSec = minParsed === null ? undefined : minParsed
  let maxSec = maxParsed === null ? undefined : maxParsed
  if (minSec !== undefined && maxSec !== undefined && minSec > maxSec) {
    const swap = minSec
    minSec = maxSec
    maxSec = swap
  }
  return { minSec, maxSec }
}

export function durationOutsideBounds(
  seconds: number,
  minSec: number | undefined,
  maxSec: number | undefined,
): boolean {
  if (minSec !== undefined && seconds < minSec) {
    return true
  }
  if (maxSec !== undefined && seconds > maxSec) {
    return true
  }
  return false
}
