import type { SiteSettingRecord } from './storageSchema'

export function shouldShowFloatingAssist(
  record: SiteSettingRecord | undefined,
): boolean {
  if (!record) {
    return false
  }
  if (record.presetId === 'none') {
    return false
  }
  return record.fabEnabled && !record.fabHidden
}
