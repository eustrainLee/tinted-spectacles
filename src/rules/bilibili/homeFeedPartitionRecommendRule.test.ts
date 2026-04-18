import { describe, expect, it } from 'vitest'
import { BLOCK_HANDLED_ATTR } from './feedCard'
import { resolveHomeFeedRoot } from './homeFeedAdsRule'
import { runHomeFeedPartitionRecommendRule } from './homeFeedPartitionRecommendRule'

describe('runHomeFeedPartitionRecommendRule', () => {
  it('remove deletes .floor-single-card when link has partition_recommend mod', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="floor-single-card" data-id="part-slot">
          <a href="#" data-mod="partition_recommend.content">cover</a>
          <a href="#" data-mod="partition_recommend.content">title</a>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedPartitionRecommendRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="part-slot"]')).toBeNull()
  })

  it('falls back to .feed-card when floor-single-card is absent', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="feed-card" data-id="fc">
          <a href="#" data-mod="partition_recommend.content">x</a>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedPartitionRecommendRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="fc"]')).toBeNull()
  })

  it('off mode does nothing', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="floor-single-card" data-id="part-slot">
          <a href="#" data-mod="partition_recommend.content">x</a>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedPartitionRecommendRule(root, 'off')).toBe(0)
    expect(document.querySelector('[data-id="part-slot"]')).not.toBeNull()
  })

  it('clear mode marks handled tile', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="floor-single-card" data-id="part-slot">
          <a href="#" data-mod="partition_recommend.content">x</a>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedPartitionRecommendRule(root, 'clear')).toBe(1)
    const cleared = document.querySelector(`[${BLOCK_HANDLED_ATTR}="clear"]`)
    expect(cleared).not.toBeNull()
    expect(cleared?.getAttribute('data-id')).toBe('part-slot')
  })

  it('skips links already under a handled block', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="floor-single-card" data-id="outer" ${BLOCK_HANDLED_ATTR}="clear">
          <a href="#" data-mod="partition_recommend.content">x</a>
        </div>
      </div>
    `
    const root = document.querySelector('.bili-feed4')!
    expect(runHomeFeedPartitionRecommendRule(root, 'remove')).toBe(0)
  })

  it('runs from resolveHomeFeedRoot scope', () => {
    document.body.innerHTML = `
      <div class="bili-feed4">
        <div class="floor-single-card" data-id="part-slot">
          <a href="#" data-mod="partition_recommend.content">x</a>
        </div>
      </div>
    `
    const root = resolveHomeFeedRoot(document)
    expect(runHomeFeedPartitionRecommendRule(root, 'remove')).toBe(1)
    expect(document.querySelector('[data-id="part-slot"]')).toBeNull()
  })
})
