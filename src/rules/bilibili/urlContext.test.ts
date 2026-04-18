import { describe, expect, it } from 'vitest'
import { isBilibiliHomeFeedPage, isBilibiliHost } from './urlContext'

describe('isBilibiliHost', () => {
  it('matches apex and subdomains', () => {
    expect(isBilibiliHost('www.bilibili.com')).toBe(true)
    expect(isBilibiliHost('space.bilibili.com')).toBe(true)
    expect(isBilibiliHost('example.com')).toBe(false)
  })
})

describe('isBilibiliHomeFeedPage', () => {
  it('is true only for www/bilibili apex with path /', () => {
    expect(
      isBilibiliHomeFeedPage({ hostname: 'www.bilibili.com', pathname: '/' }),
    ).toBe(true)
    expect(
      isBilibiliHomeFeedPage({ hostname: 'www.BILIBILI.COM', pathname: '/' }),
    ).toBe(true)
    expect(
      isBilibiliHomeFeedPage({ hostname: 'bilibili.com', pathname: '/' }),
    ).toBe(true)
    expect(
      isBilibiliHomeFeedPage({ hostname: 'www.bilibili.com', pathname: '' }),
    ).toBe(true)
  })

  it('is false on non-home paths', () => {
    expect(
      isBilibiliHomeFeedPage({
        hostname: 'www.bilibili.com',
        pathname: '/video/BV1oC9FBhE7B',
      }),
    ).toBe(false)
  })

  it('is false on other subdomains even at /', () => {
    expect(
      isBilibiliHomeFeedPage({ hostname: 'space.bilibili.com', pathname: '/' }),
    ).toBe(false)
  })
})
