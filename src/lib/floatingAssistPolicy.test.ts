import { describe, expect, it } from 'vitest'
import { shouldShowFloatingAssist } from './floatingAssistPolicy'

describe('shouldShowFloatingAssist', () => {
  it('returns false when record is missing', () => {
    expect(shouldShowFloatingAssist(undefined)).toBe(false)
  })

  it('returns false when preset is none', () => {
    expect(
      shouldShowFloatingAssist({
        presetId: 'none',
        fabEnabled: true,
        fabHidden: false,
      }),
    ).toBe(false)
  })

  it('returns false when fab is disabled', () => {
    expect(
      shouldShowFloatingAssist({
        presetId: 'bilibili',
        fabEnabled: false,
        fabHidden: false,
      }),
    ).toBe(false)
  })

  it('returns false when fab is hidden', () => {
    expect(
      shouldShowFloatingAssist({
        presetId: 'bilibili',
        fabEnabled: true,
        fabHidden: true,
      }),
    ).toBe(false)
  })

  it('returns true when preset is active and fab is enabled and visible', () => {
    expect(
      shouldShowFloatingAssist({
        presetId: 'bilibili',
        fabEnabled: true,
        fabHidden: false,
      }),
    ).toBe(true)
  })
})
