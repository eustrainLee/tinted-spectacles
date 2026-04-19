/**
 * Homepage feed: block cards whose uploader display name matches any user regex.
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

const OWNER_PRIMARY_SELECTOR = '.bili-video-card__info--owner'

/**
 * Best-effort uploader / UP name on standard recommendation cards.
 */
export function findHomeFeedCardUploaderText(card: Element): string {
  const owner = card.querySelector(OWNER_PRIMARY_SELECTOR)
  if (owner) {
    const t = owner.textContent?.trim() ?? ''
    if (t) {
      return t
    }
  }
  const info = card.querySelector('.bili-video-card__info')
  if (info) {
    const space = info.querySelector<HTMLAnchorElement>(
      'a[href*="space.bilibili.com"]',
    )
    if (space) {
      const t = space.textContent?.trim() ?? ''
      if (t) {
        return t
      }
    }
  }
  return ''
}

export interface HomeFeedUploaderKeywordRuleConfig {
  mode: BilibiliFeedBlockMode
  patterns: string[]
}

function collectUploaderKeywordTargets(
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
    const name = findHomeFeedCardUploaderText(card)
    if (!titleMatchesAnyKeyword(name, regexes)) {
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

export function runHomeFeedUploaderKeywordRule(
  root: ParentNode,
  config: HomeFeedUploaderKeywordRuleConfig,
): number {
  if (config.mode === 'off') {
    return 0
  }
  const regexes = compileTitleKeywordRegexes(config.patterns)
  const targets = collectUploaderKeywordTargets(root, regexes)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, config.mode)) {
      count += 1
    }
  }
  return count
}
