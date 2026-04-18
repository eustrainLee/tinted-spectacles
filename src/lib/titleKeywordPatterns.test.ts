import { describe, expect, it } from 'vitest'
import {
  BILIBILI_TITLE_KEYWORD_MAX_PATTERNS,
  BILIBILI_TITLE_KEYWORD_PATTERN_MAX_CHARS,
  compileTitleKeywordRegexes,
  sanitizeTitleKeywordPatterns,
  titleMatchesAnyKeyword,
} from './titleKeywordPatterns'

describe('sanitizeTitleKeywordPatterns', () => {
  it('drops non-strings and empty trims', () => {
    expect(
      sanitizeTitleKeywordPatterns(['  a  ', '', '  ', 1, null, 'b']),
    ).toEqual(['a', 'b'])
  })

  it('caps pattern count', () => {
    const arr = Array.from({ length: BILIBILI_TITLE_KEYWORD_MAX_PATTERNS + 5 }, (_, i) =>
      String(i),
    )
    expect(sanitizeTitleKeywordPatterns(arr).length).toBe(
      BILIBILI_TITLE_KEYWORD_MAX_PATTERNS,
    )
  })

  it('caps single pattern length', () => {
    const long = 'x'.repeat(BILIBILI_TITLE_KEYWORD_PATTERN_MAX_CHARS + 40)
    expect(sanitizeTitleKeywordPatterns([long])[0].length).toBe(
      BILIBILI_TITLE_KEYWORD_PATTERN_MAX_CHARS,
    )
  })
})

describe('compileTitleKeywordRegexes', () => {
  it('skips invalid regex sources', () => {
    const res = compileTitleKeywordRegexes(['valid', '(unclosed', 'also'])
    expect(res.length).toBe(2)
    expect(res[0].test('VALID sub')).toBe(true)
    expect(res[1].test('also')).toBe(true)
  })
})

describe('titleMatchesAnyKeyword', () => {
  it('matches if any regex matches', () => {
    const res = compileTitleKeywordRegexes(['foo', 'bar'])
    expect(titleMatchesAnyKeyword('hello FoO world', res)).toBe(true)
    expect(titleMatchesAnyKeyword('baz', res)).toBe(false)
  })
})
