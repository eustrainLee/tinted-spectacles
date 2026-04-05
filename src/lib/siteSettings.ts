const STORAGE_KEY = 'siteSpectacleMap'

export async function getSiteMap(): Promise<Record<string, string>> {
  const data = await chrome.storage.local.get(STORAGE_KEY)
  const raw = data[STORAGE_KEY]
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, string>) }
  }
  return {}
}

export async function setSiteSpectacle(
  hostname: string,
  spectacleId: string,
): Promise<void> {
  const map = await getSiteMap()
  if (spectacleId === 'none') {
    delete map[hostname]
  } else {
    map[hostname] = spectacleId
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: map })
}
