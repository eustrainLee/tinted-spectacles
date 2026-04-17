import {
  clampFabTopLeft,
  defaultFabTopLeft,
  snapFabTopLeftToEdges,
} from '../lib/fabLayout'
import { shouldShowFloatingAssist } from '../lib/floatingAssistPolicy'
import { normalizeHostname } from '../lib/normalizeHostname'
import { getSpectacleLabel, type SpectacleId } from '../lib/presets'
import type { FabPosition, SiteSettingRecord } from '../lib/storageSchema'
import { getSiteMap, setFabHidden, setFabPosition } from '../lib/siteSettings'

const HOST_ID = 'tinted-spectacles-fab-host'
const DRAG_THRESHOLD_PX = 6
const VIEW_MARGIN = 16
const PANEL_GAP = 8
const PANEL_MAX_WIDTH = 280

let fabHost: HTMLElement | null = null
let shadowRoot: ShadowRoot | null = null
let anchorEl: HTMLElement | null = null
let summarySiteEl: HTMLElement | null = null
let summaryPresetEl: HTMLElement | null = null
let panelEl: HTMLElement | null = null
let toggleBtn: HTMLButtonElement | null = null
let mountAbort: AbortController | null = null
let resizeTimer: number | null = null

let storageHostnameKey = ''
let anchorLeft = 0
let anchorTop = 0

function positionEquals(a: FabPosition | undefined, b: FabPosition): boolean {
  if (!a) {
    return false
  }
  return a.left === b.left && a.top === b.top
}

function clearResizeTimer(): void {
  if (resizeTimer !== null) {
    window.clearTimeout(resizeTimer)
    resizeTimer = null
  }
}

function buildToggleAriaLabel(hostname: string, presetId: SpectacleId): string {
  const presetLabel = getSpectacleLabel(presetId)
  return `Tinted Spectacles assist for ${hostname}, preset ${presetLabel}. Drag to move. Opens a short summary panel.`
}

function getAnchorSize(): { width: number; height: number } {
  if (toggleBtn) {
    return { width: toggleBtn.offsetWidth, height: toggleBtn.offsetHeight }
  }
  return { width: 44, height: 44 }
}

function setAnchorPosition(left: number, top: number): void {
  if (!anchorEl) {
    return
  }
  anchorLeft = left
  anchorTop = top
  anchorEl.style.left = `${Math.round(left)}px`
  anchorEl.style.top = `${Math.round(top)}px`
}

function applyLayoutFromRecord(record: SiteSettingRecord): void {
  if (!anchorEl) {
    return
  }
  const { width, height } = getAnchorSize()
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (record.fabPosition) {
    const clamped = clampFabTopLeft(
      record.fabPosition.left,
      record.fabPosition.top,
      width,
      height,
      vw,
      vh,
    )
    setAnchorPosition(clamped.left, clamped.top)
    return
  }
  const defaults = defaultFabTopLeft(width, height, vw, vh)
  setAnchorPosition(defaults.left, defaults.top)
}

function layoutPanelNearToggle(): void {
  if (!panelEl || !toggleBtn || panelEl.hidden) {
    return
  }

  const tr = toggleBtn.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const panelWidth = Math.min(PANEL_MAX_WIDTH, vw - VIEW_MARGIN * 2)

  panelEl.style.width = `${Math.round(panelWidth)}px`
  const panelHeight = panelEl.offsetHeight

  const spaceBelow = vh - tr.bottom - VIEW_MARGIN
  const spaceAbove = tr.top - VIEW_MARGIN
  let top: number
  if (spaceBelow >= panelHeight + PANEL_GAP || spaceBelow >= spaceAbove) {
    top = tr.bottom + PANEL_GAP
  } else {
    top = tr.top - panelHeight - PANEL_GAP
  }
  top = Math.min(
    Math.max(VIEW_MARGIN, top),
    Math.max(VIEW_MARGIN, vh - VIEW_MARGIN - panelHeight),
  )

  const toggleCenterX = tr.left + tr.width / 2
  let left = toggleCenterX - panelWidth / 2

  const nearRight = vw - tr.right <= VIEW_MARGIN + 48
  const nearLeft = tr.left <= VIEW_MARGIN + 48
  if (nearRight && !nearLeft) {
    left = Math.min(tr.right, vw - VIEW_MARGIN) - panelWidth
  } else if (nearLeft && !nearRight) {
    left = Math.max(tr.left - panelWidth, VIEW_MARGIN)
  }

  left = Math.min(
    Math.max(VIEW_MARGIN, left),
    Math.max(VIEW_MARGIN, vw - VIEW_MARGIN - panelWidth),
  )

  panelEl.style.left = `${Math.round(left)}px`
  panelEl.style.top = `${Math.round(top)}px`
}

function isEventInsideFabUi(event: PointerEvent): boolean {
  if (!fabHost) {
    return false
  }
  return event.composedPath().some((node) => {
    return (
      node === fabHost ||
      node === anchorEl ||
      node === toggleBtn ||
      node === panelEl
    )
  })
}

function unmountFloatingAssist(): void {
  clearResizeTimer()
  if (mountAbort) {
    mountAbort.abort()
    mountAbort = null
  }
  if (fabHost) {
    fabHost.remove()
  }
  fabHost = null
  shadowRoot = null
  anchorEl = null
  summarySiteEl = null
  summaryPresetEl = null
  panelEl = null
  toggleBtn = null
  storageHostnameKey = ''
}

function setPanelOpen(open: boolean): void {
  if (!panelEl || !toggleBtn) {
    return
  }
  panelEl.hidden = !open
  toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
  if (open) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        layoutPanelNearToggle()
      })
    })
  }
}

function updateSummary(hostname: string, presetId: SpectacleId): void {
  if (!summarySiteEl || !summaryPresetEl) {
    return
  }
  summarySiteEl.textContent = hostname
  summaryPresetEl.textContent = getSpectacleLabel(presetId)
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-label', buildToggleAriaLabel(hostname, presetId))
  }
}

function mountFloatingAssist(hostname: string, record: SiteSettingRecord): void {
  if (fabHost) {
    return
  }

  storageHostnameKey = hostname
  mountAbort = new AbortController()
  const signal = mountAbort.signal

  fabHost = document.createElement('div')
  fabHost.id = HOST_ID
  document.body.append(fabHost)

  shadowRoot = fabHost.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = `
    :host {
      all: initial;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    }
    .anchor {
      position: fixed;
      left: 0;
      top: 0;
      right: auto;
      bottom: auto;
      z-index: 2147483646;
      display: inline-block;
      overflow: visible;
    }
    .toggle {
      min-width: 44px;
      min-height: 44px;
      border-radius: 12px;
      border: 1px solid #c9ced6;
      background: #f4f6fb;
      color: #1b1f24;
      font-size: 13px;
      font-weight: 700;
      cursor: grab;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
      touch-action: none;
      user-select: none;
    }
    .toggle:active {
      cursor: grabbing;
    }
    .toggle:focus-visible {
      outline: 2px solid #6d4aff;
      outline-offset: 2px;
    }
    .panel {
      position: fixed;
      z-index: 2147483647;
      width: min(${PANEL_MAX_WIDTH}px, calc(100vw - ${VIEW_MARGIN * 2}px));
      padding: 10px 10px 8px;
      border-radius: 12px;
      border: 1px solid #c9ced6;
      background: #ffffff;
      color: #1b1f24;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
    }
    .panel[hidden] {
      display: none;
    }
    .row {
      margin: 0 0 6px;
      font-size: 12px;
      line-height: 1.45;
    }
    .label {
      font-weight: 700;
      margin-right: 6px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 6px;
    }
    .btn {
      border-radius: 10px;
      border: 1px solid #c9ced6;
      background: #ffffff;
      color: #1b1f24;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      cursor: pointer;
    }
    .btn--danger {
      border-color: #d9a3ab;
      background: #fff5f6;
    }
    .btn:focus-visible {
      outline: 2px solid #6d4aff;
      outline-offset: 2px;
    }
    @media (prefers-color-scheme: dark) {
      .toggle {
        border-color: #3d4450;
        background: #1e222a;
        color: #eef1f7;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
      }
      .panel {
        border-color: #3d4450;
        background: #1e222a;
        color: #eef1f7;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
      }
      .btn {
        border-color: #3d4450;
        background: #1e222a;
        color: #eef1f7;
      }
      .btn--danger {
        border-color: #7a3d48;
        background: #2a1a1d;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toggle,
      .btn {
        transition: none;
      }
    }
  `
  shadowRoot.append(style)

  anchorEl = document.createElement('div')
  anchorEl.className = 'anchor'

  toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'toggle'
  toggleBtn.textContent = 'TS'
  toggleBtn.setAttribute('aria-label', buildToggleAriaLabel(hostname, record.presetId))
  toggleBtn.setAttribute('aria-haspopup', 'true')
  toggleBtn.setAttribute('aria-expanded', 'false')

  panelEl = document.createElement('div')
  panelEl.className = 'panel'
  panelEl.hidden = true
  panelEl.setAttribute('role', 'region')
  panelEl.setAttribute('aria-label', 'Tinted Spectacles summary')

  const rowSite = document.createElement('p')
  rowSite.className = 'row'
  const siteLabel = document.createElement('span')
  siteLabel.className = 'label'
  siteLabel.textContent = 'Site'
  summarySiteEl = document.createElement('span')
  rowSite.append(siteLabel, summarySiteEl)

  const rowPreset = document.createElement('p')
  rowPreset.className = 'row'
  const presetLabel = document.createElement('span')
  presetLabel.className = 'label'
  presetLabel.textContent = 'Preset'
  summaryPresetEl = document.createElement('span')
  rowPreset.append(presetLabel, summaryPresetEl)

  const actions = document.createElement('div')
  actions.className = 'actions'

  const hideBtn = document.createElement('button')
  hideBtn.type = 'button'
  hideBtn.className = 'btn btn--danger'
  hideBtn.textContent = 'Hide assist'
  hideBtn.addEventListener(
    'click',
    () => {
      void (async () => {
        await setFabHidden(hostname, true)
        unmountFloatingAssist()
      })()
    },
    { signal },
  )

  actions.append(hideBtn)
  panelEl.append(rowSite, rowPreset, actions)

  let dragPointerId: number | null = null
  let dragStartClientX = 0
  let dragStartClientY = 0
  let dragOriginLeft = 0
  let dragOriginTop = 0
  let dragActive = false
  let suppressNextClick = false

  toggleBtn.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || !anchorEl) {
        return
      }
      dragPointerId = event.pointerId
      dragStartClientX = event.clientX
      dragStartClientY = event.clientY
      dragOriginLeft = anchorLeft
      dragOriginTop = anchorTop
      dragActive = false
      try {
        toggleBtn?.setPointerCapture(event.pointerId)
      } catch {
        dragPointerId = null
      }
    },
    { signal },
  )

  toggleBtn.addEventListener(
    'pointermove',
    (event) => {
      if (dragPointerId !== event.pointerId || !anchorEl) {
        return
      }
      const dx = event.clientX - dragStartClientX
      const dy = event.clientY - dragStartClientY
      if (!dragActive) {
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return
        }
        dragActive = true
        setPanelOpen(false)
      }
      const { width, height } = getAnchorSize()
      const next = clampFabTopLeft(
        dragOriginLeft + dx,
        dragOriginTop + dy,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      setAnchorPosition(next.left, next.top)
    },
    { signal },
  )

  const finishDrag = (event: PointerEvent): void => {
    if (dragPointerId !== event.pointerId || !anchorEl) {
      return
    }
    try {
      toggleBtn?.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    if (dragActive) {
      const { width, height } = getAnchorSize()
      const snapped = snapFabTopLeftToEdges(
        anchorLeft,
        anchorTop,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      setAnchorPosition(snapped.left, snapped.top)
      suppressNextClick = true
      void setFabPosition(storageHostnameKey, snapped)
    }
    dragPointerId = null
    dragActive = false
  }

  toggleBtn.addEventListener('pointerup', finishDrag, { signal })
  toggleBtn.addEventListener('pointercancel', finishDrag, { signal })

  toggleBtn.addEventListener(
    'click',
    (event) => {
      if (suppressNextClick) {
        event.preventDefault()
        event.stopImmediatePropagation()
        suppressNextClick = false
        return
      }
      if (!panelEl) {
        return
      }
      setPanelOpen(panelEl.hidden)
    },
    { signal },
  )

  anchorEl.append(toggleBtn)
  shadowRoot.append(anchorEl, panelEl)

  const escapeHandler = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !panelEl || panelEl.hidden) {
      return
    }
    setPanelOpen(false)
  }
  window.addEventListener('keydown', escapeHandler, { signal })

  const onOutsidePointerDown = (event: PointerEvent): void => {
    if (!panelEl || panelEl.hidden) {
      return
    }
    if (isEventInsideFabUi(event)) {
      return
    }
    setPanelOpen(false)
  }
  window.addEventListener('pointerdown', onOutsidePointerDown, {
    capture: true,
    signal,
  })

  const scheduleResizeClamp = (): void => {
    clearResizeTimer()
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null
      if (!anchorEl) {
        return
      }
      const { width, height } = getAnchorSize()
      const clamped = clampFabTopLeft(
        anchorLeft,
        anchorTop,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      if (clamped.left !== anchorLeft || clamped.top !== anchorTop) {
        setAnchorPosition(clamped.left, clamped.top)
      }
      if (panelEl && !panelEl.hidden) {
        layoutPanelNearToggle()
      }
    }, 120)
  }

  window.addEventListener('resize', scheduleResizeClamp, { signal })

  updateSummary(hostname, record.presetId)
  setPanelOpen(false)

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      applyLayoutFromRecord(record)
    })
  })
}

export async function refreshFloatingAssistFromStorage(
  pageHostname: string,
): Promise<void> {
  try {
    const key = normalizeHostname(pageHostname)
    const map = await getSiteMap()
    const record = map[key]
    if (!record || !shouldShowFloatingAssist(record)) {
      unmountFloatingAssist()
      return
    }

    if (!fabHost) {
      mountFloatingAssist(key, record)
      return
    }

    updateSummary(key, record.presetId)
    if (
      record.fabPosition &&
      !positionEquals(record.fabPosition, { left: anchorLeft, top: anchorTop })
    ) {
      applyLayoutFromRecord(record)
    }
    if (panelEl && !panelEl.hidden) {
      layoutPanelNearToggle()
    }
  } catch {
    unmountFloatingAssist()
  }
}
