export type ExtensionStatus = 'ok' | 'noMatch' | 'partialFailure' | 'fatal'

export interface ExtensionStatusInfo {
  shortLabel: string
  message: string
}

export const STATUS_INFO: Record<ExtensionStatus, ExtensionStatusInfo> = {
  ok: {
    shortLabel: 'OK',
    message: 'Rules are active on this tab.',
  },
  noMatch: {
    shortLabel: 'NM',
    message: 'No applicable rules for this tab.',
  },
  partialFailure: {
    shortLabel: 'PF',
    message: 'Some cleanup steps failed. Reload and try again.',
  },
  fatal: {
    shortLabel: 'FT',
    message: 'Rules are unavailable. Reapply settings and reload.',
  },
}

export interface StatusReportMessage {
  type: 'tinted.statusReport'
  status: ExtensionStatus
  tabId?: number
}

export interface StatusQueryMessage {
  type: 'tinted.statusQuery'
  tabId: number
}

export function isStatusReportMessage(
  value: unknown,
): value is StatusReportMessage {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    candidate.type === 'tinted.statusReport' &&
    typeof candidate.status === 'string' &&
    candidate.status in STATUS_INFO
  )
}

export function isStatusQueryMessage(
  value: unknown,
): value is StatusQueryMessage {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    candidate.type === 'tinted.statusQuery' &&
    typeof candidate.tabId === 'number'
  )
}
