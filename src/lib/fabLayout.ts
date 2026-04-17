export const FAB_EDGE_INSET = 16
export const FAB_SNAP_THRESHOLD = 32

export function clampFabTopLeft(
  left: number,
  top: number,
  fabWidth: number,
  fabHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  edgeInset: number = FAB_EDGE_INSET,
): { left: number; top: number } {
  const maxLeft = Math.max(edgeInset, viewportWidth - fabWidth - edgeInset)
  const maxTop = Math.max(edgeInset, viewportHeight - fabHeight - edgeInset)
  return {
    left: Math.min(Math.max(edgeInset, left), maxLeft),
    top: Math.min(Math.max(edgeInset, top), maxTop),
  }
}

export function defaultFabTopLeft(
  fabWidth: number,
  fabHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  edgeInset: number = FAB_EDGE_INSET,
): { left: number; top: number } {
  return {
    left: viewportWidth - fabWidth - edgeInset,
    top: viewportHeight - fabHeight - edgeInset,
  }
}

export function snapFabTopLeftToEdges(
  left: number,
  top: number,
  fabWidth: number,
  fabHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  edgeInset: number = FAB_EDGE_INSET,
  snapThreshold: number = FAB_SNAP_THRESHOLD,
): { left: number; top: number } {
  const clamped = clampFabTopLeft(
    left,
    top,
    fabWidth,
    fabHeight,
    viewportWidth,
    viewportHeight,
    edgeInset,
  )
  let nextLeft = clamped.left
  let nextTop = clamped.top

  if (nextLeft - edgeInset <= snapThreshold) {
    nextLeft = edgeInset
  } else if (viewportWidth - edgeInset - fabWidth - nextLeft <= snapThreshold) {
    nextLeft = viewportWidth - fabWidth - edgeInset
  }

  if (nextTop - edgeInset <= snapThreshold) {
    nextTop = edgeInset
  } else if (viewportHeight - edgeInset - fabHeight - nextTop <= snapThreshold) {
    nextTop = viewportHeight - fabHeight - edgeInset
  }

  return { left: nextLeft, top: nextTop }
}
