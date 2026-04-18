/**
 * Homepage feed: hide cards whose on-card duration is outside a min/max range.
 * Caller: homepage `/` only. If no parsable duration label is found, the card is left unchanged.
 */
import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'
import {
  durationOutsideBounds,
  parseDurationBounds,
  parseTypedDurationToSeconds,
} from '../../lib/durationParse'
import {
  applyFeedCardBlockMode,
  isBlockHandledSubtree,
  resolveBilibiliBlockTarget,
} from './feedCard'
import { findHomeFeedCardInnerRoot } from './homeFeedCardRoot'
import { CARD_SELECTOR } from './selectors'

/** Current bilibili home feed: sibling of stats--left under .bili-video-card__stats. */
const STATS_DURATION_SELECTOR = '.bili-video-card__stats__duration'

const DURATION_LEAF_TEXT_RE =
  /^(?:\d{1,2}:\d{2}:\d{2}|\d{1,3}:\d{2})$/

function textLooksLikeDurationLabel(t: string): boolean {
  return DURATION_LEAF_TEXT_RE.test(t.trim())
}

/**
 * Read duration from the card mask stats (see `.bili-video-card__stats__duration`
 * on the live home feed). Falls back to `.bili-video-card__stats--right` only.
 */
export function findDisplayedDurationSeconds(card: Element): number | null {
  const durationEl = card.querySelector(STATS_DURATION_SELECTOR)
  if (durationEl) {
    const t = durationEl.textContent?.trim() ?? ''
    const sec = parseTypedDurationToSeconds(t)
    if (sec !== null) {
      return sec
    }
  }
  const right = card.querySelector('.bili-video-card__stats--right')
  if (right) {
    const t = right.textContent?.trim() ?? ''
    if (textLooksLikeDurationLabel(t)) {
      return parseTypedDurationToSeconds(t)
    }
  }
  return null
}

export interface HomeFeedDurationRuleConfig {
  mode: BilibiliFeedBlockMode
  minStr: string
  maxStr: string
}

function collectDurationOutOfRangeTargets(
  root: ParentNode,
  config: HomeFeedDurationRuleConfig,
): Element[] {
  const { minSec, maxSec } = parseDurationBounds(config.minStr, config.maxStr)
  if (minSec === undefined && maxSec === undefined) {
    return []
  }
  const seen = new Map<Element, true>()
  for (const card of root.querySelectorAll(CARD_SELECTOR)) {
    if (isBlockHandledSubtree(card)) {
      continue
    }
    const seconds = findDisplayedDurationSeconds(card)
    if (seconds === null) {
      continue
    }
    if (!durationOutsideBounds(seconds, minSec, maxSec)) {
      continue
    }
    const inner = findHomeFeedCardInnerRoot(card)
    const node = inner ?? card
    if (isBlockHandledSubtree(node)) {
      continue
    }
    const target = resolveBilibiliBlockTarget(node)
    if (isBlockHandledSubtree(target)) {
      continue
    }
    seen.set(target, true)
  }
  return [...seen.keys()]
}

export function runHomeFeedDurationRule(
  root: ParentNode,
  config: HomeFeedDurationRuleConfig,
): number {
  if (config.mode === 'off') {
    return 0
  }
  const targets = collectDurationOutOfRangeTargets(root, config)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, config.mode)) {
      count += 1
    }
  }
  return count
}
