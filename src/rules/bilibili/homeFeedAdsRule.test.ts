import { describe, expect, it } from 'vitest'
import fixtureFeed4 from '../../test/fixtures/bilibili-feed-feed4-sample.html?raw'
import fixtureHtml from '../../test/fixtures/bilibili-feed-sample.html?raw'
import { BLOCK_HANDLED_ATTR } from './feedCard'
import { resolveHomeFeedRoot, runHomeFeedAdsRule } from './homeFeedAdsRule'

describe('runHomeFeedAdsRule', () => {
  it('removes only ad-marked bilibili cards', () => {
    document.body.innerHTML = fixtureHtml
    const root = resolveHomeFeedRoot(document)
    const removedCount = runHomeFeedAdsRule(root, 'remove')

    expect(removedCount).toBe(1)
    expect(document.querySelector('[data-id="ad-1"]')).toBeNull()
    expect(document.querySelector('[data-id="normal-1"]')).not.toBeNull()
    expect(document.querySelector('[data-id="normal-2"]')).not.toBeNull()
  })

  it('removes feed4 stats-label ads and cm promo wraps without legacy ad class', () => {
    document.body.innerHTML = fixtureFeed4
    const root = resolveHomeFeedRoot(document)
    const removedCount = runHomeFeedAdsRule(root, 'remove')

    expect(removedCount).toBe(2)
    expect(document.querySelector('[data-id="ad-stats-1"]')).toBeNull()
    expect(document.querySelector('[href*="cm.bilibili.com"]')).toBeNull()
    expect(document.querySelector('[data-id="normal-v4-1"]')).not.toBeNull()
  })

  it('clear mode leaves empty handled slots', () => {
    document.body.innerHTML = fixtureHtml
    const root = resolveHomeFeedRoot(document)
    const count = runHomeFeedAdsRule(root, 'clear')
    expect(count).toBe(1)
    const cleared = document.querySelector(`[${BLOCK_HANDLED_ATTR}="clear"]`)
    expect(cleared).not.toBeNull()
    expect(cleared?.childNodes.length).toBe(0)
    expect(document.querySelector('[data-id="normal-1"]')).not.toBeNull()
  })

  it('mark mode injects label inside handled slot', () => {
    document.body.innerHTML = fixtureHtml
    const root = resolveHomeFeedRoot(document)
    const count = runHomeFeedAdsRule(root, 'mark')
    expect(count).toBe(1)
    const mark = document.querySelector(
      `[${BLOCK_HANDLED_ATTR}="mark"] .tinted-spectacles-bili-ad-mark`,
    )
    expect(mark?.textContent).toBe('\u5e7f\u544a')
  })

  it('off mode does nothing', () => {
    document.body.innerHTML = fixtureHtml
    const root = resolveHomeFeedRoot(document)
    expect(runHomeFeedAdsRule(root, 'off')).toBe(0)
    expect(document.querySelector('[data-id="ad-1"]')).not.toBeNull()
  })

  it('remove deletes outer .feed-card wrapper when ad is inside', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="outer-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__info"><span class="bili-video-card__info--ad">x</span></div>
          </article>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedAdsRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="outer-slot"]')).toBeNull()
  })
})

describe('resolveHomeFeedRoot', () => {
  it('prefers feed v4 when legacy aside root is missing', () => {
    document.body.innerHTML = '<div class="bili-feed4" data-root="v4"></div>'
    const root = resolveHomeFeedRoot(document)
    expect(root).toBeInstanceOf(Element)
    expect((root as Element).getAttribute('data-root')).toBe('v4')
  })
})
