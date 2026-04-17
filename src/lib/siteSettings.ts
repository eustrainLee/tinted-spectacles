import { normalizeHostname } from './normalizeHostname'
import type { SpectacleId } from './presets'
import {
  STORAGE_KEY,
  STORAGE_SCHEMA_VERSION,
  parseSiteSettingsState,
  type FabPosition,
  type SiteSettingRecord,
} from './storageSchema'

export async function getSiteMap(): Promise<Record<string, SiteSettingRecord>> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const parsed = parseSiteSettingsState(data[STORAGE_KEY])
  return { ...parsed.sites }
}

export async function setSiteSpectacle(
  hostname: string,
  spectacleId: SpectacleId,
  fabEnabled: boolean,
): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const parsed = parseSiteSettingsState(data[STORAGE_KEY])
  const sites = { ...parsed.sites }
  const key = normalizeHostname(hostname)

  if (spectacleId === 'none') {
    delete sites[key]
  } else {
    const previous = sites[key]
    sites[key] = {
      presetId: spectacleId,
      fabEnabled,
      fabHidden: false,
      fabPosition: previous?.fabPosition,
    }
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sites,
    },
  })
}

export async function clearSiteSpectacle(hostname: string): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const parsed = parseSiteSettingsState(data[STORAGE_KEY])
  const sites = { ...parsed.sites }
  delete sites[normalizeHostname(hostname)]
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sites,
    },
  })
}

export async function setFabHidden(hostname: string, hidden: boolean): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const parsed = parseSiteSettingsState(data[STORAGE_KEY])
  const sites = { ...parsed.sites }
  const key = normalizeHostname(hostname)
  const existing = sites[key]
  if (!existing) {
    return
  }
  sites[key] = {
    ...existing,
    fabHidden: hidden,
  }
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sites,
    },
  })
}

export async function setFabPosition(
  hostname: string,
  position: FabPosition,
): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const parsed = parseSiteSettingsState(data[STORAGE_KEY])
  const sites = { ...parsed.sites }
  const key = normalizeHostname(hostname)
  const existing = sites[key]
  if (!existing) {
    return
  }
  sites[key] = {
    ...existing,
    fabPosition: position,
  }
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      sites,
    },
  })
}
