# Workbench shell 交接

2026-10-24。主题核心见 [appearance-handoff.md](./appearance-handoff.md)。本 owner 不改 root store/router/provider、共享 UI、Desktop、SidebarUtilities 或 Settings 标题接线。

## 本轮改动

- `src/components/layout/{app-shell,app-top-bar,main-workbench,use-workbench-viewport}.tsx/ts`：任务区保持挂载，宽屏（≥64rem）停靠二级导航，中屏（48–64rem）固定一级图标栏、按需覆盖导航，手机使用抽屉。自动断点不重写用户持久化的 sidebarCollapsed。主任务区自身不新增 overflow-auto，继续由页面模板拥有业务滚动。
- 读取 VisualViewport 正常 scale=1 的可用高度，使软键盘压缩 shell 与已打开导航；pinch zoom 时保留普通布局高度。地址变化按 location key 关闭抽屉，包含同 pathname 的会话切换。
- `Sidebar.tsx`：使用密度/文字缩放控制高度与 rail 宽度，四个一级入口固定，保留 More 和原 hover/ArrowRight flyout；一级链接支持 ArrowUp/ArrowDown/Home/End，仍保持原生链接与 Tab。
- `mobile-sidebar-sheet.tsx`：手机只按需挂一份二级导航，不再同时运行被 CSS 隐藏的桌面副本；路由选择关闭，记录实际打开按钮；resize 隐藏原触发器时向可见导航按钮回焦。
- `secondary-navigation-content.tsx`：显示分组标题、明确当前项、长标题截断；desktop 自管导航滚动，mobile 委托 Sheet viewport，保持注册 API 及 contentOnly。
- `src/locales/{en-US,zh-CN}/layout.ts`：同步 skip link 与主任务区无障碍名称。主任务区是可聚焦且有名称的 section，不给已有页面 main 再套 main。

## ContextPanel 合同

`src/components/patterns/context-panel.tsx` 是纯展示组合件，不读 store、API、i18n：

- `title: ReactNode`、`children`；可选 `description`、`actions`、`footer`。
- `width?: 'sm' | 'md' | 'lg' | 'full'`，默认 md。
- `scroll?: 'auto' | 'none'`，默认 auto；header/footer 固定，body 是唯一可滚动区。父层已管滚动时显式 none。
- `onClose` 提供时必须同时提供 `closeLabel`；关闭按钮使用共享 Button/Lucide X。
- `className`、`bodyClassName`、`headerClassName`、`titleId` 与 HTMLElement attributes。
- h2 与 aside 的 aria-labelledby 自动关联。宽度/标题改变保留业务子树。

Reference/Chat/Search 的业务装配由主 agent 继续维护，直接 import 本组件路径。

## 实际验证

以下均 exit 0：

- 本任务 layout/pattern/locale 源码和新增测试的 targeted ESLint：0 errors / 0 warnings。
- `npx vitest run src/components/layout/__tests__/responsive-workbench.test.tsx src/components/patterns/__tests__/context-panel.test.tsx src/components/layout/__tests__/settings-workspace.test.tsx src/components/layout/__tests__/invitation-entrypoints.test.tsx src/components/patterns/__tests__/navigation-flyout.test.tsx`：29/29。
- 新增 9 项覆盖：响应断点、不写偏好、不重挂任务、移动导航唯一挂载、同路径导航关闭、键盘 viewport 与 zoom、主题/语言切换保留 drafts、方向键/skip link、resize 回焦备用控件、ContextPanel 命名/关闭与内容状态。
- `npm run verify:test-inventory`：新增测试属于唯一 source-vitest lane。
- `npm run lint:file-size`、`git diff --check`。

Settings 旧列表预期因新增 Appearance 由主 agent 更新，本 owner 未编辑该受保护测试。最初另一个实际打开按钮回焦失败已修复并通过本次 29 项复测。

本 owner 未运行全量 build/test；实际浏览器的明暗/四预设/中屏/软键盘交互由主 agent 统一验收。JSDOM 的 VisualViewport 模拟不是手机真实软键盘证明。未 git add/commit/push。
