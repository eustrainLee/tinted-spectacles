import { normalizeHostname } from '../lib/normalizeHostname'
import type { ExtensionStatus } from '../lib/extensionStatus'
import { STORAGE_KEY } from '../lib/storageSchema'
import { getSiteMap } from '../lib/siteSettings'
import { refreshFloatingAssistFromStorage } from './floatingAssist'
import { runBilibiliFeedCleanup, resolveBilibiliFeedRoot } from '../rules/bilibili/feedCleanup'
import { BILIBILI_HOST_SUFFIX } from '../rules/bilibili/selectors'

const CLEANUP_DEBOUNCE_MS = 180
const currentHostname = normalizeHostname(window.location.hostname)

let cleanupObserver: MutationObserver | null = null
let cleanupTimer: number | null = null

function isBilibiliHost(hostname: string): boolean {
  return (
    hostname === BILIBILI_HOST_SUFFIX ||
    hostname.endsWith(`.${BILIBILI_HOST_SUFFIX}`)
  )
}

async function shouldEnableBilibili(hostname: string): Promise<boolean> {
  const siteMap = await getSiteMap()
  const siteSetting = siteMap[normalizeHostname(hostname)]
  return siteSetting?.presetId === 'bilibili'
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

function runCleanup(root: ParentNode): void {
  try {
    const removedCount = runBilibiliFeedCleanup(root)
    void reportStatus(removedCount > 0 ? 'ok' : 'noMatch')
  } catch {
    void reportStatus('partialFailure')
  }
}

function startCleanupObserver(): void {
  if (cleanupObserver) {
    return
  }

  const feedRoot = resolveBilibiliFeedRoot(document)
  runCleanup(feedRoot)

  cleanupObserver = new MutationObserver(() => {
    clearPendingTimer()
    cleanupTimer = window.setTimeout(() => {
      cleanupTimer = null
      runCleanup(feedRoot)
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

  if (!(await shouldEnableBilibili(currentHostname))) {
    stopCleanupObserver()
    await reportStatus('noMatch')
    return
  }

  startCleanupObserver()
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
