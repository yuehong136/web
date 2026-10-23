# C1 / C3 localization handoff

本轮实现与检查基于共享工作区 `f776737` 后的候选，主 agent 统一集成、构建与提交。本 worker 未提交、未推送。

## Runtime API

| API                                       | Contract                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getProductLanguage()`                    | 已确认的本机产品语言；UI store 只镜像此值。                                                                                                                                          |
| `getCurrentLanguage()`                    | 当前生效语言，供日期/数字格式与独立于 React 的界面逻辑使用。                                                                                                                         |
| `setProductLanguage(locale)`              | 先加载资源，再切换与持久化；失败 reject 并保留原偏好、有效语言和 document 属性。成功返回产品语言，不取消仍存活的路由 override。                                                      |
| `subscribeProductLanguage(listener)`      | 仅产品偏好变更成功时通知；返回 unsubscribe。临时路由变化不触发。                                                                                                                     |
| `createRouteLocaleScope()`                | `set(value)` 应用本 scope override；`set(undefined/null/unsupported)` 清除此 scope；`dispose()` 清理并使未完成请求失效。返回最终有效语言。多个 scope 中最近设置的仍存活 scope 生效。 |
| `applyRouteLocale` / `clearRouteLocale`   | 为旧调用方保留的默认 scope。需要组件生命周期的调用方应使用独立 scope 或 `useRouteLocale`。                                                                                           |
| `i18nReady`                               | 仅等待初始语言的 `common/layout/route-errors`；失败由资源边界提供重试。                                                                                                              |
| `ensureLocaleLoaded(locale, namespaces?)` | 加载该语言的指定域；省略 domains 时只加载本实例已使用的域，不拉全部业务资源。                                                                                                        |
| `RouteLocaleBoundary`                     | 默认渲染 Outlet；根据 pathname 等待新 route domains，再呈现新页面。成功切语言所需资源先准备好，已存在子树不按 locale 重新挂载。                                                      |
| `IsolatedLocaleBoundary`                  | 每个 Widget 创建独立 i18next 实例和 Provider；无 detector、document 写入或偏好持久化。                                                                                               |

host 保留 i18next 默认 singleton，兼容 `client-types`、变量编辑器等既有 `import { t } from 'i18next'`。Widget 实例不调用全局 `initReactI18next` 插件，避免替换 host 的 React 默认实例。

初始语言由 detector 读取既有本地偏好与 navigator，detector 的 `caches: []` 禁止临时切换隐式写回。本机偏好仅由产品语言事务写入 `i18n_language`。旧 `ui-storage` 只作为读取迁移来源。route/share/embed 清理独立于产品偏好；请求版本号保障异步最后一次意图胜出。应用 override 前准备产品语言已有域，释放 scope 时可恢复。

## Resources and integration

- `locale-registry.ts` 显式登记每个语言/域的 literal dynamic import，符合现有平台边界 lint；初始化不静态导入两语言的聚合 index。
- 新域同时加两语 resource、两语 index 聚合与 registry loader，随后在 `route-locales.ts` 登记使用它的路由。`sources` 与 `appearance` 已接线，资源内容分别由主 agent 提供。
- 每个已请求域存入真实 namespace；支持新调用 `t('key', { ns: 'domain' })`。同时把该域合入兼容 `translation` bundle，保留既有 `t('domain.key')` 调用。
- `createI18nResources()` 现为 async 全资源工具入口；仅 tooling/tests 主动调用。knowledge 既有同步断言已改为 await。
- `test-bootstrap.ts` 显式预加载中英全部域，并设置确定的中文测试基线；仅测试配置引用。旧 fixture 的 `i18n.changeLanguage` 经同一产品事务，保证格式化与 UI 一致，不影响生产懒加载。
- share/index 与 embed/index 使用 `useRouteLocale`；Widget 使用独立 Provider，包括 shared sources 域。实际 router/store/test config 接线由主 agent 完成。

全量 catalog 的 330 项既有缺项全部为 `flow` 英文缺失，已提供对应英文，保留协议 key、provider/language option 值与插值。`qWeatherTimePeriodOptions.15d` 的中文标签从误写的 12 天修正为 15 天。其他 owner 的 `chat/layout/appearance/home/studio/agents/sources/search` 文案未由本 worker 覆盖。

## Quality gate

```sh
node scripts/check-agent-i18n-hardcoded.mjs
node scripts/check-agent-i18n-hardcoded.mjs --base <base-sha> --head HEAD
node scripts/check-agent-i18n-hardcoded.mjs --all --catalogs-only
```

无参数扫描 HEAD→当前文件（含 staged/unstaged/untracked）；已提交范围使用显式 base/head，工作区干净仍检查提交内容。全零 base 取 head 的父提交，无父提交时用空树；无效非零 revision 报错。`--catalogs-only` 跳过源码，`--all` 对全部 catalog 问题失败；源码始终只棘轮新增行，避免强制全仓一次性翻译。

源码使用 TS AST 覆盖 JSX 文本、字符串 children、aria/title/placeholder/tooltip 和 toast，支持中英文本、跨行表达式与 reasoned `i18n-ignore:`。catalog 仅做静态 literal 求值，不执行翻译文件；验证中英 key、空值、插值、Intl.PluralRules 类别与旧 `_plural` 后缀。plural 的固定零/单数短句可省略 count，其他插值必须一致；跨语言仍比较该组全部插值集合。

## Lingui decision

本轮保留并增强 i18next，不新增 Lingui 依赖。审计快照中有 513 个 react-i18next 消费文件、639 个 useTranslation 调用、4407 个 t 调用，其中 369 个首参数不是字符串 literal。当前语义 key、动态 key、服务端错误映射与 React 外调用均已形成实际合同。

Lingui 官方已支持 Vite 8 / Rolldown 的 native macro transform，不能以“Vite 不兼容”作为拒绝理由。[安装文档](https://lingui.dev/installation) 和 [Vite 插件](https://lingui.dev/ref/vite-plugin) 描述了 catalog 编译、macro 转换与动态 import；[React 教程](https://lingui.dev/tutorials/react/) 说明 macro 到 runtime 的转换。i18next 本身也支持 [按域动态资源](https://www.i18next.com/how-to/add-or-load-translations)，本轮已实际解决隔离、持久化、竞态和按需加载问题。

没有执行 Lingui 编译插件、跨平台打包或体积对照试验，因此没有证据声称替换能减小包体或降低维护成本。后续只有在新功能确需 ICU/rich-text 提取工作流时才开独立小域试点：同一组消息与交互对比提取/翻译流程、初始与按需请求、增量构建、Web/Desktop/widget 隔离及失败恢复，再按结果决定是否扩大。当前不把未验证收益转成全仓迁移。

## Verification readback

- Focused Vitest：10 files / 53 tests，exit 0；含 locales 事务/资源/Provider、Widget settings/lifecycle、Desktop locale 与默认模型/上传回归。
- `node --test scripts/__tests__/i18n-quality.test.mjs`：6 tests，exit 0；含临时 Git 仓已提交 base/head、zero base 与新增质量债。
- `npx tsx --tsconfig tsconfig.app.json --test src/pages/knowledge/__tests__/knowledge-modernization.test.tsx`：4 tests，exit 0。
- `npx tsx --tsconfig tsconfig.app.json --test src/pages/knowledge/documents/__tests__/upload-feedback.test.ts`：3 tests，exit 0。
- 相关生产源码 ESLint：exit 0、无 warning；`verify:test-inventory`：exit 0，新测试进入唯一正式 lane。
- 全量 catalog `--all --catalogs-only`：exit 0、0 findings；本地新增源码 gate：exit 0。默认模式打印的 330 baseline 是 base 的历史缺项数量，不是当前残留。
- `lint:file-size` 与 `git diff --check`：exit 0。

本 worker 未运行全量 build/test，也未独立宣称浏览器、真实上传/解析 worker、真实模型供应商或 Windows/macOS 打包通过。实际构建分包和明暗主题浏览器证据由主 agent 汇总；单元测试中的独立实例/资源请求证明不等同于最终生产 chunk 体积。
