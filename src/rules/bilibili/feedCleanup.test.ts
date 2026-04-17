import { describe, expect, it } from 'vitest'
import fixtureHtml from '../../test/fixtures/bilibili-feed-sample.html?raw'
import { resolveBilibiliFeedRoot, runBilibiliFeedCleanup } from './feedCleanup'

describe('runBilibiliFeedCleanup', () => {
  it('removes only ad-marked bilibili cards', () => {
    document.body.innerHTML = fixtureHtml
    const root = resolveBilibiliFeedRoot(document)
    const removedCount = runBilibiliFeedCleanup(root)

    expect(removedCount).toBe(1)
    expect(document.querySelector('[data-id="ad-1"]')).toBeNull()
    expect(document.querySelector('[data-id="normal-1"]')).not.toBeNull()
    expect(document.querySelector('[data-id="normal-2"]')).not.toBeNull()
  })
})
