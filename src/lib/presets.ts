export type SpectacleId = 'none' | 'bilibili' | 'zhihu'

export type SpectaclePreset = {
  id: SpectacleId
  label: string
  hint: string
}

export const SPECTACLES: readonly SpectaclePreset[] = [
  {
    id: 'none',
    label: 'None',
    hint: 'Do not use a named preset on this site.',
  },
  {
    id: 'bilibili',
    label: 'Bilibili',
    hint: 'Rules for bilibili.com (filters not wired yet).',
  },
  {
    id: 'zhihu',
    label: 'Zhihu',
    hint: 'Rules for zhihu.com (filters not wired yet).',
  },
]

export function isSpectacleId(value: string): value is SpectacleId {
  return SPECTACLES.some((p) => p.id === value)
}
