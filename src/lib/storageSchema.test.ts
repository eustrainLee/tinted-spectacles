import { describe, expect, it } from 'vitest'
import { parseSiteSettingsState } from './storageSchema'

describe('parseSiteSettingsState', () => {
  it('parses fabHidden when present', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: true,
        },
      },
    })
    expect(parsed.sites['example.com']?.fabHidden).toBe(true)
  })

  it('parses fabPosition when present', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          fabPosition: { left: 120, top: 340 },
        },
      },
    })
    expect(parsed.sites['example.com']?.fabPosition).toEqual({
      left: 120,
      top: 340,
    })
  })

  it('defaults fabHidden to false when missing', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
        },
      },
    })
    expect(parsed.sites['example.com']?.fabHidden).toBe(false)
  })

  it('parses bilibiliFeedBlockMode when valid', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliFeedBlockMode: 'mark',
        },
      },
    })
    expect(parsed.sites['example.com']?.bilibiliFeedBlockMode).toBe('mark')
  })

  it('parses bilibiliFeedBlockMode off', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliFeedBlockMode: 'off',
        },
      },
    })
    expect(parsed.sites['example.com']?.bilibiliFeedBlockMode).toBe('off')
  })

  it('parses bilibiliDurationBlockMode and bound strings', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliDurationBlockMode: 'remove',
          bilibiliDurationMinStr: '6:00',
          bilibiliDurationMaxStr: '15:00',
        },
      },
    })
    expect(parsed.sites['example.com']?.bilibiliDurationBlockMode).toBe(
      'remove',
    )
    expect(parsed.sites['example.com']?.bilibiliDurationMinStr).toBe('6:00')
    expect(parsed.sites['example.com']?.bilibiliDurationMaxStr).toBe('15:00')
  })

  it('parses bilibiliLikePromoBlockMode when valid', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliLikePromoBlockMode: 'clear',
        },
      },
    })
    expect(parsed.sites['example.com']?.bilibiliLikePromoBlockMode).toBe(
      'clear',
    )
  })

  it('parses bilibiliPartitionRecommendBlockMode when valid', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliPartitionRecommendBlockMode: 'mark',
        },
      },
    })
    expect(
      parsed.sites['example.com']?.bilibiliPartitionRecommendBlockMode,
    ).toBe('mark')
  })

  it('parses bilibiliTitleKeywordBlockMode and patterns array', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliTitleKeywordBlockMode: 'remove',
          bilibiliTitleKeywordPatterns: ['  foo  ', '', 99, 'bar'],
        },
      },
    })
    expect(parsed.sites['example.com']?.bilibiliTitleKeywordBlockMode).toBe(
      'remove',
    )
    expect(parsed.sites['example.com']?.bilibiliTitleKeywordPatterns).toEqual([
      'foo',
      'bar',
    ])
  })

  it('parses bilibiliUploaderKeywordBlockMode and patterns array', () => {
    const parsed = parseSiteSettingsState({
      schemaVersion: 1,
      sites: {
        'example.com': {
          presetId: 'bilibili',
          fabEnabled: true,
          fabHidden: false,
          bilibiliUploaderKeywordBlockMode: 'clear',
          bilibiliUploaderKeywordPatterns: ['  up1  ', 'up2'],
        },
      },
    })
    expect(
      parsed.sites['example.com']?.bilibiliUploaderKeywordBlockMode,
    ).toBe('clear')
    expect(
      parsed.sites['example.com']?.bilibiliUploaderKeywordPatterns,
    ).toEqual(['up1', 'up2'])
  })
})
