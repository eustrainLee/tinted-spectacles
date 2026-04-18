import {
  clampFabTopLeft,
  defaultFabTopLeft,
  snapFabTopLeftToEdges,
} from '../lib/fabLayout'
import { shouldShowFloatingAssist } from '../lib/floatingAssistPolicy'
import { normalizeHostname } from '../lib/normalizeHostname'
import { getSpectacleLabel, type SpectacleId } from '../lib/presets'
import {
  type BilibiliFeedBlockMode,
  type FabPosition,
  type SiteSettingRecord,
  isBilibiliFeedBlockMode,
} from '../lib/storageSchema'
import {
  getSiteMap,
  setBilibiliDurationBlockMode,
  setBilibiliDurationBoundStrings,
  setBilibiliFeedBlockMode,
  setBilibiliLikePromoBlockMode,
  setBilibiliPartitionRecommendBlockMode,
  setFabHidden,
  setFabPosition,
} from '../lib/siteSettings'
import {
  getEffectiveBilibiliDurationBlockMode,
  getEffectiveBilibiliFeedBlockMode,
  getEffectiveBilibiliLikePromoBlockMode,
  getEffectiveBilibiliPartitionRecommendBlockMode,
} from '../rules/bilibili'

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
let biliBlockSection: HTMLDivElement | null = null
let biliBlockSelect: HTMLSelectElement | null = null
let biliLikePromoSelect: HTMLSelectElement | null = null
let biliPartitionRecommendSelect: HTMLSelectElement | null = null
let biliDurationSelect: HTMLSelectElement | null = null
let biliDurationMinInput: HTMLInputElement | null = null
let biliDurationMaxInput: HTMLInputElement | null = null
let durationBoundsDebounceTimer: number | null = null

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

function clearDurationBoundsDebounceTimer(): void {
  if (durationBoundsDebounceTimer !== null) {
    window.clearTimeout(durationBoundsDebounceTimer)
    durationBoundsDebounceTimer = null
  }
}

function scheduleDurationBoundsSave(): void {
  clearDurationBoundsDebounceTimer()
  durationBoundsDebounceTimer = window.setTimeout(() => {
    durationBoundsDebounceTimer = null
    const key = storageHostnameKey
    if (!key || !biliDurationMinInput || !biliDurationMaxInput) {
      return
    }
    void setBilibiliDurationBoundStrings(
      key,
      biliDurationMinInput.value,
      biliDurationMaxInput.value,
    )
  }, 350)
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

function viewportCssWidth(): number {
  const vv = window.visualViewport
  if (vv && vv.width > 0) {
    return vv.width
  }
  return window.innerWidth
}

function viewportCssHeight(): number {
  const vv = window.visualViewport
  if (vv && vv.height > 0) {
    return vv.height
  }
  return window.innerHeight
}

function applyLayoutFromRecord(record: SiteSettingRecord): void {
  if (!anchorEl) {
    return
  }
  const { width, height } = getAnchorSize()
  const vw = viewportCssWidth()
  const vh = viewportCssHeight()
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

function nudgePanelWithinViewportHorizontal(vw: number): void {
  if (!panelEl) {
    return
  }
  for (let i = 0; i < 4; i += 1) {
    const r = panelEl.getBoundingClientRect()
    let delta = 0
    const maxRight = vw - VIEW_MARGIN
    if (r.right > maxRight + 0.5) {
      delta = maxRight - r.right
    } else if (r.left < VIEW_MARGIN - 0.5) {
      delta = VIEW_MARGIN - r.left
    }
    if (delta === 0) {
      return
    }
    const prev = panelEl.style.left
    const base = prev ? Number.parseFloat(prev) : r.left
    if (!Number.isFinite(base)) {
      panelEl.style.left = `${Math.round(VIEW_MARGIN)}px`
    } else {
      panelEl.style.left = `${Math.round(base + delta)}px`
    }
  }
}

function layoutPanelNearToggle(): void {
  if (!panelEl || !toggleBtn || panelEl.hidden) {
    return
  }

  const tr = toggleBtn.getBoundingClientRect()
  const vw = viewportCssWidth()
  const vh = viewportCssHeight()
  const maxUsableWidth = Math.max(120, vw - VIEW_MARGIN * 2)
  const targetWidth = Math.min(PANEL_MAX_WIDTH, maxUsableWidth)

  panelEl.style.boxSizing = 'border-box'
  panelEl.style.width = `${Math.round(targetWidth)}px`
  const layoutW = panelEl.getBoundingClientRect().width
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
  const nearRightEdge = tr.right >= vw - VIEW_MARGIN - 2
  const nearLeftEdge = tr.left <= VIEW_MARGIN + 2
  const nearLeft = tr.left <= VIEW_MARGIN + 64
  const nearRight = vw - tr.right <= VIEW_MARGIN + 96
  const inRightHalf = toggleCenterX >= vw * 0.5

  let left: number

  if (nearRightEdge) {
    left = vw - VIEW_MARGIN - layoutW
  } else if (nearLeftEdge) {
    left = VIEW_MARGIN
  } else if (inRightHalf || nearRight) {
    left = tr.right - layoutW - PANEL_GAP
  } else if (!nearRight && nearLeft) {
    left = Math.min(tr.left + tr.width + PANEL_GAP, vw - VIEW_MARGIN - layoutW)
  } else {
    left = toggleCenterX - layoutW / 2
  }

  panelEl.style.left = `${Math.round(left)}px`
  panelEl.style.top = `${Math.round(top)}px`

  nudgePanelWithinViewportHorizontal(vw)

  const rw = panelEl.getBoundingClientRect().width
  if (rw > vw - VIEW_MARGIN * 2) {
    panelEl.style.width = `${Math.round(Math.max(120, vw - VIEW_MARGIN * 2))}px`
    panelEl.style.left = `${VIEW_MARGIN}px`
    nudgePanelWithinViewportHorizontal(vw)
  }
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
  clearDurationBoundsDebounceTimer()
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
  biliBlockSection = null
  biliBlockSelect = null
  biliLikePromoSelect = null
  biliPartitionRecommendSelect = null
  biliDurationSelect = null
  biliDurationMinInput = null
  biliDurationMaxInput = null
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

function updatePanelFromRecord(hostname: string, record: SiteSettingRecord): void {
  if (!summarySiteEl || !summaryPresetEl) {
    return
  }
  summarySiteEl.textContent = hostname
  summaryPresetEl.textContent = getSpectacleLabel(record.presetId)
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-label', buildToggleAriaLabel(hostname, record.presetId))
  }
  if (
    biliBlockSection &&
    biliBlockSelect &&
    biliLikePromoSelect &&
    biliPartitionRecommendSelect &&
    biliDurationSelect &&
    biliDurationMinInput &&
    biliDurationMaxInput
  ) {
    const isBili = record.presetId === 'bilibili'
    biliBlockSection.hidden = !isBili
    if (isBili) {
      biliBlockSelect.value = getEffectiveBilibiliFeedBlockMode(record)
      biliLikePromoSelect.value =
        getEffectiveBilibiliLikePromoBlockMode(record)
      biliPartitionRecommendSelect.value =
        getEffectiveBilibiliPartitionRecommendBlockMode(record)
      biliDurationSelect.value =
        getEffectiveBilibiliDurationBlockMode(record)
      biliDurationMinInput.value = record.bilibiliDurationMinStr ?? ''
      biliDurationMaxInput.value = record.bilibiliDurationMaxStr ?? ''
    }
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
      .bili-block-select {
        border-color: #3d4450;
        background: #1e222a;
        color: #eef1f7;
      }
      .bili-block-hint {
        color: #a8b0bd;
      }
      .bili-duration-bounds input {
        border-color: #3d4450;
        background: #1e222a;
        color: #eef1f7;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .toggle,
      .btn {
        transition: none;
      }
    }
    .bili-block-wrap[hidden] {
      display: none;
    }
    .bili-block-wrap {
      margin: 0 0 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bili-block-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      line-height: 1.45;
    }
    .bili-block-row__label {
      font-weight: 700;
      flex: 0 1 auto;
      min-width: 0;
    }
    .bili-block-select {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 60%;
      box-sizing: border-box;
      border-radius: 8px;
      border: 1px solid #c9ced6;
      background: #ffffff;
      color: #1b1f24;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
    }
    .bili-block-hint {
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
      color: #5c6570;
    }
    .bili-duration-block {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bili-duration-bounds {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 0;
      width: 100%;
      box-sizing: border-box;
    }
    .bili-duration-bounds input {
      flex: 1 1 0;
      min-width: 0;
      box-sizing: border-box;
      border-radius: 6px;
      border: 1px solid #c9ced6;
      background: #ffffff;
      color: #1b1f24;
      font-size: 11px;
      padding: 3px 6px;
    }
    .bili-duration-bounds span {
      flex: 0 0 auto;
      color: #5c6570;
      font-size: 11px;
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

  biliBlockSection = document.createElement('div')
  biliBlockSection.className = 'bili-block-wrap'
  biliBlockSection.hidden = true
  const biliRow = document.createElement('div')
  biliRow.className = 'bili-block-row'
  const biliLabel = document.createElement('span')
  biliLabel.className = 'bili-block-row__label'
  biliLabel.textContent = '\u5c4f\u853d\u5e7f\u544a'
  biliBlockSelect = document.createElement('select')
  biliBlockSelect.className = 'bili-block-select'
  biliBlockSelect.setAttribute('aria-label', 'Bilibili ad block mode')
  const biliModeOptions: [BilibiliFeedBlockMode, string][] = [
    ['off', '\u5173\u95ed'],
    ['remove', '\u79fb\u9664'],
    ['clear', '\u6e05\u7a7a'],
    ['mark', '\u6807\u8bb0'],
  ]
  for (const [val, text] of biliModeOptions) {
    const opt = document.createElement('option')
    opt.value = val
    opt.textContent = text
    biliBlockSelect.append(opt)
  }
  const biliHint = document.createElement('p')
  biliHint.className = 'bili-block-hint'
  biliHint.textContent = '\u4ec5\u9996\u9875\u0020\u002f\u0020\u751f\u6548'
  biliRow.append(biliLabel, biliBlockSelect)
  biliBlockSelect.addEventListener(
    'change',
    () => {
      const v = biliBlockSelect?.value
      if (v && isBilibiliFeedBlockMode(v)) {
        void setBilibiliFeedBlockMode(hostname, v)
      }
    },
    { signal },
  )

  const biliLikePromoRow = document.createElement('div')
  biliLikePromoRow.className = 'bili-block-row'
  const biliLikePromoLabel = document.createElement('span')
  biliLikePromoLabel.className = 'bili-block-row__label'
  biliLikePromoLabel.textContent = '\u5c4f\u853d\u70b9\u8d5e\u63a8\u5e7f'
  biliLikePromoSelect = document.createElement('select')
  biliLikePromoSelect.className = 'bili-block-select'
  biliLikePromoSelect.setAttribute(
    'aria-label',
    'Bilibili like-promo block mode',
  )
  for (const [val, text] of biliModeOptions) {
    const opt = document.createElement('option')
    opt.value = val
    opt.textContent = text
    biliLikePromoSelect.append(opt)
  }
  biliLikePromoRow.append(biliLikePromoLabel, biliLikePromoSelect)
  biliLikePromoSelect.addEventListener(
    'change',
    () => {
      const v = biliLikePromoSelect?.value
      if (v && isBilibiliFeedBlockMode(v)) {
        void setBilibiliLikePromoBlockMode(hostname, v)
      }
    },
    { signal },
  )

  const biliPartitionRecommendRow = document.createElement('div')
  biliPartitionRecommendRow.className = 'bili-block-row'
  const biliPartitionRecommendLabel = document.createElement('span')
  biliPartitionRecommendLabel.className = 'bili-block-row__label'
  biliPartitionRecommendLabel.textContent =
    '\u5c4f\u853d\u5206\u533a\u63a8\u8350'
  biliPartitionRecommendSelect = document.createElement('select')
  biliPartitionRecommendSelect.className = 'bili-block-select'
  biliPartitionRecommendSelect.setAttribute(
    'aria-label',
    'Bilibili partition-recommend block mode',
  )
  for (const [val, text] of biliModeOptions) {
    const opt = document.createElement('option')
    opt.value = val
    opt.textContent = text
    biliPartitionRecommendSelect.append(opt)
  }
  biliPartitionRecommendRow.append(
    biliPartitionRecommendLabel,
    biliPartitionRecommendSelect,
  )
  biliPartitionRecommendSelect.addEventListener(
    'change',
    () => {
      const v = biliPartitionRecommendSelect?.value
      if (v && isBilibiliFeedBlockMode(v)) {
        void setBilibiliPartitionRecommendBlockMode(hostname, v)
      }
    },
    { signal },
  )

  const biliDurationBlock = document.createElement('div')
  biliDurationBlock.className = 'bili-duration-block'
  const biliDurationRow = document.createElement('div')
  biliDurationRow.className = 'bili-block-row'
  const biliDurationLabel = document.createElement('span')
  biliDurationLabel.className = 'bili-block-row__label'
  biliDurationLabel.textContent = '\u89c6\u9891\u65f6\u957f'
  biliDurationSelect = document.createElement('select')
  biliDurationSelect.className = 'bili-block-select'
  biliDurationSelect.setAttribute(
    'aria-label',
    'Bilibili video duration filter mode',
  )
  for (const [val, text] of biliModeOptions) {
    const opt = document.createElement('option')
    opt.value = val
    opt.textContent = text
    biliDurationSelect.append(opt)
  }
  biliDurationRow.append(biliDurationLabel, biliDurationSelect)
  const boundsRow = document.createElement('div')
  boundsRow.className = 'bili-duration-bounds'
  biliDurationMinInput = document.createElement('input')
  biliDurationMinInput.type = 'text'
  biliDurationMinInput.autocomplete = 'off'
  biliDurationMinInput.placeholder = 'M:SS or H:MM:SS'
  biliDurationMinInput.setAttribute('aria-label', 'Minimum video duration')
  const dashSep = document.createElement('span')
  dashSep.textContent = '-'
  biliDurationMaxInput = document.createElement('input')
  biliDurationMaxInput.type = 'text'
  biliDurationMaxInput.autocomplete = 'off'
  biliDurationMaxInput.placeholder = 'M:SS or H:MM:SS'
  biliDurationMaxInput.setAttribute('aria-label', 'Maximum video duration')
  boundsRow.append(biliDurationMinInput, dashSep, biliDurationMaxInput)
  biliDurationBlock.append(biliDurationRow, boundsRow)
  biliDurationSelect.addEventListener(
    'change',
    () => {
      const v = biliDurationSelect?.value
      if (v && isBilibiliFeedBlockMode(v)) {
        void setBilibiliDurationBlockMode(hostname, v)
      }
    },
    { signal },
  )
  const onBoundsInput = (): void => {
    scheduleDurationBoundsSave()
  }
  biliDurationMinInput.addEventListener('input', onBoundsInput, { signal })
  biliDurationMaxInput.addEventListener('input', onBoundsInput, { signal })

  biliBlockSection.append(
    biliRow,
    biliLikePromoRow,
    biliPartitionRecommendRow,
    biliDurationBlock,
    biliHint,
  )

  panelEl.append(rowSite, rowPreset, biliBlockSection, actions)

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
        viewportCssWidth(),
        viewportCssHeight(),
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
        viewportCssWidth(),
        viewportCssHeight(),
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
        viewportCssWidth(),
        viewportCssHeight(),
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
  const visualViewport = window.visualViewport
  if (visualViewport) {
    visualViewport.addEventListener('resize', scheduleResizeClamp, { signal })
    visualViewport.addEventListener('scroll', scheduleResizeClamp, { signal })
  }

  updatePanelFromRecord(hostname, record)
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

    updatePanelFromRecord(key, record)
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
