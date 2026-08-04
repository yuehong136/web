import { APIError } from './client'

/**
 * 后端还没有对应 RESTful 路由时的判据。
 *
 * 路由不存在只会以 HTTP 404/405 出现——后端的业务错误一律是 HTTP 200 + 信封里的
 * 非零 code，走的是别的分支，不会被误判成"路由缺失"。
 */
export const isMissingRouteError = (error: unknown): boolean =>
  error instanceof APIError && (error.status === 404 || error.status === 405)

/**
 * 兼容期调用包装：优先打 RESTful 入口，只有后端尚未上线该路由（404/405）时才回落
 * 到旧的 web 端点。业务错误照抛，不会被回退吞掉。
 *
 * 待所有部署环境的后端都带上对应 RESTful 路由后，删掉调用方的 legacy 分支与本模块。
 */
export async function withLegacyFallback<T>(
  restCall: () => Promise<T>,
  legacyCall: () => Promise<T>,
): Promise<T> {
  try {
    return await restCall()
  } catch (error) {
    if (!isMissingRouteError(error)) throw error
    return legacyCall()
  }
}
