export type ExtensionStatus = 'ok' | 'noMatch' | 'partialFailure' | 'fatal'

export interface ExtensionStatusInfo {
  badgeText: string
  badgeColor: string
  actionTitle: string
  message: string
}

export const STATUS_INFO: Record<ExtensionStatus, ExtensionStatusInfo> = {
  ok: {
    badgeText: 'ON',
    badgeColor: '#1F7A3D',
    actionTitle: 'Tinted Spectacles: rules active',
    message: 'Rules are active on this tab.',
  },
  noMatch: {
    badgeText: '--',
    badgeColor: '#596273',
    actionTitle: 'Tinted Spectacles: no applicable rules',
    message: 'No applicable rules for this tab.',
  },
  partialFailure: {
    badgeText: '!!',
    badgeColor: '#A56D00',
    actionTitle: 'Tinted Spectacles: partial failure',
    message: 'Some cleanup steps failed. Reload and try again.',
  },
  fatal: {
    badgeText: 'XX',
    badgeColor: '#8A1C2D',
    actionTitle: 'Tinted Spectacles: rules unavailable',
    message: 'Rules are unavailable. Reapply settings and reload.',
  },
}

export function isExtensionStatus(value: unknown): value is ExtensionStatus {
  return typeof value === 'string' && value in STATUS_INFO
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
    isExtensionStatus(candidate.status)
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
