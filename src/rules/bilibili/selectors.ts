export const BILIBILI_HOST_SUFFIX = 'bilibili.com'
/**
 * Homepage feed grid cell (outer slot). Current web uses `.feed-card`;
 * older markup used `.bili-feed-card`. Prefer removing this wrapper on "remove".
 */
export const FEED_CARD_CELL_SELECTOR = '.feed-card, .bili-feed-card'
export const FEED_ROOT_SELECTOR = '.recommended-container_floor-aside'
/** Homepage feed v4 (web); used when legacy aside root is absent. */
export const FEED_ROOT_SELECTOR_V4 = '.bili-feed4'
export const CARD_SELECTOR = '.bili-video-card'
export const AD_LABEL_SELECTOR = '.bili-video-card__info--ad'
/** Commercial landing slot (top/side promo blocks). */
export const CM_CARD_WRAP_SELECTOR = '.bili-video-card__wrap'
export const CM_PROMO_LINK_SELECTOR = 'a[href*="cm.bilibili.com"]'
