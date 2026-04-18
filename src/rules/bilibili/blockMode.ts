import type { BilibiliFeedBlockMode } from '../../lib/storageSchema'

/** User preference for the home-feed ad rule (how to apply feed-card ops). */
export const DEFAULT_BILIBILI_FEED_BLOCK_MODE: BilibiliFeedBlockMode = 'remove'

/** Same semantics as ads: default remove when unset. */
export const DEFAULT_BILIBILI_LIKE_PROMO_BLOCK_MODE: BilibiliFeedBlockMode =
  'remove'

export function getEffectiveBilibiliFeedBlockMode(
  record: { bilibiliFeedBlockMode?: BilibiliFeedBlockMode } | undefined,
): BilibiliFeedBlockMode {
  return record?.bilibiliFeedBlockMode ?? DEFAULT_BILIBILI_FEED_BLOCK_MODE
}

export function getEffectiveBilibiliLikePromoBlockMode(
  record:
    | { bilibiliLikePromoBlockMode?: BilibiliFeedBlockMode }
    | undefined,
): BilibiliFeedBlockMode {
  return (
    record?.bilibiliLikePromoBlockMode ??
    DEFAULT_BILIBILI_LIKE_PROMO_BLOCK_MODE
  )
}

/** Duration filter is opt-in; off when unset. */
export const DEFAULT_BILIBILI_DURATION_BLOCK_MODE: BilibiliFeedBlockMode = 'off'

export function getEffectiveBilibiliDurationBlockMode(
  record:
    | { bilibiliDurationBlockMode?: BilibiliFeedBlockMode }
    | undefined,
): BilibiliFeedBlockMode {
  return (
    record?.bilibiliDurationBlockMode ?? DEFAULT_BILIBILI_DURATION_BLOCK_MODE
  )
}

/** Partition-recommend tiles are opt-in; off when unset. */
export const DEFAULT_BILIBILI_PARTITION_RECOMMEND_BLOCK_MODE: BilibiliFeedBlockMode =
  'off'

export function getEffectiveBilibiliPartitionRecommendBlockMode(
  record:
    | { bilibiliPartitionRecommendBlockMode?: BilibiliFeedBlockMode }
    | undefined,
): BilibiliFeedBlockMode {
  return (
    record?.bilibiliPartitionRecommendBlockMode ??
    DEFAULT_BILIBILI_PARTITION_RECOMMEND_BLOCK_MODE
  )
}

/** Title keyword block is opt-in; off when unset. */
export const DEFAULT_BILIBILI_TITLE_KEYWORD_BLOCK_MODE: BilibiliFeedBlockMode =
  'off'

export function getEffectiveBilibiliTitleKeywordBlockMode(
  record:
    | { bilibiliTitleKeywordBlockMode?: BilibiliFeedBlockMode }
    | undefined,
): BilibiliFeedBlockMode {
  return (
    record?.bilibiliTitleKeywordBlockMode ??
    DEFAULT_BILIBILI_TITLE_KEYWORD_BLOCK_MODE
  )
}
