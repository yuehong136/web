# 第二轮集成独立审查

2026-10-24，审查范围为 `2da1355` 到当前共享工作区，包含未提交文件。复核时 HEAD 为 `d28a092abb72ae0da0fb102f48fc508456f99ce4`；这不是最终集成提交或运行服务版本。审查者对本页涉及的 Home、Explore、API 和工作区产品实现只读，问题由对应 owner 修复。

## 结论

独立审查确认的四个问题均已完成修复读回，原失败场景现已通过。主 agent 随后在生产构建浏览器检查中发现的最新资源入口焦点问题也已修复并通过重放。下面范围内暂未发现仍可复现的阻塞问题；结论仅覆盖当前源码、定向测试和已读回的浏览器证据，不代表真实后端或全站验收。

## 问题与修复读回

下表前四项由独立审查发现；第五项由主 agent 的浏览器检查发现，独立审查读回修复及最终证据。

| 级别 | 问题与具体触发                                                                                                                                  | 当前修复                                                                                                                                                                | 独立证据                                                                                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1   | Home 的 app/MCP 请求在同一用户的 token A→B→A 后仍可继续；仅比较最终 React props 会漏掉被批处理的身份转换。                                      | [`use-home-scope.ts`](../../src/pages/home/hooks/use-home-scope.ts) 同步订阅身份变化，立即撤销旧请求、清理消息和历史同步状态，并递增 epoch；不依赖最终 token 恰好不同。 | scratch 原红例转绿；正式 `use-home-chat-stream.test.tsx` 覆盖 app/MCP 身份循环，断言 A→B 当场 abort，循环后不收旧消息。                                        |
| P1   | `APIClient` 的领域二进制 reader 已开始消费 body 后切换身份，旧私有 body 仍会作为成功结果返回；JSON 路径已有检查，reader 路径缺少 await 后检查。 | [`client.ts`](../../src/api/client.ts) 的 `readBinaryResponse` await 后再次检查 abort 和请求身份，再返回 reader 结果。                                                  | scratch 延迟 body 原红例转绿；正式 `client.test.ts` 的 `an identity replaced during a domain response reader cannot receive its private body` 通过。           |
| P2   | 工作区线程 A→B→A 后，第一次 A 捕获的 `resourceActions` 重新匹配相同字符串 scope，能再次打开旧资源。                                             | [`chat-workspace.tsx`](../../src/components/chat/chat-workspace.tsx) 为 scope 转换递增 generation，并在 layout cleanup 时使旧 callback 的 current scope 失效。          | scratch 保留第一次 A 的 callback，切到 B 再回 A 后调用，旧引用不能打开；原红例转绿。                                                                           |
| P2   | 宽屏资源面板调整宽度后关闭再打开，挂载时仍用第一次读取的宽度，只有刷新后才使用已保存偏好。                                                      | [`ai-workspace.tsx`](../../src/components/layout/ai-workspace.tsx) 在合法 `onResize` 时同步更新局部 width 与可选存储偏好。                                              | scratch 调整至 41%，关闭再打开仍为 41%；正式工作区专项通过。                                                                                                   |
| P2   | 资源 dock 已打开后，从主区另一个引用/成果入口切换资源，关闭时仍返回最早入口，可能漏掉这次 inline 引用 marker。浏览器发现。                      | `ChatWorkspace` 把主区最新资源入口的 `returnFocusTargets` 与选择绑定；`AiWorkspace` 在仍打开时更新返回目标，面板内部导航保留主区入口。                                  | 正式 `returns to the latest resource opener while the dock remains open` 通过；最终生产浏览器实际点击 inline marker → Details → Close，确认焦点回到该 marker。 |

Home 未绑定应用时的空二级栏也已处理：[`workbench-navigation.tsx`](../../src/components/layout/workbench-navigation.tsx) 提供 `hasSecondaryContent`，[`app-shell.tsx`](../../src/components/layout/app-shell.tsx) 隐藏空栏与相应 toggle，不改用户保存的折叠偏好。正式 `home-navigation-availability.test.tsx` 通过。该项是布局完善，不作为身份问题的修复替代。

## 已追踪的关键路径

- **资源与清理**：消息中的受支持 artifact URL → 只读 `ArtifactRef` → 工作区选择 → 领域下载 → MIME/大小分支 → 预览。`useArtifactResource` 在请求与文本读取 await 后均核对当前 owner；身份变化同步撤销请求、释放 blob URL，关闭/切资源也执行清理。HTML 使用清洗后的内容、无脚本 opaque sandbox 和限制性 CSP；不支持的格式给出下载出口。没有把客户端展示状态当成服务器持久化版本或写入回执。
- **同一工作区切换**：证据和成果的 tabpanel 保持挂载，避免切 tab 重发下载或丢失所选资源。`ChatWorkspace` 将线程 generation 与身份 epoch 纳入作用域。`AiWorkspace` 根据实际可用容器宽度和文字比例选择 dock/Sheet，主会话与 composer 保持挂载；关闭和 scope 失效都有焦点恢复/清理路径。
- **Home 上下文**：app 模式只标明实际继承的配置，MCP 模式只标明本轮提交的 server ID；不把客户端选择写成模型已使用。提交时冻结快照，后续选择变化不改历史快照，传输仍使用领域请求的既有字段。不可确认的就绪状态保留 unknown。
- **Explore 终态**：复用共享 SSE、流状态与服务端终态识别；连接 EOF 只能进入 interrupted，本地停止和服务器确认分开。第一个终态胜出，异 run 的生命周期帧不能收口本条消息，失败保留已收到正文且不直接展示服务端错误细节。新 history scope 和身份 generation 隔离旧历史及晚到 chunk。
- **API 旧身份保护**：读取响应 header、JSON body 和领域 reader 后都检查请求身份；旧 401、旧登录响应 header、匿名请求和 skipAuth 请求不能清掉后建立的身份。logout 后重新使用相同 token 也会使旧请求过期；重复应用当前 token 不误杀正常并发读取。
- **共享文案与引用**：新工作区固定文案走中英共享资源；`chat.aiWorkspace` 使用窄范围 typed keys。引用面板使用同一展示组件，合法 0 相似度保留，缺失/非法相似度不显示成 0；富文本走既有安全组件，详情入口走翻译键。

## 本次实际执行

以下命令均从仓库根执行，exit 0；未重复全量 Web 测试或 Web 构建。

```bash
npx vitest run \
  src/components/chat/__tests__/artifact-workspace.test.tsx \
  src/components/layout/__tests__/ai-workspace.test.tsx \
  src/components/layout/__tests__/home-navigation-availability.test.tsx \
  src/pages/home/hooks/__tests__/use-home-chat-stream.test.tsx \
  src/pages/explore/hooks/__tests__/use-explore-send.test.tsx
# 5 files, 55 tests passed

npx tsx --tsconfig tsconfig.app.json --test \
  src/api/__tests__/client.test.ts \
  src/pages/explore/hooks/__tests__/explore-stream.test.ts \
  src/pages/home/utils/__tests__/home-context.test.ts \
  src/lib/ai-workspace/__tests__/contracts.test.ts
# 40 tests passed

npx vitest run --config output/playwright/round2/review/vitest.config.ts \
  output/playwright/round2/review/client-body.test.tsx \
  output/playwright/round2/review/home-identity.test.tsx \
  output/playwright/round2/review/workspace-width.test.tsx \
  output/playwright/round2/review/workspace-cycle.test.tsx -t review
# 4 files, 9 tests passed, 35 skipped
```

scratch 测试用于独立复现，留在 ignored `output/playwright/round2/review/`，不进入生产或替代正式回归。`-t review` 的通过数包含名字匹配的既有用例，不能理解为新增了 9 个独立问题。早期正式 artifact 测试受生产高亮模块入口调整影响而在导入阶段失败；对应 mock 已由主 agent 迁到 `react-shiki/core`，上面的正式专项随后全部通过。

最新 opener 焦点修复后，另外运行 `npx vitest run src/components/layout/__tests__/ai-workspace.test.tsx`，4 项通过。

### Desktop staging 集成收口

生产 Vite 构建为路由 profiler 新增 `.vite/manifest.json`，原显式 renderer allowlist 拒绝该目录。主 agent 派发兼容修复后，审查者仅修改 [`stage.mjs`](../../desktop/build/stage.mjs) 与对应 [`stage.test.mjs`](../../desktop/tests/packaging/stage.test.mjs)：只允许跳过根 `.vite` 真目录，且它必须恰好包含一个普通 `manifest.json` 文件。空目录、额外文件/隐藏文件、嵌套目录、manifest 目录、目录/文件符号链接及其他隐藏根目录均拒绝；没有扩张正式 renderer allowlist，也不把生成元数据复制进包。

实际执行 `node --test desktop/tests/packaging/stage.test.mjs`（29 项）、`npm run test:desktop`（93 项、零 skipped）、`npm run lint:desktop`、`npm run desktop:typecheck` 均 exit 0。基于主 agent 已完成的生产 `dist/`，顺序运行 `npm run desktop:build` → `npm run desktop:stage` → `npm run desktop:verify:stage`，均 exit 0；读回确认恰好 1,108 个 staged 文件且 renderer `.vite` 不存在，内容 SHA-256 为 `0fd7eab2f3e04f526121b3e36ad2dbfba068412d021bd2ff89d359aeb209faed`。这只是源码、构建和 staging 门禁，不代表安装包、签名或原生桌面 E2E 验收。

## 浏览器证据与未验证边界

已重新读回最终 `output/playwright/round2/browser/results.json`，明确标记 `production: true`，Chromium `155.0.8059.85`，14 项检查通过、`pageErrors: []`。这是主 agent 对生产构建在受控 HTTP/SSE fixture 下执行的浏览器检查，独立审查没有把 fixture 当成真实后端。

已查看新生成的七张 PNG：`home-context-dark-en.png`、`home-artifact-light-en.png`、`home-artifact-html-dark-en.png`、`search-evidence-dark-en.png`、`search-evidence-mobile-en.png`、`search-half-viewport-text125-pressure.png`、`explore-interrupted-en.png`。可见明暗主题代码高亮、只读成果与同时可编辑的 composer、宽屏证据 dock 的合法 0% 相似度、窄屏 Sheet 和中断后保留的正文。新图显示数字 inline citation，旧 DEV 截图的裸 `##0$$` 证据差异已解除；脚本还实际验证 marker → Details → Close 的焦点恢复。

14 项覆盖 Home 语言/主题保留同一 draft、模拟 composition 输入只提交一次、提交快照不改变请求字段、HTML 预览无脚本 CSP sandbox/下载及语言主题不重取、TypeScript/Python 真实 token spans 与剪贴板、证据/成果切换保留挂载、raster blob URL 的关闭/换会话释放、403/404/500 固定提示保留回答、宽屏非模态编辑、inline marker 焦点、窄屏 Sheet 焦点与草稿、960px CSS viewport 加 1.25 文字比例压力，以及 Explore 的 EOF 与显式完成/失败终态。

真实登录/应用创建、MCP 或 provider 调用、服务器 artifact 权限/失效返回、真实运行终态与取消确认均未在本次独立审查中连接验证。composition 用合成事件，未测试物理输入法；960px viewport 与文字比例压力也不等于真实浏览器 200% 缩放。四预设全模式的像素对比、触摸拖拽、屏幕阅读器未在此复跑。DEV 网络字节和全构建原始 JS 总量都不能直接代表首页提速；生产 bundle、冷/热路由采样与最终提交绑定由主 agent 的集成验收单独报告。

## 最终集成绑定

主 agent 在 `091d1f4418fac283080d93a0f76dca9aca1f90ed` 上完成最后一轮：1,883 项正式测试、生产浏览器 14 项功能检查与 Home/Search/Agent 独立 context 资源采集、lint/typecheck/i18n/file-size、Web build/budget 及 Desktop build/stage/verify 均 exit 0。最后 staging 为 1,108 文件，`sourceRevision` 精确等于该提交，内容 SHA-256 为 `23907a843aa820b197eda89fb30e95622cb8d2612bc4a14e6702f1a62d89aae5`；上文 `0fd7…` 是补 Agent 侧栏翻译前的那次 staging 证据。

冷加载截图另发现 Agent 右侧栏固定中文，已单独移入中英资源；4 项真实 i18n 定向测试通过，最终浏览器同时核对 Current asset、Runtime Workbench、Delivery and debug、Recent activity。该项由主 agent 在冷加载验收中补派，保持运行状态、原始业务内容与动作语义。精确证据与未验证边界以[最终验收](round2-acceptance.md)和[摘要 JSON](evidence/round2-verification.json)为准。
