import { AD_LABEL_SELECTOR, CARD_SELECTOR, FEED_ROOT_SELECTOR } from './selectors'

function isAdCard(card: Element): boolean {
  return Boolean(card.querySelector(AD_LABEL_SELECTOR))
}

export function runBilibiliFeedCleanup(root: ParentNode): number {
  const cards = root.querySelectorAll(CARD_SELECTOR)
  let removed = 0

  for (const card of cards) {
    if (!isAdCard(card)) {
      continue
    }
    card.remove()
    removed += 1
  }

  return removed
}

export function resolveBilibiliFeedRoot(doc: Document): ParentNode {
  return doc.querySelector(FEED_ROOT_SELECTOR) ?? doc
}
