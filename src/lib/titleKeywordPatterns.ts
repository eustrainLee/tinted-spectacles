/**
 * Bilibili title keyword block: user-entered lines compiled as RegExp (plain
 * words match as substrings). Invalid patterns are skipped at compile time.
 */

/** Max UTF-16 code units per stored pattern string. */
export const BILIBILI_TITLE_KEYWORD_PATTERN_MAX_CHARS = 256

/** Max number of patterns per site. */
export const BILIBILI_TITLE_KEYWORD_MAX_PATTERNS = 64

export function sanitizeTitleKeywordPatterns(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') {
      continue
    }
    const t = item.trim().slice(0, BILIBILI_TITLE_KEYWORD_PATTERN_MAX_CHARS)
    if (!t) {
      continue
    }
    out.push(t)
    if (out.length >= BILIBILI_TITLE_KEYWORD_MAX_PATTERNS) {
      break
    }
  }
  return out
}

/**
 * Build regex list; invalid sources are omitted (no throw).
 * Uses `iu` so ASCII letters are case-insensitive; Chinese literals work as-is.
 */
export function compileTitleKeywordRegexes(patterns: string[]): RegExp[] {
  const list: RegExp[] = []
  for (const p of patterns) {
    if (!p) {
      continue
    }
    try {
      list.push(new RegExp(p, 'iu'))
    } catch {
      /* skip invalid */
    }
  }
  return list
}

export function titleMatchesAnyKeyword(
  title: string,
  regexes: RegExp[],
): boolean {
  if (!title || regexes.length === 0) {
    return false
  }
  for (const re of regexes) {
    if (re.test(title)) {
      return true
    }
  }
  return false
}
