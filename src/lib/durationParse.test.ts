import { describe, expect, it } from 'vitest'
import {
  durationOutsideBounds,
  parseDurationBounds,
  parseTypedDurationToSeconds,
} from './durationParse'

describe('parseTypedDurationToSeconds', () => {
  it('parses MM:SS', () => {
    expect(parseTypedDurationToSeconds('6:00')).toBe(360)
    expect(parseTypedDurationToSeconds(' 15:00 ')).toBe(900)
    expect(parseTypedDurationToSeconds('30:00')).toBe(1800)
  })

  it('parses H:MM:SS', () => {
    expect(parseTypedDurationToSeconds('1:00:00')).toBe(3600)
    expect(parseTypedDurationToSeconds('1:05:09')).toBe(3909)
  })

  it('rejects invalid', () => {
    expect(parseTypedDurationToSeconds('')).toBeNull()
    expect(parseTypedDurationToSeconds('6')).toBeNull()
    expect(parseTypedDurationToSeconds('6:60')).toBeNull()
    expect(parseTypedDurationToSeconds('1:99:00')).toBeNull()
  })
})

describe('parseDurationBounds', () => {
  it('swaps when min > max', () => {
    const r = parseDurationBounds('15:00', '6:00')
    expect(r.minSec).toBe(360)
    expect(r.maxSec).toBe(900)
  })

  it('allows open min or max', () => {
    expect(parseDurationBounds('', '5:00')).toEqual({
      minSec: undefined,
      maxSec: 300,
    })
    expect(parseDurationBounds('30:00', '')).toEqual({
      minSec: 1800,
      maxSec: undefined,
    })
  })
})

describe('durationOutsideBounds', () => {
  it('respects inclusive edges', () => {
    expect(durationOutsideBounds(360, 360, 900)).toBe(false)
    expect(durationOutsideBounds(900, 360, 900)).toBe(false)
    expect(durationOutsideBounds(359, 360, 900)).toBe(true)
    expect(durationOutsideBounds(901, 360, 900)).toBe(true)
  })
})
