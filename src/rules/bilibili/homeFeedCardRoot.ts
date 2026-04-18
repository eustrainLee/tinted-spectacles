import { CARD_SELECTOR } from './selectors'

/**
 * Map a node inside a feed card (stats bar, info row, etc.) to the inner root
 * we mutate (legacy article or anchor+info wrapper).
 */
export function findHomeFeedCardInnerRoot(node: Element): Element | null {
  const legacy = node.closest(CARD_SELECTOR)
  if (legacy) {
    return legacy
  }
  const anchor = node.closest('a[href]')
  const parent = anchor?.parentElement ?? null
  if (parent?.querySelector('.bili-video-card__info')) {
    return parent
  }
  return null
}
