# Agent Canvas Embed（卫星目录）

> **本目录为临时第三方需求，非项目长期规划，可整体删除。**
>
> 任何想从这里抄设计、或把此处的代码"提拔"到主仓库其他位置的人，请先阅读 `/Users/dxl/.claude/plans/snuggly-hugging-platypus.md` 中的 Context 部分理解前提。

iframe 嵌入版本的 Agent 编排画布。第三方通过 `<iframe src="/agent/<id>/embed?...">` 嵌入到自己的产品里，鉴权使用**平台 JWT**（由第三方后端通过既有集成下发）。

---

## 启停开关

由环境变量 `VITE_ENABLE_AGENT_EMBED` 控制：

```bash
VITE_ENABLE_AGENT_EMBED=true npm run dev      # 启用
VITE_ENABLE_AGENT_EMBED=false npm run build   # 关闭（路由不挂，摇树后产物里无此目录）
```

关闭时 `src/lib/router.tsx` 完全不引用 `AgentEmbedPage`，本目录是死代码。

---

## 卸载步骤（三方需求终止时）

1. 删除整个 `src/pages/agent/embed/` 目录
2. 在 `src/lib/router.tsx` 中删除：
   - `const AgentEmbedPage = lazy(...)` 这行
   - `VITE_ENABLE_AGENT_EMBED` 的环境变量判断块
   - `/agent/:id/embed` 路由
3. 删除 `public/canvas-embed-test.html`
4. 在 `.env.example` 等环境模板中删除 `VITE_ENABLE_AGENT_EMBED`
5. CI/CD 配置如果有 `VITE_ENABLE_AGENT_EMBED=true` 的构建参数，也一并删除

完成后主仓库**零残留**。

---

## 禁止条款

本卫星可以 import 主仓库的 UI / hooks / API client，但**不允许**反过来污染：

- **禁止**从卫星 import 任何会读 `useAuthStore` / `useUIStore` 等写回 persist store 的方法。仅用于读取一次性值的 selector 也要谨慎评估。
- **禁止**调用 `apiClient.setAuthToken(...)` —— 会写 localStorage 污染主站登录态。必须用本目录 `apiclient-embed-patch.ts` 暴露的 `setEmbedJwt(...)`。
- **禁止**恢复 `apiClient.clearAuthState` / `notifyUnauthorized` 的原实现。`installApiClientPatch` 把它们改成内存级、postMessage 级，刻意避开 `auth:logout` 派发与 `window.location.reload`。
- **禁止**把 JWT 放进 URL / localStorage / sessionStorage / cookie。JWT 仅经 postMessage `embed-init` 注入，存放在 apiClient 内存字段。
- **禁止** dispatch 任何全局自定义事件（`auth:logout` 等）。
- **禁止**直接 `navigate(...)` 跳到 `/agents`、`/auth/login`、`/agent/:id/explore` 等出站路径，统一改成 `postMessage({type:'navigate-request', target:...})` 让宿主决策。
- **禁止** `postMessage(payload, '*')` —— origin 必须严格校验，传 `parentOrigin`。
- **禁止**新增 `useEffect` 注册 `window.onbeforeunload` 等阻拦宿主页关闭的行为。

---

## URL 协议

iframe 加载 URL：

```
/agent/<canvas-id>/embed
  ?parent_origin=https://embedder.example.com
  &show=save,run,nav,publish,webhook,settings,variables   # CSV，按需开启；save 总在
  &theme=light|dark
  &locale=zh-CN|en-US
  &hide_rail=1                                            # 隐藏右栏
```

| 参数            | 必需 | 说明                                                                         |
| --------------- | ---- | ---------------------------------------------------------------------------- |
| `parent_origin` | ✅   | 宿主页 origin，严格校验所有 postMessage 来源；非法立即报错页                 |
| `show`          | ❌   | 工具栏可见按钮 CSV 白名单；默认仅 `save`；`share` 永久禁用（不接受任何配置） |
| `theme`         | ❌   | 初始主题；可被运行时 `set-theme` 覆盖                                        |
| `locale`        | ❌   | 初始语言；可被运行时 `set-locale` 覆盖                                       |
| `hide_rail`     | ❌   | `1` / `true` / `yes` 隐藏右栏；默认显示                                      |

**URL 永不携带 JWT 或 DSL 数据**。

---

## postMessage 信封

参见 `protocol.ts`。所有信封必带 `v: 1`；未来若有 breaking change 必须升版本号。

### iframe → host

| `type`             | 触发时机                   | 载荷                                                                      |
| ------------------ | -------------------------- | ------------------------------------------------------------------------- |
| `ready`            | iframe 挂载完成            | —                                                                         |
| `auth-expired`     | 任一 API 收到 401          | —                                                                         |
| `save-success`     | 用户保存成功               | `agentId`, `title`                                                        |
| `save-error`       | 保存失败                   | `error`                                                                   |
| `run-start`        | （P1+）运行启动            | `runId`                                                                   |
| `run-end`          | （P1+）运行结束            | `runId`, `status`                                                         |
| `navigate-request` | 用户点了出站按钮           | `target` ∈ {back, explore, webhook, share, versions, settings, variables} |
| `resize`           | 画布尺寸变化（节流 100ms） | `height`                                                                  |
| `error`            | 卫星内部异常               | `code`, `message`                                                         |

### host → iframe

| `type`           | 触发时机                         | 载荷                          |
| ---------------- | -------------------------------- | ----------------------------- |
| `embed-init`     | 收到 `ready` 后立即发            | `jwt`，可选 `theme`、`locale` |
| `auth-refreshed` | 收到 `auth-expired` 后刷出新 JWT | `jwt`                         |
| `set-theme`      | 宿主主题变化                     | `theme`                       |
| `set-locale`     | 宿主语言变化                     | `locale`                      |
| `trigger-save`   | 宿主主动要求 iframe 保存         | —                             |

---

## 宿主接入示例（最小化）

```html
<iframe
  id="agent-canvas"
  src="https://platform.example.com/agent/abc-123/embed?parent_origin=https://embedder.example.com&show=save,run"
  style="width:100%;height:720px;border:0"
  allow="clipboard-read; clipboard-write"
></iframe>

<script>
  const PLATFORM_ORIGIN = 'https://platform.example.com'
  const iframe = document.getElementById('agent-canvas')

  let currentJwt = '<由你的后端通过现有集成颁发>'

  window.addEventListener('message', (event) => {
    if (event.origin !== PLATFORM_ORIGIN) return
    const msg = event.data
    if (!msg || msg.v !== 1) return

    switch (msg.type) {
      case 'ready':
        iframe.contentWindow.postMessage(
          {
            v: 1,
            type: 'embed-init',
            jwt: currentJwt,
            theme: 'light',
            locale: 'zh-CN',
          },
          PLATFORM_ORIGIN,
        )
        break
      case 'auth-expired':
        // 调你的后端拿新 JWT 后回灌
        refreshJwt().then((nextJwt) => {
          currentJwt = nextJwt
          iframe.contentWindow.postMessage(
            { v: 1, type: 'auth-refreshed', jwt: nextJwt },
            PLATFORM_ORIGIN,
          )
        })
        break
      case 'save-success':
        console.log('保存成功', msg.agentId, msg.title)
        break
      case 'save-error':
        console.warn('保存失败', msg.error)
        break
      case 'navigate-request':
        // 例如关闭 iframe / 回到宿主主页 / 显示发布提示
        console.log('用户点了', msg.target)
        break
      case 'resize':
        iframe.style.height = msg.height + 'px'
        break
    }
  })
</script>
```

---

## 部署侧（运维一次性）

iframe 路径需要单独配置 CSP 放开嵌入：

```nginx
location ~ ^/agent/[^/]+/embed {
    add_header Content-Security-Policy "frame-ancestors https://embedder-a.example.com https://embedder-b.example.com" always;
    # 不要再设 X-Frame-Options（会覆盖 CSP frame-ancestors）
    try_files $uri /index.html;
}
```

主站其他路径**继续保留** `X-Frame-Options: DENY` 默认值。

---

## 本地联调

```bash
VITE_ENABLE_AGENT_EMBED=true npm run dev
```

浏览器打开 `http://localhost:5173/canvas-embed-test.html`，按页面提示填入 canvas id + 一个合法 JWT（建议先在 `/auth/login` 登录后从 localStorage `auth_token` 拷一份），点"挂载"即可对照日志面板观察 postMessage 流。

---

## 主仓库后续演进对本卫星的影响

| 主仓库变更                                                           | 卫星影响                                           | 防护手段                                                     |
| -------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `EditorRuntimeRail` props 变化                                       | 编译期失败                                         | `npm run typecheck:agent-strict` 纳入卫星目录                |
| `apiClient` 改了 `clearAuthState` / `notifyUnauthorized` 名称 / 签名 | monkey-patch 失效（运行时不报错但 401 副作用回归） | 卫星单测覆盖 patch 行为；改动主仓库 client.ts 时务必看本目录 |
| 给共享组件加 `useAuthStore` 写入逻辑                                 | iframe 内会污染主站登录态                          | README 禁止条款 + 本卫星避免 import 该组件                   |
| 画布 store（`pages/agent/store.ts`）启用 persist                     | iframe 状态会写主站 localStorage                   | 主仓库改动需评审；本卫星目录无可做防护                       |
