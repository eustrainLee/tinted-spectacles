/**
 * Rule: block sponsored / ad slots on the **homepage recommendation feed** only.
 * URL gating lives in urlContext.isBilibiliHomeFeedPage (caller).
 *
 * Detection here is specific to home-feed cards; other pages get other rules later.
 */
import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'
import {
  applyFeedCardBlockMode,
  isBlockHandledSubtree,
  resolveBilibiliBlockTarget,
} from './feedCard'
import { findHomeFeedCardInnerRoot } from './homeFeedCardRoot'
import {
  AD_LABEL_SELECTOR,
  CARD_SELECTOR,
  CM_CARD_WRAP_SELECTOR,
  CM_PROMO_LINK_SELECTOR,
  FEED_ROOT_SELECTOR,
  FEED_ROOT_SELECTOR_V4,
} from './selectors'

function isFeedAdStats(stats: Element): boolean {
  const left = stats.querySelector(':scope > .bili-video-card__stats--left')
  const textLabel = stats.querySelector(':scope > .bili-video-card__stats--text')
  if (!left || !textLabel) {
    return false
  }
  return left.children.length === 0
}

function isAdCard(card: Element): boolean {
  if (card.querySelector(AD_LABEL_SELECTOR)) {
    return true
  }
  const stats = card.querySelector('.bili-video-card__stats')
  return stats !== null && isFeedAdStats(stats)
}

function collectRawAdNodes(root: ParentNode): Element[] {
  const out: Element[] = []

  for (const card of root.querySelectorAll(CARD_SELECTOR)) {
    if (isBlockHandledSubtree(card)) {
      continue
    }
    if (isAdCard(card)) {
      out.push(card)
    }
  }

  for (const stats of root.querySelectorAll('.bili-video-card__stats')) {
    if (isBlockHandledSubtree(stats)) {
      continue
    }
    if (!isFeedAdStats(stats)) {
      continue
    }
    const node = findHomeFeedCardInnerRoot(stats)
    if (node && !isBlockHandledSubtree(node)) {
      out.push(node)
    }
  }

  for (const link of root.querySelectorAll(CM_PROMO_LINK_SELECTOR)) {
    if (isBlockHandledSubtree(link)) {
      continue
    }
    const wrap = link.closest(CM_CARD_WRAP_SELECTOR)
    if (wrap) {
      out.push(wrap)
      continue
    }
    if (link.parentElement) {
      out.push(link.parentElement)
    }
  }

  return out
}

function collectResolvedTargets(root: ParentNode): Element[] {
  const resolved = new Map<Element, true>()
  for (const raw of collectRawAdNodes(root)) {
    const target = resolveBilibiliBlockTarget(raw)
    if (!isBlockHandledSubtree(target)) {
      resolved.set(target, true)
    }
  }
  return [...resolved.keys()]
}

/** DOM root to observe for home-feed mutations (legacy aside or feed v4). */
export function resolveHomeFeedRoot(doc: Document): ParentNode {
  return (
    doc.querySelector(FEED_ROOT_SELECTOR) ??
    doc.querySelector(FEED_ROOT_SELECTOR_V4) ??
    doc
  )
}

/**
 * Run the home-feed ad rule once: find ad-like cards under `root`, apply block mode.
 */
export function runHomeFeedAdsRule(
  root: ParentNode,
  mode: BilibiliFeedBlockMode,
): number {
  if (mode === 'off') {
    return 0
  }
  const targets = collectResolvedTargets(root)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, mode)) {
      count += 1
    }
  }
  return count
}
