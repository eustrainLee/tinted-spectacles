import { isSpectacleId, type SpectacleId } from './presets'

export const STORAGE_KEY = 'siteSpectacleMap'
export const STORAGE_SCHEMA_VERSION = 1

export interface FabPosition {
  left: number
  top: number
}

export interface SiteSettingRecord {
  presetId: SpectacleId
  fabEnabled: boolean
  fabHidden: boolean
  fabPosition?: FabPosition
}

export interface SiteSettingsState {
  schemaVersion: number
  sites: Record<string, SiteSettingRecord>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseFabPosition(value: unknown): FabPosition | undefined {
  if (!isRecord(value)) {
    return undefined
  }
  const leftRaw = value.left
  const topRaw = value.top
  if (
    typeof leftRaw === 'number' &&
    Number.isFinite(leftRaw) &&
    typeof topRaw === 'number' &&
    Number.isFinite(topRaw)
  ) {
    return { left: leftRaw, top: topRaw }
  }
  return undefined
}

function parseSiteRecord(value: unknown): SiteSettingRecord | null {
  if (typeof value === 'string' && isSpectacleId(value)) {
    return {
      presetId: value,
      fabEnabled: true,
      fabHidden: false,
      fabPosition: undefined,
    }
  }

  if (!isRecord(value)) {
    return null
  }

  const presetIdRaw = value.presetId
  if (typeof presetIdRaw !== 'string' || !isSpectacleId(presetIdRaw)) {
    return null
  }

  const fabEnabledRaw = value.fabEnabled
  const fabEnabled = typeof fabEnabledRaw === 'boolean' ? fabEnabledRaw : true

  const fabHiddenRaw = value.fabHidden
  const fabHidden = typeof fabHiddenRaw === 'boolean' ? fabHiddenRaw : false

  const fabPosition = parseFabPosition(value.fabPosition)

  return {
    presetId: presetIdRaw,
    fabEnabled,
    fabHidden,
    ...(fabPosition ? { fabPosition } : {}),
  }
}

export function parseSiteSettingsState(raw: unknown): SiteSettingsState {
  if (isRecord(raw)) {
    const schemaVersionRaw = raw.schemaVersion
    const sitesRaw = raw.sites
    if (typeof schemaVersionRaw === 'number' && isRecord(sitesRaw)) {
      const sites: Record<string, SiteSettingRecord> = {}
      for (const [key, value] of Object.entries(sitesRaw)) {
        const parsed = parseSiteRecord(value)
        if (parsed) {
          sites[key] = parsed
        }
      }
      return {
        schemaVersion: schemaVersionRaw,
        sites,
      }
    }

    const legacySites: Record<string, SiteSettingRecord> = {}
    for (const [key, value] of Object.entries(raw)) {
      const parsed = parseSiteRecord(value)
      if (parsed) {
        legacySites[key] = parsed
      }
    }
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sites: legacySites,
    }
  }

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    sites: {},
  }
}
