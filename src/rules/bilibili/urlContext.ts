import { BILIBILI_HOST_SUFFIX } from './selectors'

/** Any hostname under bilibili.com (used for preset / FAB gating). */
export function isBilibiliHost(hostname: string): boolean {
  return (
    hostname === BILIBILI_HOST_SUFFIX ||
    hostname.endsWith(`.${BILIBILI_HOST_SUFFIX}`)
  )
}

/**
 * Primary site homepage (recommendation feed). Path must be exactly `/`.
 * Other paths (e.g. /video/...) get different rule sets later.
 */
export function isBilibiliHomeFeedPage(
  loc: Pick<Location, 'hostname' | 'pathname'>,
): boolean {
  const host = loc.hostname.toLowerCase()
  if (host !== 'www.bilibili.com' && host !== 'bilibili.com') {
    return false
  }
  const p = loc.pathname
  return p === '/' || p === ''
}
