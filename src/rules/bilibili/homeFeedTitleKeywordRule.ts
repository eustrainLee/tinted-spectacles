/**
 * Homepage feed: block cards whose visible title matches any user regex.
 * Caller: homepage `/` only.
 */
import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'
import {
  compileTitleKeywordRegexes,
  titleMatchesAnyKeyword,
} from '../../lib/titleKeywordPatterns'
import {
  applyFeedCardBlockMode,
  isBlockHandledSubtree,
  resolveBilibiliBlockTarget,
} from './feedCard'
import { findHomeFeedCardInnerRoot } from './homeFeedCardRoot'
import { CARD_SELECTOR } from './selectors'

const TITLE_PRIMARY_SELECTOR = '.bili-video-card__info--tit'

/**
 * Best-effort title text for standard recommendation cards.
 */
export function findHomeFeedCardTitleText(card: Element): string {
  const tit = card.querySelector(TITLE_PRIMARY_SELECTOR)
  if (tit) {
    const t = tit.textContent?.trim() ?? ''
    if (t) {
      return t
    }
  }
  const info = card.querySelector('.bili-video-card__info')
  if (info) {
    const link = info.querySelector<HTMLAnchorElement>(
      'a[href*="/video/BV"], a[href*="/video/av"], a[href*="/bangumi/play/"]',
    )
    if (link) {
      const t = link.textContent?.trim() ?? ''
      if (t) {
        return t
      }
    }
  }
  return ''
}

export interface HomeFeedTitleKeywordRuleConfig {
  mode: BilibiliFeedBlockMode
  /** Raw patterns from storage; compiled on each run from this list. */
  patterns: string[]
}

function collectTitleKeywordTargets(
  root: ParentNode,
  regexes: RegExp[],
): Element[] {
  if (regexes.length === 0) {
    return []
  }
  const seen = new Map<Element, true>()
  for (const card of root.querySelectorAll(CARD_SELECTOR)) {
    if (isBlockHandledSubtree(card)) {
      continue
    }
    const title = findHomeFeedCardTitleText(card)
    if (!titleMatchesAnyKeyword(title, regexes)) {
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

export function runHomeFeedTitleKeywordRule(
  root: ParentNode,
  config: HomeFeedTitleKeywordRuleConfig,
): number {
  if (config.mode === 'off') {
    return 0
  }
  const regexes = compileTitleKeywordRegexes(config.patterns)
  const targets = collectTitleKeywordTargets(root, regexes)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, config.mode)) {
      count += 1
    }
  }
  return count
}
