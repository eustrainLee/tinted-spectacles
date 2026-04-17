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

let fabHost: HTMLElement | null = null
let shadowRoot: ShadowRoot | null = null
let wrapEl: HTMLElement | null = null
let summarySiteEl: HTMLElement | null = null
let summaryPresetEl: HTMLElement | null = null
let panelEl: HTMLElement | null = null
let toggleBtn: HTMLButtonElement | null = null
let mountAbort: AbortController | null = null
let resizeTimer: number | null = null

let storageHostnameKey = ''
let wrapLeft = 0
let wrapTop = 0

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

function setWrapPosition(left: number, top: number): void {
  if (!wrapEl) {
    return
  }
  wrapLeft = left
  wrapTop = top
  wrapEl.style.left = `${Math.round(left)}px`
  wrapEl.style.top = `${Math.round(top)}px`
}

function applyLayoutFromRecord(record: SiteSettingRecord): void {
  if (!wrapEl) {
    return
  }
  const width = wrapEl.offsetWidth
  const height = wrapEl.offsetHeight
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
    setWrapPosition(clamped.left, clamped.top)
    return
  }
  const defaults = defaultFabTopLeft(width, height, vw, vh)
  setWrapPosition(defaults.left, defaults.top)
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
  wrapEl = null
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
    .wrap {
      position: fixed;
      left: 0;
      top: 0;
      right: auto;
      bottom: auto;
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
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
      width: min(280px, calc(100vw - 32px));
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

  const wrap = document.createElement('div')
  wrap.className = 'wrap'
  wrapEl = wrap

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
      if (event.button !== 0 || !wrapEl) {
        return
      }
      dragPointerId = event.pointerId
      dragStartClientX = event.clientX
      dragStartClientY = event.clientY
      dragOriginLeft = wrapLeft
      dragOriginTop = wrapTop
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
      if (dragPointerId !== event.pointerId || !wrapEl) {
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
      const width = wrapEl.offsetWidth
      const height = wrapEl.offsetHeight
      const next = clampFabTopLeft(
        dragOriginLeft + dx,
        dragOriginTop + dy,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      setWrapPosition(next.left, next.top)
    },
    { signal },
  )

  const finishDrag = (event: PointerEvent): void => {
    if (dragPointerId !== event.pointerId || !wrapEl) {
      return
    }
    try {
      toggleBtn?.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    if (dragActive) {
      const width = wrapEl.offsetWidth
      const height = wrapEl.offsetHeight
      const snapped = snapFabTopLeftToEdges(
        wrapLeft,
        wrapTop,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      setWrapPosition(snapped.left, snapped.top)
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

  wrap.append(toggleBtn, panelEl)
  shadowRoot.append(wrap)

  const escapeHandler = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !panelEl || panelEl.hidden) {
      return
    }
    setPanelOpen(false)
  }
  window.addEventListener('keydown', escapeHandler, { signal })

  const scheduleResizeClamp = (): void => {
    clearResizeTimer()
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null
      if (!wrapEl) {
        return
      }
      const width = wrapEl.offsetWidth
      const height = wrapEl.offsetHeight
      const clamped = clampFabTopLeft(
        wrapLeft,
        wrapTop,
        width,
        height,
        window.innerWidth,
        window.innerHeight,
      )
      if (clamped.left !== wrapLeft || clamped.top !== wrapTop) {
        setWrapPosition(clamped.left, clamped.top)
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
      !positionEquals(record.fabPosition, { left: wrapLeft, top: wrapTop })
    ) {
      applyLayoutFromRecord(record)
    }
  } catch {
    unmountFloatingAssist()
  }
}
