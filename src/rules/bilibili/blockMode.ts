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
