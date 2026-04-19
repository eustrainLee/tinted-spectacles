import { isSpectacleId, type SpectacleId } from './presets'
import { sanitizeTitleKeywordPatterns } from './titleKeywordPatterns'

export const STORAGE_KEY = 'siteSpectacleMap'
export const STORAGE_SCHEMA_VERSION = 1

/** Max chars stored for bilibili duration min/max text fields. */
export const BILIBILI_DURATION_INPUT_MAX_CHARS = 32

export type BilibiliFeedBlockMode = 'off' | 'remove' | 'clear' | 'mark'

export function isBilibiliFeedBlockMode(
  value: unknown,
): value is BilibiliFeedBlockMode {
  return (
    value === 'off' ||
    value === 'remove' ||
    value === 'clear' ||
    value === 'mark'
  )
}

export interface FabPosition {
  left: number
  top: number
}

export interface SiteSettingRecord {
  presetId: SpectacleId
  fabEnabled: boolean
  fabHidden: boolean
  fabPosition?: FabPosition
  /** Bilibili: ad handling (off = disabled; default remove if unset). */
  bilibiliFeedBlockMode?: BilibiliFeedBlockMode
  /** Bilibili: like-promo line on cover stats (e.g. N万点赞); same modes as ads. */
  bilibiliLikePromoBlockMode?: BilibiliFeedBlockMode
  /** Bilibili: partition-recommend floor tiles (data-mod partition_recommend.content). */
  bilibiliPartitionRecommendBlockMode?: BilibiliFeedBlockMode
  /** Bilibili: filter feed cards by on-card video length; default off when unset. */
  bilibiliDurationBlockMode?: BilibiliFeedBlockMode
  /** Typed min length (MM:SS or H:MM:SS); empty = no lower bound when rule is on. */
  bilibiliDurationMinStr?: string
  /** Typed max length; empty = no upper bound when rule is on. */
  bilibiliDurationMaxStr?: string
  /** Bilibili: block feed cards when title matches any pattern (RegExp per line). */
  bilibiliTitleKeywordBlockMode?: BilibiliFeedBlockMode
  /** Stored title patterns; each compiled as RegExp with flag `iu`. */
  bilibiliTitleKeywordPatterns?: string[]
  /** Bilibili: block feed cards when uploader display name matches any pattern. */
  bilibiliUploaderKeywordBlockMode?: BilibiliFeedBlockMode
  /** Stored uploader-name patterns; each compiled as RegExp with flag `iu`. */
  bilibiliUploaderKeywordPatterns?: string[]
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

  const modeRaw = value.bilibiliFeedBlockMode
  const bilibiliFeedBlockMode = isBilibiliFeedBlockMode(modeRaw)
    ? modeRaw
    : undefined

  const likePromoRaw = value.bilibiliLikePromoBlockMode
  const bilibiliLikePromoBlockMode = isBilibiliFeedBlockMode(likePromoRaw)
    ? likePromoRaw
    : undefined

  const partitionRecommendRaw = value.bilibiliPartitionRecommendBlockMode
  const bilibiliPartitionRecommendBlockMode = isBilibiliFeedBlockMode(
    partitionRecommendRaw,
  )
    ? partitionRecommendRaw
    : undefined

  const durationModeRaw = value.bilibiliDurationBlockMode
  const bilibiliDurationBlockMode = isBilibiliFeedBlockMode(durationModeRaw)
    ? durationModeRaw
    : undefined

  const minStrRaw = value.bilibiliDurationMinStr
  const maxStrRaw = value.bilibiliDurationMaxStr
  const bilibiliDurationMinStr =
    typeof minStrRaw === 'string'
      ? minStrRaw.trim().slice(0, BILIBILI_DURATION_INPUT_MAX_CHARS)
      : undefined
  const bilibiliDurationMaxStr =
    typeof maxStrRaw === 'string'
      ? maxStrRaw.trim().slice(0, BILIBILI_DURATION_INPUT_MAX_CHARS)
      : undefined

  const titleKwModeRaw = value.bilibiliTitleKeywordBlockMode
  const bilibiliTitleKeywordBlockMode = isBilibiliFeedBlockMode(titleKwModeRaw)
    ? titleKwModeRaw
    : undefined

  const titleKwPatternsRaw = value.bilibiliTitleKeywordPatterns
  const bilibiliTitleKeywordPatterns = Array.isArray(titleKwPatternsRaw)
    ? sanitizeTitleKeywordPatterns(titleKwPatternsRaw)
    : undefined

  const uploaderKwModeRaw = value.bilibiliUploaderKeywordBlockMode
  const bilibiliUploaderKeywordBlockMode = isBilibiliFeedBlockMode(
    uploaderKwModeRaw,
  )
    ? uploaderKwModeRaw
    : undefined

  const uploaderKwPatternsRaw = value.bilibiliUploaderKeywordPatterns
  const bilibiliUploaderKeywordPatterns = Array.isArray(uploaderKwPatternsRaw)
    ? sanitizeTitleKeywordPatterns(uploaderKwPatternsRaw)
    : undefined

  return {
    presetId: presetIdRaw,
    fabEnabled,
    fabHidden,
    ...(fabPosition ? { fabPosition } : {}),
    ...(bilibiliFeedBlockMode
      ? { bilibiliFeedBlockMode: bilibiliFeedBlockMode }
      : {}),
    ...(bilibiliLikePromoBlockMode
      ? { bilibiliLikePromoBlockMode: bilibiliLikePromoBlockMode }
      : {}),
    ...(bilibiliPartitionRecommendBlockMode
      ? {
          bilibiliPartitionRecommendBlockMode:
            bilibiliPartitionRecommendBlockMode,
        }
      : {}),
    ...(bilibiliDurationBlockMode
      ? { bilibiliDurationBlockMode: bilibiliDurationBlockMode }
      : {}),
    ...(typeof minStrRaw === 'string'
      ? { bilibiliDurationMinStr: bilibiliDurationMinStr ?? '' }
      : {}),
    ...(typeof maxStrRaw === 'string'
      ? { bilibiliDurationMaxStr: bilibiliDurationMaxStr ?? '' }
      : {}),
    ...(bilibiliTitleKeywordBlockMode
      ? { bilibiliTitleKeywordBlockMode: bilibiliTitleKeywordBlockMode }
      : {}),
    ...(Array.isArray(titleKwPatternsRaw)
      ? {
          bilibiliTitleKeywordPatterns: bilibiliTitleKeywordPatterns ?? [],
        }
      : {}),
    ...(bilibiliUploaderKeywordBlockMode
      ? {
          bilibiliUploaderKeywordBlockMode: bilibiliUploaderKeywordBlockMode,
        }
      : {}),
    ...(Array.isArray(uploaderKwPatternsRaw)
      ? {
          bilibiliUploaderKeywordPatterns:
            bilibiliUploaderKeywordPatterns ?? [],
        }
      : {}),
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
