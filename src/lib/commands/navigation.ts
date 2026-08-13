import { ROUTES } from '@/constants'
import { DesktopActivity } from '@/stores/ui'

const activityRoutes: ReadonlyArray<
  readonly [DesktopActivity, readonly string[]]
> = [
  [DesktopActivity.WORK, [ROUTES.HOME]],
  [DesktopActivity.DISCOVER, [ROUTES.EXPLORE, ROUTES.SEARCH]],
  [DesktopActivity.KNOWLEDGE, [ROUTES.KNOWLEDGE, ROUTES.MEMORY]],
  [DesktopActivity.BUILD, [ROUTES.AGENTS, ROUTES.STUDIO]],
  [DesktopActivity.TOOLS, [ROUTES.AI_TOOLS, ROUTES.MCP_SERVERS]],
]

export function getDesktopActivityForPath(
  pathname: string,
): DesktopActivity | undefined {
  return activityRoutes.find(([, routes]) =>
    routes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ),
  )?.[0]
}
