# Studio / Agents 表面迁移交接

2026-10-24。源码已稳定交主 agent 集成；本文件只记录本 owner 的实际专项结果。外观核心与导航分别见 [appearance-handoff.md](./appearance-handoff.md)、[shell-handoff.md](./shell-handoff.md)。未 git add / commit / push。

## 页面与组合件

- `src/pages/studio/StudioPage.tsx` 与 `src/pages/agents/index.tsx`：统一 ListPageTemplate、PageHeader、PageStates、工具栏与真实分页；删除当前页推导的 KPI 装饰卡，仅显示接口 total。排序明确只作用当前页，不为统计新增请求。失败态保留真正的 refetch，清空筛选与首个资产空态分开。
- `src/components/studio/{AppCard,AppListView,AppEmptyState}.tsx` 与 `app-{actions,avatar,metadata}.tsx`：纯展示组合；调用方提供领域动作。标题原生按钮、独立勾选与 ActionMenu，图标全部 Lucide；状态未知时不伪称草稿。中性头像和表面、文字、焦点均消费语义 token。
- `src/pages/agents/components/agent-{card,list-view,empty-state,actions,avatar,metadata}.tsx`：同样布局与动作模型；保留 Agent / Pipeline、标签编辑及既有领域操作。
- `src/components/patterns/asset-list-controls.tsx`：受控 view、timeFormat、sortDescending 与回调，labels 由调用方翻译，不拥有状态或请求。`list-pagination.tsx` 保持原 API，窄屏使用简洁页码/总数与上下一页，按钮正确 disabled / aria-current。
- 两个根页面使用 router 导航；主题和语言变更不改变树的 key，不清空筛选、选择或弹窗草稿。Studio 可见页全选保留非当前页选中项，删除失败保留目标与选择，成功后只移除实际删除项。

## 创建、导入和反馈

- Studio `components/{CreateProjectModal,CreateAppModal,ImportTemplateDialog}.tsx`：项目类型使用键盘可选 radio；原生 Label/Input/Textarea 与唯一 id；必要字段、UTF-8 名称长度、图标文件约束反馈均双语。创建失败保留草稿，成功才关闭并导航。
- Agent `components/{create-agent-dialog,import-agent-dialog}.tsx`：移除硬编码中文和实现术语；失败保留名称、类型或文件，固定安全文案支持显式重试。导入不识别 `{}` 为有效工作流，合法空 graph 仍可导入。
- Studio 导入显示服务端真实 imported / failed 数量，并验证 total 一致；零导入不宣称成功。网络失败保留文件重试；部分成功保留失败项和可理解的纠正入口，避免直接重传整个归档造成重复。服务端原始错误与 warnings 不直接展示。
- `src/hooks/use-dialog-apps.ts` 仅迁移反馈 i18n、安全固定文案与本地错误 owner 标记；`src/hooks/use-agent-mutation.ts` 仅删除反馈双语化。API、请求字段、Query key 和流式协议均未改变。Agent 创建使用原 mutation 的错误 owner，UI 不再重复成功 toast。
- `src/locales/{en-US,zh-CN}/{studio,agents}.ts`：上述页面、卡片和弹窗同步；保留仍有消费者的旧 key。

## 实际验证

以下均 exit 0：

- 本轮 `npx vitest run` 四个文件：`src/pages/studio/__tests__/studio-workspace.test.tsx`、`template-import.test.tsx`、`src/pages/agents/__tests__/agent-workspace.test.tsx`、`src/hooks/__tests__/use-agent-mutation.test.tsx`，20/20。
- `npx vitest run src/pages/agents/components/__tests__/agent-tag-editor.test.tsx`：4/4。与上项合计 5 文件 24 项。
- 覆盖真正加载失败/refetch、当前页排序/时间格式、接口分页边界、筛选/视图/选中/草稿在 preset 与 locale 改变时保留、可见页选择不丢跨页项、删除失败保持目标、创建失败保持草稿、键盘项目类型导航、格式错误导入零副作用、部分/零导入的真实反馈、失败文件重试与原始错误不泄漏。
- 本任务全部新增/修改源码和测试的 targeted ESLint：0 errors；仅 `use-dialog-apps.ts:115` 既有 API 类型 `prompt_config?: any` 有 1 warning，未为消警告改变 API 类型。
- 全 catalog 质量函数检查 `catalogFindings`：0 findings。
- `npm run verify:test-inventory`：258 个测试文件均归属唯一 lane（107 source-node / 131 source-vitest / 16 desktop-node / 4 tooling-node）。
- `npm run lint:file-size`：22 个在册债务文件均未增长；`git diff --check` 无错误。

StudioPage 由原 588 行缩为 345 行，Agents 根由 525 行缩为 475 行；改动在册文件未增长，新文件均低于 600 行。测试采用 JSDOM、受控 API/Query mock，不能代替真实后端 mutation 或浏览器响应式验收。主 agent 统一执行全量 lint / test:ci / build 与实际页面截图；本 owner 未重复全量入口。

旧 `useStudioStats` 及其历史测试仍保留，但页面不再消费；后续若无其他消费者可独立清理。历史 token key 继续服务既有业务组件，未在本轮扩大到所有领域。Studio 编辑器 preview / chat 由 run owner 单独维护。
