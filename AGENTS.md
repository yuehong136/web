# AGENTS.md

本仓库 AI 编码规则的唯一入口。[CLAUDE.md](CLAUDE.md) 仅导入本文件，不维护独立规则。专题规则按需读取。

**维护规则**：通用边界只维护在本文件，专题合同只维护在 `docs/agent-guidance/` 对应文档；工具入口仅做映射，不复制或翻译整套规则。团队手册提供理由和示例，引用对应规则，发现冲突时修复重复内容。产品 UI 的中英 locale 同步要求不受影响。

## 工作范围与完成条件

- 从用户目标、相关文件及当前 Git 状态开始；保留已有未提交改动。只读取任务涉及的专题和依赖，不为小修改扫描全仓或通读全部手册。
- 已授权范围内的本地编辑、检查、构建及相关失败修复可连续完成，无需逐步确认。只有缺失信息会改变目标，或下一步超出授权、涉及不可逆/外部影响时才询问；已有明确授权不重复询问。部署、发布、生产数据变更不由普通代码修改请求自动授权。
- 完成意味着：实现目标，执行与影响面匹配的验证，查看结果，修复本次变更引起的失败，再报告结果。UI 任务查看实际渲染和受影响交互；相关检查通过后不无理由扩大全量测试。外部依赖阻塞时交付可审阅改动并说明未验证项，不把首版实现当作完成。
- 最终说明改了什么、实际跑过什么、仍有哪些限制。不得把未运行、未读回或仅有计划的事项写成已通过。

## 仓库约定

- React + TypeScript strict + Vite；依赖版本与命令以 [package.json](package.json)、[package-lock.json](package-lock.json) 为准，不在指令里复制版本快照。
- 内部引用用 `@/`；新文件用命名导出，组件文件 `kebab-case.tsx`，hook 文件 `use-*.ts`。保留遗留页面已有默认导出。
- 源文件大小按 [文件体积基线](scripts/file-size-baseline.json) 棘轮执行：新文件不得超过 600 行，在册文件不得增长。拆分后只收紧基线；避免与任务无关的重构和全仓格式化。
- UI 复用 `src/components/ui/` → `patterns/` → `page-templates/`；业务编排留在 `src/pages/` 或 feature 容器。局部特例通过 props/组合实现；共享缺陷可直接修复并检查调用方兼容性。
- 视觉语义使用设计令牌，图标仅用 `lucide-react`；产品 UI 文案走 i18n，中英资源同步。模型输出、用户内容及协议字段不翻译。
- HTTP 归领域 API；普通请求使用共享 `APIClient`，流式请求复用领域传输与共享 SSE 解析。服务器状态归 TanStack Query，UI 状态归 Zustand；流式 chunk 不进 Query cache；仅持久化 UI 偏好。
- 模型/工具输出视为不可信输入；HTML 用 `SafeHtml` 或沙箱 iframe，密钥只留服务端，不记录 prompt、访问凭证或工具敏感内容。脱敏的 token 用量/成本统计与凭证分开处理，具体边界见安全专题。

## 按任务读取

下表是触发条件，不是每次开始工作的阅读清单；只读相关节。专题中的项目合同在对应修改中仍然生效。

| 修改范围                                                  | 读取入口                                                                                                                                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 模块拆分、命名                                            | [Frontend · Organization](docs/agent-guidance/frontend.md#organization)                                                                                                                                    |
| 页面、共享组件、样式、图表、无障碍                        | [Frontend · UI](docs/agent-guidance/frontend.md#ui)；token 实现细节见 [开发指南](src/themes/development-guide.md)                                                                                          |
| UI 文案、语言服务、share/widget locale                    | [Frontend · i18n](docs/agent-guidance/frontend.md#i18n)                                                                                                                                                    |
| API、Query/store、mutation 反馈、路由错误                 | [Runtime · Data](docs/agent-guidance/runtime.md#data)                                                                                                                                                      |
| 聊天/Agent 流、结构化输出、MCP                            | [Runtime · Streaming](docs/agent-guidance/runtime.md#streaming)                                                                                                                                            |
| iframe、share/widget、附件对外展示                        | [Runtime · Embed](docs/agent-guidance/runtime.md#embed) 及 [Security](docs/agent-guidance/runtime.md#security)                                                                                             |
| HTML/链接/错误渲染、隐私、环境变量                        | [Runtime · Security](docs/agent-guidance/runtime.md#security)                                                                                                                                              |
| Shared Client、Desktop、Run 协议、Host                    | [Runtime · Client Platform](docs/agent-guidance/runtime.md#client-platform)，再按能力选择平台文档                                                                                                          |
| 测试、构建、依赖、CI、提交/PR 验证                        | [验证与构建](docs/agent-guidance/verification.md)                                                                                                                                                          |
| `src/pages/settings/channels/**`、channel API/hook/locale | [Channel 设计](docs/channel-frontend-design.md)；接口以**后端仓** `docs/channel-program/CONTRACT.md` 为准，任务账本为该仓 `docs/channel-program/PROGRESS.md`；提交用 `channel` scope 并标注 ARCH/CHN 双 ID |
| Agent 能力规划或历史实现依据                              | [工程路线图](docs/engineering-modernization-roadmap.md) 与 `src/pages/agent/` 对应实现/测试；历史说明缺失时以代码和 Git 历史核实                                                                           |
| 完成 SEC/ARCH/ENG/HYG 工程债条目                          | 更新唯一账本 [工程现代化路线图](docs/engineering-modernization-roadmap.md) 的对应状态                                                                                                                      |
| 需要规则理由或示例                                        | [团队手册](AI前端技术栈开发规范.md) 的相关章节                                                                                                                                                             |

## 常用验证

- 纯文档：检查 diff、链接/路径、命令是否存在及引用一致性；不要求 Web build 或业务测试。
- 源码/配置：按 [验证矩阵](docs/agent-guidance/verification.md#scope) 选受影响检查；新增或修改关键行为需要有针对性的回归覆盖，已有覆盖充分时不重复造测试。
- `npm run dev` 启动本机开发服务；`npm run build` 包含完整 Web 类型检查。没有裸 `test`、`format`、`typecheck` 脚本；`npm run test:ci` 是完整测试入口。
- pre-commit 只跑 lint-staged，不替代相关检查；禁止用 `build:docker` 绕过类型错误，禁止无用户明确指令使用 `--no-verify`。
- 提交使用 Conventional Commits，只暂存本任务文件。PR 写实际验证结果；UI 改动附明暗主题截图，无法验证时明确说明。

## 维护这些指令

新增规则应记录项目特有的边界、容易踩错的事实或完成标准；可由代码、lint、测试直接表达的内容指向其来源。长示例和专题细节放支持文档，避免复制依赖表、历史统计或逐步操作配方。仓库 skill 的 description 只说明明确适用场景；多流程 skill 用入口路由到按需材料，不以宽泛关键词强制加载。

整理原则参考 [OpenAI：Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)，适用于本仓各编码工具，不依赖特定模型。
