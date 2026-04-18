import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'

/** Set on feed-card nodes after a block op (clear/mark) so we do not re-process. */
export const BLOCK_HANDLED_ATTR = 'data-tinted-bilibili-block'

export function isBlockHandledSubtree(node: Element): boolean {
  return node.closest(`[${BLOCK_HANDLED_ATTR}]`) !== null
}

/** In-page label for mark mode (\u5e7f\u544a). */
const BLOCK_MARK_LABEL = '\u5e7f\u544a'

/**
 * Prefer the outer grid cell. When both exist (`feed-card` > `bili-feed-card`),
 * `closest('.feed-card, .bili-feed-card')` would hit the inner wrapper first and
 * `remove()` would leave an empty `feed-card`; so try `.feed-card` first.
 */
export function resolveBilibiliBlockTarget(node: Element): Element {
  const feedCard = node.closest('.feed-card')
  if (feedCard) {
    return feedCard
  }
  const legacyCell = node.closest('.bili-feed-card')
  if (legacyCell) {
    return legacyCell
  }
  return node
}

/**
 * Low-level: apply remove / clear / mark to one feed-card (or resolved) element.
 * Does not discover ads; rules call this after matching their own targets.
 */
export function applyFeedCardBlockMode(
  target: Element,
  mode: BilibiliFeedBlockMode,
): boolean {
  if (target.hasAttribute(BLOCK_HANDLED_ATTR)) {
    return false
  }

  switch (mode) {
    case 'off':
      return false
    case 'remove':
      target.remove()
      return true
    case 'clear': {
      const el = target as HTMLElement
      el.setAttribute(BLOCK_HANDLED_ATTR, 'clear')
      el.setAttribute('aria-hidden', 'true')
      el.replaceChildren()
      el.style.minHeight = '0'
      el.style.opacity = '0.35'
      el.style.pointerEvents = 'none'
      return true
    }
    case 'mark':
      target.setAttribute(BLOCK_HANDLED_ATTR, 'mark')
      const wrap = document.createElement('div')
      wrap.className = 'tinted-spectacles-bili-ad-mark'
      wrap.setAttribute('role', 'note')
      wrap.textContent = BLOCK_MARK_LABEL
      wrap.style.boxSizing = 'border-box'
      wrap.style.minHeight = '48px'
      wrap.style.display = 'flex'
      wrap.style.alignItems = 'center'
      wrap.style.justifyContent = 'center'
      wrap.style.fontSize = '13px'
      wrap.style.color = '#777'
      wrap.style.background = 'rgba(0,0,0,0.06)'
      wrap.style.borderRadius = '6px'
      target.replaceChildren(wrap)
      return true
  }
}
