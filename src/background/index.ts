import {
  STATUS_INFO,
  isStatusQueryMessage,
  isStatusReportMessage,
  type ExtensionStatus,
} from '../lib/extensionStatus'

const tabStatusMap = new Map<number, ExtensionStatus>()

async function applyActionStatus(
  tabId: number,
  status: ExtensionStatus,
): Promise<void> {
  tabStatusMap.set(tabId, status)
  const info = STATUS_INFO[status]
  await chrome.action.setBadgeText({
    tabId,
    text: info.shortLabel,
  })
  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: '#2D2D34',
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isStatusReportMessage(message)) {
    const senderTabId = sender.tab?.id
    const tabId = message.tabId ?? senderTabId
    if (typeof tabId !== 'number') {
      return false
    }
    void applyActionStatus(tabId, message.status)
    return false
  }

  if (isStatusQueryMessage(message)) {
    const current = tabStatusMap.get(message.tabId) ?? 'noMatch'
    sendResponse({
      status: current,
    })
    return true
  }

  return false
})

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStatusMap.delete(tabId)
})
