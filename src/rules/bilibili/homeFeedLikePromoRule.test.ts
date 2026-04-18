import { describe, expect, it } from 'vitest'
import { BLOCK_HANDLED_ATTR } from './feedCard'
import { resolveHomeFeedRoot } from './homeFeedAdsRule'
import { runHomeFeedLikePromoRule } from './homeFeedLikePromoRule'

describe('runHomeFeedLikePromoRule', () => {
  it('remove deletes outer .feed-card when info--icon-text is like-promo line', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="promo-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__info">
              <div class="bili-video-card__info--bottom">
                <div class="bili-video-card__info--icon-text">\u0032\u4e07\u70b9\u8d5e</div>
                <a class="bili-video-card__info--owner" href="#">x</a>
              </div>
            </div>
          </article>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedLikePromoRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="promo-slot"]')).toBeNull()
  })

  it('remove deletes outer .feed-card when stats--text is like-promo line', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="promo-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__stats">
              <div class="bili-video-card__stats--left"><span>x</span></div>
              <span class="bili-video-card__stats--text">\u0032\u4e07\u70b9\u8d5e</span>
            </div>
          </article>
        </div>
        <div class="feed-card" data-id="ok-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__stats">
              <span class="bili-video-card__stats--text">\u0031\u4e07\u64ad\u653e</span>
            </div>
          </article>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedLikePromoRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="promo-slot"]')).toBeNull()
    expect(document.querySelector('[data-id="ok-slot"]')).not.toBeNull()
  })

  it('off mode does nothing', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="promo-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__stats">
              <span class="bili-video-card__stats--text">\u0032\u5343\u70b9\u8d5e</span>
            </div>
          </article>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedLikePromoRule(root, 'off')).toBe(0)
    expect(document.querySelector('[data-id="promo-slot"]')).not.toBeNull()
  })

  it('clear mode marks handled slot', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="promo-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__stats">
              <span class="bili-video-card__stats--text">\u0032\u4e07\u70b9\u8d5e</span>
            </div>
          </article>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedLikePromoRule(root, 'clear')).toBe(1)
    const cleared = document.querySelector(`[${BLOCK_HANDLED_ATTR}="clear"]`)
    expect(cleared).not.toBeNull()
  })

  it('skips spans already under a handled block', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="outer" ${BLOCK_HANDLED_ATTR}="clear">
          <span class="bili-video-card__stats--text">\u0032\u4e07\u70b9\u8d5e</span>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedLikePromoRule(root, 'remove')).toBe(0)
  })

  it('runs from resolveHomeFeedRoot scope', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="promo-slot">
          <article class="bili-video-card">
            <div class="bili-video-card__stats">
              <span class="bili-video-card__stats--text">\u0031\u002e\u0032\u4e07\u70b9\u8d5e</span>
            </div>
          </article>
        </div>
      </div>
    `
    const root = resolveHomeFeedRoot(document)
    expect(runHomeFeedLikePromoRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="promo-slot"]')).toBeNull()
  })
})
