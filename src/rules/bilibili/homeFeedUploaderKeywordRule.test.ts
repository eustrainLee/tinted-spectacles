import { describe, expect, it } from 'vitest'
import {
  findHomeFeedCardUploaderText,
  runHomeFeedUploaderKeywordRule,
} from './homeFeedUploaderKeywordRule'

describe('findHomeFeedCardUploaderText', () => {
  it('reads .bili-video-card__info--owner text', () => {
    document.body.innerHTML = `
      <article class="bili-video-card">
        <div class="bili-video-card__info">
          <a class="bili-video-card__info--owner" href="#">TestUP</a>
        </div>
      </article>`
    const card = document.querySelector('.bili-video-card')!
    expect(findHomeFeedCardUploaderText(card)).toBe('TestUP')
  })

  it('falls back to space link text in info', () => {
    document.body.innerHTML = `
      <article class="bili-video-card">
        <div class="bili-video-card__info">
          <a href="//space.bilibili.com/123">SpaceName</a>
        </div>
      </article>`
    const card = document.querySelector('.bili-video-card')!
    expect(findHomeFeedCardUploaderText(card)).toBe('SpaceName')
  })
})

describe('runHomeFeedUploaderKeywordRule', () => {
  it('remove deletes feed-card when uploader matches', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="hit">
          <article class="bili-video-card">
            <div class="bili-video-card__info">
              <a class="bili-video-card__info--owner" href="#">BadCreator</a>
            </div>
          </article>
        </div>
        <div class="feed-card" data-id="miss">
          <article class="bili-video-card">
            <a class="bili-video-card__info--owner" href="#">GoodOne</a>
          </article>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    const n = runHomeFeedUploaderKeywordRule(root, {
      mode: 'remove',
      patterns: ['Bad'],
    })
    expect(n).toBe(1)
    expect(document.querySelector('[data-id="hit"]')).toBeNull()
    expect(document.querySelector('[data-id="miss"]')).not.toBeNull()
  })

  it('off does nothing', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="x">
          <article class="bili-video-card">
            <a class="bili-video-card__info--owner" href="#">x</a>
          </article>
        </div>
      </div>`
    const root = document.querySelector('.bili-feed4')!
    expect(
      runHomeFeedUploaderKeywordRule(root, {
        mode: 'off',
        patterns: ['x'],
      }),
    ).toBe(0)
    expect(document.querySelector('[data-id="x"]')).not.toBeNull()
  })
})
