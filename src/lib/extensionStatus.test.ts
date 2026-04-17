import { describe, expect, it } from 'vitest'
import {
  STATUS_INFO,
  isStatusQueryMessage,
  isStatusReportMessage,
} from './extensionStatus'

describe('extensionStatus guards', () => {
  it('accepts valid status report messages', () => {
    expect(
      isStatusReportMessage({
        type: 'tinted.statusReport',
        status: 'ok',
      }),
    ).toBe(true)
  })

  it('rejects invalid status report messages', () => {
    expect(
      isStatusReportMessage({
        type: 'tinted.statusReport',
        status: 'unknown',
      }),
    ).toBe(false)
  })

  it('accepts valid status query messages', () => {
    expect(
      isStatusQueryMessage({
        type: 'tinted.statusQuery',
        tabId: 12,
      }),
    ).toBe(true)
  })
})

describe('extensionStatus metadata', () => {
  it('uses concise badge text values', () => {
    expect(STATUS_INFO.ok.badgeText).toBe('ON')
    expect(STATUS_INFO.noMatch.badgeText).toBe('--')
    expect(STATUS_INFO.partialFailure.badgeText).toBe('!!')
    expect(STATUS_INFO.fatal.badgeText).toBe('XX')
  })
})
