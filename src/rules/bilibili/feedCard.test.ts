import { describe, expect, it } from 'vitest'
import {
  BLOCK_HANDLED_ATTR,
  applyFeedCardBlockMode,
  resolveBilibiliBlockTarget,
} from './feedCard'

describe('resolveBilibiliBlockTarget', () => {
  it('uses .feed-card ancestor when present', () => {
    document.body.innerHTML =
      '<div class="feed-card" data-id="cell"><div id="inner"></div></div>'
    const inner = document.getElementById('inner')!
    expect(resolveBilibiliBlockTarget(inner).getAttribute('data-id')).toBe('cell')
  })

  it('uses .bili-feed-card ancestor when present', () => {
    document.body.innerHTML =
      '<div class="bili-feed-card" data-id="legacy"><div id="inner2"></div></div>'
    const inner = document.getElementById('inner2')!
    expect(resolveBilibiliBlockTarget(inner).getAttribute('data-id')).toBe('legacy')
  })

  it('prefers .feed-card over nested .bili-feed-card', () => {
    document.body.innerHTML = `
      <div class="feed-card" data-id="outer">
        <div class="bili-feed-card" data-id="inner"><div id="deep"></div></div>
      </div>`
    const deep = document.getElementById('deep')!
    expect(resolveBilibiliBlockTarget(deep).getAttribute('data-id')).toBe('outer')
  })

  it('falls back to the node itself', () => {
    document.body.innerHTML = '<div id="solo"></div>'
    const solo = document.getElementById('solo')!
    expect(resolveBilibiliBlockTarget(solo)).toBe(solo)
  })
})

describe('applyFeedCardBlockMode', () => {
  it('remove drops the element', () => {
    document.body.innerHTML = '<div id="t"></div>'
    const el = document.getElementById('t')!
    expect(applyFeedCardBlockMode(el, 'remove')).toBe(true)
    expect(document.getElementById('t')).toBeNull()
  })

  it('clear empties and sets handled', () => {
    document.body.innerHTML = '<div id="t"><span>x</span></div>'
    const el = document.getElementById('t')!
    expect(applyFeedCardBlockMode(el, 'clear')).toBe(true)
    expect(el.childNodes.length).toBe(0)
    expect(el.getAttribute(BLOCK_HANDLED_ATTR)).toBe('clear')
  })

  it('mark inserts label node', () => {
    document.body.innerHTML = '<div id="t"></div>'
    const el = document.getElementById('t')!
    expect(applyFeedCardBlockMode(el, 'mark')).toBe(true)
    expect(
      el.querySelector('.tinted-spectacles-bili-ad-mark')?.textContent,
    ).toBe('\u5e7f\u544a')
  })

  it('off is a no-op', () => {
    document.body.innerHTML = '<div id="t">x</div>'
    const el = document.getElementById('t')!
    expect(applyFeedCardBlockMode(el, 'off')).toBe(false)
    expect(el.textContent).toBe('x')
  })
})
