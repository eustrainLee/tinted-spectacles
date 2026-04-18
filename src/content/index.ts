import { normalizeHostname } from '../lib/normalizeHostname'
import type { ExtensionStatus } from '../lib/extensionStatus'
import { type BilibiliFeedBlockMode, STORAGE_KEY } from '../lib/storageSchema'
import { getSiteMap } from '../lib/siteSettings'
import { refreshFloatingAssistFromStorage } from './floatingAssist'
import {
  getEffectiveBilibiliDurationBlockMode,
  getEffectiveBilibiliFeedBlockMode,
  getEffectiveBilibiliLikePromoBlockMode,
  isBilibiliHomeFeedPage,
  isBilibiliHost,
  resolveHomeFeedRoot,
  runHomeFeedAdsRule,
  runHomeFeedDurationRule,
  runHomeFeedLikePromoRule,
  type HomeFeedDurationRuleConfig,
} from '../rules/bilibili'

const CLEANUP_DEBOUNCE_MS = 180
const currentHostname = normalizeHostname(window.location.hostname)

let cleanupObserver: MutationObserver | null = null
let cleanupTimer: number | null = null
let cachedBlockMode: BilibiliFeedBlockMode =
  getEffectiveBilibiliFeedBlockMode(undefined)
let cachedLikePromoMode: BilibiliFeedBlockMode =
  getEffectiveBilibiliLikePromoBlockMode(undefined)
let cachedDurationConfig: HomeFeedDurationRuleConfig = {
  mode: getEffectiveBilibiliDurationBlockMode(undefined),
  minStr: '',
  maxStr: '',
}

function clearPendingTimer(): void {
  if (cleanupTimer !== null) {
    window.clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
}

function stopCleanupObserver(): void {
  clearPendingTimer()
  if (cleanupObserver) {
    cleanupObserver.disconnect()
    cleanupObserver = null
  }
}

function runHomeFeedCleanup(root: ParentNode): void {
  try {
    const adsChanged = runHomeFeedAdsRule(root, cachedBlockMode)
    const likePromoChanged = runHomeFeedLikePromoRule(
      root,
      cachedLikePromoMode,
    )
    const durationChanged = runHomeFeedDurationRule(root, cachedDurationConfig)
    const changed = adsChanged + likePromoChanged + durationChanged
    void reportStatus(changed > 0 ? 'ok' : 'noMatch')
  } catch {
    void reportStatus('partialFailure')
  }
}

function startHomeFeedCleanupObserver(): void {
  const feedRoot = resolveHomeFeedRoot(document)
  runHomeFeedCleanup(feedRoot)

  if (cleanupObserver) {
    return
  }

  cleanupObserver = new MutationObserver(() => {
    clearPendingTimer()
    cleanupTimer = window.setTimeout(() => {
      cleanupTimer = null
      runHomeFeedCleanup(feedRoot)
    }, CLEANUP_DEBOUNCE_MS)
  })

  cleanupObserver.observe(feedRoot, {
    childList: true,
    subtree: true,
  })
}

async function reportStatus(status: ExtensionStatus): Promise<void> {
  await chrome.runtime.sendMessage({
    type: 'tinted.statusReport',
    status,
  })
}

async function refreshRuntimeFromStorage(): Promise<void> {
  if (!isBilibiliHost(currentHostname)) {
    stopCleanupObserver()
    await reportStatus('noMatch')
    return
  }

  const siteMap = await getSiteMap()
  const site = siteMap[normalizeHostname(currentHostname)]
  cachedBlockMode = getEffectiveBilibiliFeedBlockMode(site)
  cachedLikePromoMode = getEffectiveBilibiliLikePromoBlockMode(site)
  cachedDurationConfig = {
    mode: getEffectiveBilibiliDurationBlockMode(site),
    minStr: site?.bilibiliDurationMinStr ?? '',
    maxStr: site?.bilibiliDurationMaxStr ?? '',
  }

  if (site?.presetId !== 'bilibili') {
    stopCleanupObserver()
    await reportStatus('noMatch')
    return
  }

  const anyHomeFeedRuleActive =
    cachedBlockMode !== 'off' ||
    cachedLikePromoMode !== 'off' ||
    cachedDurationConfig.mode !== 'off'
  if (!anyHomeFeedRuleActive) {
    stopCleanupObserver()
    await reportStatus('noMatch')
    return
  }

  if (!isBilibiliHomeFeedPage(window.location)) {
    stopCleanupObserver()
    await reportStatus('noMatch')
    return
  }

  startHomeFeedCleanupObserver()
}

async function refreshAllFromStorage(): Promise<void> {
  await refreshRuntimeFromStorage()
  await refreshFloatingAssistFromStorage(currentHostname)
}

void (async () => {
  try {
    await refreshAllFromStorage()

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local' || !(STORAGE_KEY in changes)) {
        return
      }
      void refreshAllFromStorage()
    })
  } catch {
    await reportStatus('fatal')
  }
})()
