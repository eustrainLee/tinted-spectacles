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
})
