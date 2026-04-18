/**
 * Rule: hide homepage "partition recommend" tiles (e.g. bangumi/zongyi row with
 * floor-title badge). Same URL scope as other home-feed rules.
 */
import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'
import {
  applyFeedCardBlockMode,
  isBlockHandledSubtree,
  resolveBilibiliBlockTarget,
} from './feedCard'
import {
  PARTITION_RECOMMEND_FLOOR_SELECTOR,
  PARTITION_RECOMMEND_MOD_SELECTOR,
} from './selectors'

function resolvePartitionRecommendBlockTarget(node: Element): Element {
  const floor = node.closest(PARTITION_RECOMMEND_FLOOR_SELECTOR)
  if (floor) {
    return floor
  }
  return resolveBilibiliBlockTarget(node)
}

function collectPartitionRecommendTargets(root: ParentNode): Element[] {
  const resolved = new Map<Element, true>()
  for (const el of root.querySelectorAll(PARTITION_RECOMMEND_MOD_SELECTOR)) {
    if (!(el instanceof Element)) {
      continue
    }
    if (isBlockHandledSubtree(el)) {
      continue
    }
    const target = resolvePartitionRecommendBlockTarget(el)
    if (isBlockHandledSubtree(target)) {
      continue
    }
    resolved.set(target, true)
  }
  return [...resolved.keys()]
}

export function runHomeFeedPartitionRecommendRule(
  root: ParentNode,
  mode: BilibiliFeedBlockMode,
): number {
  if (mode === 'off') {
    return 0
  }
  const targets = collectPartitionRecommendTargets(root)
  let count = 0
  for (const el of targets) {
    if (applyFeedCardBlockMode(el, mode)) {
      count += 1
    }
  }
  return count
}
