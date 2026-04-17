import { shouldShowFloatingAssist } from '../lib/floatingAssistPolicy'
import { normalizeHostname } from '../lib/normalizeHostname'
import { getSpectacleLabel, type SpectacleId } from '../lib/presets'
import { getSiteMap, setFabHidden } from '../lib/siteSettings'

const HOST_ID = 'tinted-spectacles-fab-host'

let fabHost: HTMLElement | null = null
let shadowRoot: ShadowRoot | null = null
let summarySiteEl: HTMLElement | null = null
let summaryPresetEl: HTMLElement | null = null
let panelEl: HTMLElement | null = null
let toggleBtn: HTMLButtonElement | null = null
let escapeHandler: ((event: KeyboardEvent) => void) | null = null

function buildToggleAriaLabel(hostname: string, presetId: SpectacleId): string {
  const presetLabel = getSpectacleLabel(presetId)
  return `Tinted Spectacles assist for ${hostname}, preset ${presetLabel}. Opens a short summary panel.`
}

function unmountFloatingAssist(): void {
  if (escapeHandler) {
    window.removeEventListener('keydown', escapeHandler)
    escapeHandler = null
  }
  if (fabHost) {
    fabHost.remove()
  }
  fabHost = null
  shadowRoot = null
  summarySiteEl = null
  summaryPresetEl = null
  panelEl = null
  toggleBtn = null
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

function mountFloatingAssist(hostname: string, presetId: SpectacleId): void {
  if (fabHost) {
    return
  }

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
      right: 16px;
      bottom: 16px;
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
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
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

  toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'toggle'
  toggleBtn.textContent = 'TS'
  toggleBtn.setAttribute('aria-label', buildToggleAriaLabel(hostname, presetId))
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
  hideBtn.addEventListener('click', () => {
    void (async () => {
      await setFabHidden(hostname, true)
      unmountFloatingAssist()
    })()
  })

  actions.append(hideBtn)
  panelEl.append(rowSite, rowPreset, actions)

  toggleBtn.addEventListener('click', () => {
    if (!panelEl) {
      return
    }
    setPanelOpen(panelEl.hidden)
  })

  wrap.append(toggleBtn, panelEl)
  shadowRoot.append(wrap)

  escapeHandler = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !panelEl || panelEl.hidden) {
      return
    }
    setPanelOpen(false)
  }
  window.addEventListener('keydown', escapeHandler)

  updateSummary(hostname, presetId)
  setPanelOpen(false)
}

export async function refreshFloatingAssistFromStorage(
  pageHostname: string,
): Promise<void> {
  try {
    const key = normalizeHostname(pageHostname)
    const map = await getSiteMap()
    const record = map[key]
    if (!shouldShowFloatingAssist(record)) {
      unmountFloatingAssist()
      return
    }

    if (!fabHost) {
      mountFloatingAssist(key, record.presetId)
      return
    }

    updateSummary(key, record.presetId)
  } catch {
    unmountFloatingAssist()
  }
}
