import { describe, expect, it } from 'vitest'
import { normalizeHostname } from './normalizeHostname'

describe('normalizeHostname', () => {
  it('normalizes case and surrounding spaces', () => {
    expect(normalizeHostname('  WWW.BILIBILI.COM  ')).toBe('www.bilibili.com')
  })
})
