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
