import { describe, expect, it } from 'vitest'
import {
  findHomeFeedCardTitleText,
  runHomeFeedTitleKeywordRule,
} from './homeFeedTitleKeywordRule'

describe('findHomeFeedCardTitleText', () => {
  it('reads .bili-video-card__info--tit when present', () => {
    document.body.innerHTML = `
      <article class="bili-video-card">
        <div class="bili-video-card__info">
          <p class="bili-video-card__info--tit">Hello ASMR world</p>
        </div>
      </article>`
    const card = document.querySelector('.bili-video-card')!
    expect(findHomeFeedCardTitleText(card)).toBe('Hello ASMR world')
  })

  it('falls back to first video link text in info', () => {
    document.body.innerHTML = `
      <article class="bili-video-card">
        <div class="bili-video-card__info">
          <a href="//www.bilibili.com/video/BV1xx">Fallback title</a>
        </div>
      </article>`
    const card = document.querySelector('.bili-video-card')!
    expect(findHomeFeedCardTitleText(card)).toBe('Fallback title')
  })
})

describe('runHomeFeedTitleKeywordRule', () => {
  it('remove deletes feed-card when title matches a pattern', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="hit">
          <article class="bili-video-card">
            <div class="bili-video-card__info">
              <p class="bili-video-card__info--tit">KFC V me 50 today</p>
            </div>
          </article>
        </div>
        <div class="feed-card" data-id="miss">
          <article class="bili-video-card">
            <div class="bili-video-card__info">
              <p class="bili-video-card__info--tit">normal clip</p>
            </div>
          </article>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    const n = runHomeFeedTitleKeywordRule(root, {
      mode: 'remove',
      patterns: ['KFC.*50'],
    })
    expect(n).toBe(1)
    expect(document.querySelector('[data-id="hit"]')).toBeNull()
    expect(document.querySelector('[data-id="miss"]')).not.toBeNull()
  })

  it('matches plain substring pattern', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="x">
          <article class="bili-video-card">
            <p class="bili-video-card__info--tit">\u7a7f\u8d8a\u5267</p>
          </article>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    expect(
      runHomeFeedTitleKeywordRule(root, {
        mode: 'remove',
        patterns: ['\u7a7f\u8d8a'],
      }),
    ).toBe(1)
    expect(document.querySelector('[data-id="x"]')).toBeNull()
  })

  it('off does nothing', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="x">
          <article class="bili-video-card">
            <p class="bili-video-card__info--tit">bad</p>
          </article>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    expect(
      runHomeFeedTitleKeywordRule(root, {
        mode: 'off',
        patterns: ['bad'],
      }),
    ).toBe(0)
    expect(document.querySelector('[data-id="x"]')).not.toBeNull()
  })
})
