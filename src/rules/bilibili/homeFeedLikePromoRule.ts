/**
 * Rule: hide homepage feed cards that show like-based promo copy (e.g. N万点赞).
 * Same URL scope as home feed ads (caller: homepage `/` only).
 */
import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'
import {
  applyFeedCardBlockMode,
  isBlockHandledSubtree,
  resolveBilibiliBlockTarget,
} from './feedCard'
import { findHomeFeedCardInnerRoot } from './homeFeedCardRoot'

/**
 * Cover mask uses stats--text; title block uses info--icon-text (see bilibili
 * home feed markup).
 */
const LIKE_PROMO_LABEL_SELECTOR =
  '.bili-video-card__stats--text, .bili-video-card__info--icon-text'

/** Matches lines such as "2万点赞" or "1.2万点赞" (digits + 万/千 + 点赞). */
const LIKE_PROMO_LABEL_TEXT_RE =
  /\d[\d.]*\s*[\u4e07\u5343]\s*\u70b9\u8d5e|\d[\d.]*[\u4e07\u5343]\u70b9\u8d5e/

function isLikePromoLabelElement(el: Element): boolean {
  if (!el.matches(LIKE_PROMO_LABEL_SELECTOR)) {
    return false
  }
  const t = el.textContent?.trim() ?? ''
  return LIKE_PROMO_LABEL_TEXT_RE.test(t)
}

function collectRawLikePromoNodes(root: ParentNode): Element[] {
  const out: Element[] = []
  for (const label of root.querySelectorAll(LIKE_PROMO_LABEL_SELECTOR)) {
    if (isBlockHandledSubtree(label)) {
      continue
    }
    if (!isLikePromoLabelElement(label)) {
      continue
    }
    const node = findHomeFeedCardInnerRoot(label)
    if (node && !isBlockHandledSubtree(node)) {
      out.push(node)
    }
  }
  return out
}

function collectResolvedLikePromoTargets(root: ParentNode): Element[] {
  const resolved = new Map<Element, true>()
  for (const raw of collectRawLikePromoNodes(root)) {
    const target = resolveBilibiliBlockTarget(raw)
    if (!isBlockHandledSubtree(target)) {
      resolved.set(target, true)
    }
  }
  return [...resolved.keys()]
}

export function runHomeFeedLikePromoRule(
  root: ParentNode,
  mode: BilibiliFeedBlockMode,
): number {
  if (mode === 'off') {
    return 0
  }
  const targets = collectResolvedLikePromoTargets(root)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, mode)) {
      count += 1
    }
  }
  return count
}
