import { describe, expect, it } from 'vitest'
import { findDisplayedDurationSeconds, runHomeFeedDurationRule } from './homeFeedDurationRule'

describe('findDisplayedDurationSeconds', () => {
  it('reads .bili-video-card__stats__duration (MM:SS)', () => {
    document.body.innerHTML = `
      <div class="bili-video-card">
        <div class="bili-video-card__stats">
          <span class="bili-video-card__stats__duration">29:15</span>
        </div>
      </div>`
    const card = document.querySelector('.bili-video-card')!
    expect(findDisplayedDurationSeconds(card)).toBe(29 * 60 + 15)
  })

  it('reads H:MM:SS in stats__duration', () => {
    document.body.innerHTML = `
      <div class="bili-video-card">
        <span class="bili-video-card__stats__duration">1:05:30</span>
      </div>`
    const card = document.querySelector('.bili-video-card')!
    expect(findDisplayedDurationSeconds(card)).toBe(3600 + 5 * 60 + 30)
  })

  it('reads stats__duration on div.bili-video-card under mask (feed v4 shape)', () => {
    document.body.innerHTML = `
      <div class="bili-feed-card">
        <div class="bili-video-card is-rcmd enable-no-interest">
          <div class="bili-video-card__mask">
            <div class="bili-video-card__stats">
              <div class="bili-video-card__stats--left"></div>
              <span class="bili-video-card__stats__duration">29:15</span>
            </div>
          </div>
        </div>
      </div>`
    const card = document.querySelector('.bili-video-card')!
    expect(findDisplayedDurationSeconds(card)).toBe(29 * 60 + 15)
  })
})

describe('runHomeFeedDurationRule', () => {
  it('remove drops feed-card when duration is out of range', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="long">
          <div class="bili-video-card">
            <span class="bili-video-card__stats__duration">29:15</span>
          </div>
        </div>
        <div class="feed-card" data-id="short">
          <div class="bili-video-card">
            <span class="bili-video-card__stats__duration">03:00</span>
          </div>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    const n = runHomeFeedDurationRule(root, {
      mode: 'remove',
      minStr: '',
      maxStr: '5:00',
    })
    expect(n).toBe(1)
    expect(document.querySelector('[data-id="long"]')).toBeNull()
    expect(document.querySelector('[data-id="short"]')).not.toBeNull()
  })

  it('off does nothing', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="x">
          <div class="bili-video-card">
            <span class="bili-video-card__stats__duration">59:00</span>
          </div>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    expect(
      runHomeFeedDurationRule(root, {
        mode: 'off',
        minStr: '',
        maxStr: '5:00',
      }),
    ).toBe(0)
    expect(document.querySelector('[data-id="x"]')).not.toBeNull()
  })

  it('remove drops when only min bound (e.g. 30:00 and empty max)', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="short">
          <div class="bili-video-card">
            <span class="bili-video-card__stats__duration">10:00</span>
          </div>
        </div>
        <div class="feed-card" data-id="long">
          <div class="bili-video-card">
            <span class="bili-video-card__stats__duration">45:00</span>
          </div>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    const n = runHomeFeedDurationRule(root, {
      mode: 'remove',
      minStr: '30:00',
      maxStr: '',
    })
    expect(n).toBe(1)
    expect(document.querySelector('[data-id="short"]')).toBeNull()
    expect(document.querySelector('[data-id="long"]')).not.toBeNull()
  })
})
