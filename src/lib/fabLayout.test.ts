import { describe, expect, it } from 'vitest'
import {
  clampFabTopLeft,
  defaultFabTopLeft,
  FAB_EDGE_INSET,
  snapFabTopLeftToEdges,
} from './fabLayout'

describe('clampFabTopLeft', () => {
  it('keeps the FAB inside the viewport with edge insets', () => {
    const r = clampFabTopLeft(-100, -50, 44, 80, 400, 800, FAB_EDGE_INSET)
    expect(r.left).toBe(FAB_EDGE_INSET)
    expect(r.top).toBe(FAB_EDGE_INSET)
  })

  it('clamps oversized FAB to the nearest valid inset', () => {
    const r = clampFabTopLeft(0, 0, 500, 900, 400, 800, FAB_EDGE_INSET)
    expect(r.left).toBe(FAB_EDGE_INSET)
    expect(r.top).toBe(FAB_EDGE_INSET)
  })
})

describe('defaultFabTopLeft', () => {
  it('anchors to the bottom-right corner', () => {
    const r = defaultFabTopLeft(44, 80, 400, 800, FAB_EDGE_INSET)
    expect(r.left).toBe(400 - 44 - FAB_EDGE_INSET)
    expect(r.top).toBe(800 - 80 - FAB_EDGE_INSET)
  })
})

describe('snapFabTopLeftToEdges', () => {
  it('snaps to the right edge when close', () => {
    const vw = 400
    const vh = 800
    const w = 44
    const h = 80
    const nearRight = vw - FAB_EDGE_INSET - w - 10
    const r = snapFabTopLeftToEdges(nearRight, 200, w, h, vw, vh)
    expect(r.left).toBe(vw - FAB_EDGE_INSET - w)
  })

  it('snaps to the left edge when close', () => {
    const vw = 400
    const vh = 800
    const w = 44
    const h = 80
    const r = snapFabTopLeftToEdges(FAB_EDGE_INSET + 10, 200, w, h, vw, vh)
    expect(r.left).toBe(FAB_EDGE_INSET)
  })

  it('snaps to the top edge when close', () => {
    const vw = 400
    const vh = 800
    const w = 44
    const h = 80
    const r = snapFabTopLeftToEdges(120, FAB_EDGE_INSET + 8, w, h, vw, vh)
    expect(r.top).toBe(FAB_EDGE_INSET)
  })

  it('snaps to the bottom edge when close', () => {
    const vw = 400
    const vh = 800
    const w = 44
    const h = 80
    const nearBottom = vh - FAB_EDGE_INSET - h - 12
    const r = snapFabTopLeftToEdges(120, nearBottom, w, h, vw, vh)
    expect(r.top).toBe(vh - FAB_EDGE_INSET - h)
  })
})
