/**
 * Bilibili site rules: split by URL context, shared feed-card primitives, per-rule modules.
 *
 * - urlContext: where a rule applies (host, pathname).
 * - feedCard: low-level DOM ops on a feed-card target (remove / clear / mark).
 * - homeFeedAdsRule / homeFeedLikePromoRule / homeFeedPartitionRecommendRule /
 *   homeFeedDurationRule / homeFeedTitleKeywordRule: homepage `/` feed rules.
 * Add new files (e.g. videoPageRule.ts) and export here; wire in content script by URL.
 */
export { BILIBILI_HOST_SUFFIX } from './selectors'
export { isBilibiliHost, isBilibiliHomeFeedPage } from './urlContext'
export {
  BLOCK_HANDLED_ATTR,
  applyFeedCardBlockMode,
  resolveBilibiliBlockTarget,
} from './feedCard'
export {
  DEFAULT_BILIBILI_DURATION_BLOCK_MODE,
  DEFAULT_BILIBILI_FEED_BLOCK_MODE,
  DEFAULT_BILIBILI_LIKE_PROMO_BLOCK_MODE,
  DEFAULT_BILIBILI_PARTITION_RECOMMEND_BLOCK_MODE,
  DEFAULT_BILIBILI_TITLE_KEYWORD_BLOCK_MODE,
  getEffectiveBilibiliDurationBlockMode,
  getEffectiveBilibiliFeedBlockMode,
  getEffectiveBilibiliLikePromoBlockMode,
  getEffectiveBilibiliPartitionRecommendBlockMode,
  getEffectiveBilibiliTitleKeywordBlockMode,
} from './blockMode'
export { resolveHomeFeedRoot, runHomeFeedAdsRule } from './homeFeedAdsRule'
export { runHomeFeedLikePromoRule } from './homeFeedLikePromoRule'
export { runHomeFeedPartitionRecommendRule } from './homeFeedPartitionRecommendRule'
export {
  runHomeFeedDurationRule,
  type HomeFeedDurationRuleConfig,
} from './homeFeedDurationRule'
export {
  findHomeFeedCardTitleText,
  runHomeFeedTitleKeywordRule,
  type HomeFeedTitleKeywordRuleConfig,
} from './homeFeedTitleKeywordRule'
