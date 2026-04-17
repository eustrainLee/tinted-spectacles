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
})
