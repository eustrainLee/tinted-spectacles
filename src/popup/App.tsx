import { useCallback, useEffect, useState } from 'react'
import { STATUS_INFO, type ExtensionStatus } from '../lib/extensionStatus'
import { SPECTACLES, type SpectacleId, isSpectacleId } from '../lib/presets'
import { normalizeHostname } from '../lib/normalizeHostname'
import { clearSiteSpectacle, getSiteMap, setSiteSpectacle } from '../lib/siteSettings'

function iconUrl(path: string): string {
  return chrome.runtime.getURL(path)
}

function hostnameFromTab(tab: chrome.tabs.Tab): string | null {
  if (!tab.url) return null
  try {
    const u = new URL(tab.url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.hostname
  } catch {
    return null
  }
}

export function App() {
  const [hostname, setHostname] = useState<string | null>(null)
  const [tabHint, setTabHint] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<SpectacleId>('none')
  const [fabEnabled, setFabEnabled] = useState(true)
  const [savedId, setSavedId] = useState<SpectacleId>('none')
  const [savedFabEnabled, setSavedFabEnabled] = useState(true)
  const [applyState, setApplyState] = useState<'idle' | 'busy' | 'ok' | 'err'>(
    'idle',
  )
  const [runtimeStatus, setRuntimeStatus] = useState<ExtensionStatus>('noMatch')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
        if (cancelled || !tab) return
        const host = hostnameFromTab(tab)
        if (!host) {
          setHostname(null)
          setTabHint('Open a normal webpage (http/https) to attach a preset.')
          return
        }
        setHostname(host)
        setTabHint(null)
        const map = await getSiteMap()
        const normalizedHost = normalizeHostname(host)
        const raw = map[normalizedHost]
        const next: SpectacleId = raw?.presetId && isSpectacleId(raw.presetId) ? raw.presetId : 'none'
        setSelectedId(next)
        setSavedId(next)
        const nextFabEnabled = raw?.fabEnabled ?? true
        setFabEnabled(nextFabEnabled)
        setSavedFabEnabled(nextFabEnabled)
        if (typeof tab.id === 'number') {
          const response = (await chrome.runtime.sendMessage({
            type: 'tinted.statusQuery',
            tabId: tab.id,
          })) as { status?: ExtensionStatus } | undefined
          if (response?.status && response.status in STATUS_INFO) {
            setRuntimeStatus(response.status)
          }
        }
      } catch {
        if (!cancelled) {
          setHostname(null)
          setTabHint('Could not read the active tab.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const onApply = useCallback(async () => {
    if (!hostname) return
    setApplyState('busy')
    try {
      await setSiteSpectacle(hostname, selectedId, fabEnabled)
      setSavedId(selectedId)
      setSavedFabEnabled(fabEnabled)
      setApplyState('ok')
      window.setTimeout(() => setApplyState('idle'), 1600)
    } catch {
      setApplyState('err')
      window.setTimeout(() => setApplyState('idle'), 2200)
    }
  }, [fabEnabled, hostname, selectedId])

  const onClear = useCallback(async () => {
    if (!hostname) return
    setApplyState('busy')
    try {
      await clearSiteSpectacle(hostname)
      setSelectedId('none')
      setSavedId('none')
      setFabEnabled(true)
      setSavedFabEnabled(true)
      setApplyState('ok')
      window.setTimeout(() => setApplyState('idle'), 1600)
    } catch {
      setApplyState('err')
      window.setTimeout(() => setApplyState('idle'), 2200)
    }
  }, [hostname])

  const dirty =
    hostname !== null &&
    (selectedId !== savedId || fabEnabled !== savedFabEnabled)

  return (
    <main className="panel">
      <header className="panel__header">
        <img
          className="panel__logo"
          src={iconUrl('icons/icon-128.png')}
          width={36}
          height={36}
          alt=""
        />
        <div className="panel__brand">
          <h1 className="panel__title">Tinted Spectacles</h1>
          <p className="panel__subtitle">Pick a preset for this site</p>
        </div>
      </header>

      <section className="panel__section" aria-label="Current site">
        <div className="panel__label">This site</div>
        {hostname ? (
          <div className="panel__host" title={hostname}>
            {hostname}
          </div>
        ) : (
          <div className="panel__host panel__host--muted">{tabHint}</div>
        )}
      </section>

      <section className="panel__section" aria-label="Spectacle preset">
        <label className="panel__label" htmlFor="spectacle-select">
          Spectacle
        </label>
        <select
          id="spectacle-select"
          className="panel__select"
          value={selectedId}
          disabled={!hostname}
          onChange={(e) => setSelectedId(e.target.value as SpectacleId)}
        >
          {SPECTACLES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="panel__hint">
          {SPECTACLES.find((p) => p.id === selectedId)?.hint}
        </p>
      </section>

      <section className="panel__section" aria-label="Floating assist">
        <label className="panel__check">
          <input
            type="checkbox"
            checked={fabEnabled}
            disabled={!hostname || applyState === 'busy'}
            onChange={(e) => setFabEnabled(e.target.checked)}
          />
          <span>Enable floating assist on this site</span>
        </label>
        <p className="panel__hint">Enabled by default. You can turn it off anytime.</p>
      </section>

      <section className="panel__section" aria-live="polite">
        <div className="panel__label">Status</div>
        <p className="panel__hint">{STATUS_INFO[runtimeStatus].message}</p>
      </section>

      <div className="panel__actions">
        <button
          type="button"
          className="panel__btn panel__btn--primary"
          disabled={!hostname || applyState === 'busy'}
          onClick={() => void onApply()}
        >
          {applyState === 'busy' ? 'Saving…' : 'Apply to this site'}
        </button>
        <button
          type="button"
          className="panel__btn panel__btn--ghost"
          disabled={!hostname || applyState === 'busy'}
          onClick={() => void onClear()}
        >
          Clear site setting
        </button>
        {dirty && hostname ? (
          <span className="panel__badge">Unsaved changes</span>
        ) : null}
        {applyState === 'ok' ? (
          <span className="panel__badge panel__badge--ok">Saved</span>
        ) : null}
        {applyState === 'err' ? (
          <span className="panel__badge panel__badge--err">Save failed</span>
        ) : null}
      </div>
    </main>
  )
}
