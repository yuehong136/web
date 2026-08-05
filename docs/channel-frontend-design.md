# Channel 管理页前端设计稿（ARCH-6）

> 本稿归 `ARCH-6`，维护协议以 `docs/engineering-modernization-roadmap.md` 的
> 「维护协议（MANDATORY）」为准。**追加一条**：本稿描述的接口形状以 MultiRAG 仓
> `docs/channel-program/CONTRACT.md` 为**唯一真源**；本稿只记录前端侧决策。
> 契约有出入时**先改后端 CONTRACT.md**，不要在这里就地改一份"前端理解的契约"。
>
> 后端账本：`MultiRAG:docs/channel-program/PROGRESS.md`（CHN ID）。
> 本稿涉及的前端条目在那里是 `CHN-U2`~`U7`、`CHN-P5`~`P7`。
> 提交双标：`fix(channel): … (ARCH-6, CHN-U2)`。

## 1. 问题与库存核实（2026-08-05 实扫）

页面在 `src/pages/settings/channels/`，合计 8 个文件、约 1370 行（不含 locale 与 api 层）。
9 条后端路由接了 8 条。**已经做对的两件事不要在重构中弄丢**：

- **密钥只写不读回**：`form-model.ts:181-184` 无条件把 secret 字段置空；
  `src/api/__tests__/channel.test.ts:105-124` 用一个含 `must-not-reach-form` 的伪响应把这条钉死了。
- **空密钥 = 保持不变**：`src/api/channel.ts:147-156` 把空串整个从 payload 里剔除；
  `channel.test.ts:37-51` 三条断言锁住。

断裂点（证据见路线图 ARCH-6 条目，不在此重复）：渲染层按 `provider === 'feishu'` 分支且
`$ref` 解析只在该分支内、序列化层硬编码四个键、zod schema 取 `providers[0]` 而渲染取
`selectedManifest`。三处独立，修好任一条都不足以让第二个 provider 工作。

**类型层面的根因**：`ChannelFormValues.config` 声明为 `Record<string, string>`
（`form-model.ts:24`）、zod 用 `z.record(z.string(), z.string())`（`:217`）。
表单模型在类型上就无法表达嵌套对象与布尔——任何"改成 schema 驱动"的方案都必须先动这里。

## 2. 模块边界

```
src/pages/settings/channels/
  form-spec.ts          新增·纯函数    服务端 FieldSpec → 表单值 ⇄ 提交体
  form-model.ts         瘦身           只剩 binding 助手 + defaults + zod 工厂
  components/
    provider-fields.tsx 改写           按 field.kind 分发到既有 Radix 原语
    channel-form-sheet.tsx  拆分       310 → ≤250 行（软分级要求）
    channel-runtime-banner.tsx  新增   从 sheet 抽出的运行状态条
    channel-basics-section.tsx  新增   从 sheet 抽出的基础字段区
```

**为什么不建平台层的通用 schema-form**：审计发现本仓已有 **6 套**互不相通的"描述 → 表单"
方式（`components/dynamic-form` + datasource 静态目录、channels 的私有契约、model-providers
的 1772 行 if 链、KnowledgeFormFields 具名组合、agent 的算子注册表、`BeginQueryType` 描述符
被两处各渲染一遍）。再造第 7 套的代价是密码可见性、必填星号、i18n fallback 这些通用能力
要维护 7 份。**但收编也不属于本条目**：`components/dynamic-form` 的契约类型寄生在
`pages/settings/datasource/types.ts`（`components/**` 反向 import `pages/**`，已是层级违规），
按钮文案硬编码中文，且完全没有密钥语义——修好它意味着同 PR 迁移 datasource，两个 feature
同时改，风险不对称。

**本条目的做法**：字段类型词表刻意与 `FormFieldType` 同构（`string_list`↔`Tag`、
`secret`↔`Password`、`kind` 开放联合↔`showWhen` 的位置），使 datasource 后续迁移是机械的。
generalise，但分期。这条要在收编时回来兑现，别忘了。

## 3. 公共 API（`form-spec.ts`）

```ts
// 有服务端 form 用 form，没有就回落到既有飞书编译分支 —— 前端的 tolerate 步。
// 这个回落是 CHN-P5/P6 能独立发布的唯一原因，删除它是单独的一步（CHN-P7）。
export function resolveFormFields(
  manifest: ChannelProviderManifest,
): ChannelFormField[]

// 扁平表单值 → 嵌套 config。走点号路径，空 secret 字段整个省略（不是发空值）。
export function assembleConfig(
  fields: readonly ChannelFormField[],
  values: ChannelFormValues,
): Record<string, unknown>
```

`buildChannelMutationPayload`（`src/api/channel.ts`）改为对 `assembleConfig` 结果的一次遍历，
**函数体里不再出现任何字段名**；`ChannelConnectionWriteRequest.config` 由四个硬编码键
改为 `Record<string, unknown>`。

**未知 `kind` 必须渲染为 disabled 字段并显示 label，不得抛错。** 这是老前端在服务端加入
新控件类型（企微的条件可见、OAuth 按钮）时优雅降级的唯一保障，也是交互式配对那条推迟决策
的全部留缝成本。

## 4. 验收口径

- `rg "provider === 'feishu'" src/pages/settings/channels` → 空
- `rg 'FALLBACK_MANIFEST' src/` → 空
- `src/api/__tests__/channel.test.ts` 的既有断言 **`:37-51` 与 `:53-66` 必须原样通过**——
  那是"通用路径逐字节复现飞书 payload"的证明，改了它们就等于没验证。
- 终极口径：后端注册钉钉后，本条目最后一次构建的前端**不重新部署**就能渲染并保存成功。

## 5. 迁移顺序（每步一个 PR，都能独立发布）

| 步  | CHN ID    | 内容                                                                                         | 跨仓依赖                                         |
| --- | --------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| a   | CHN-U2    | 错误码接线 + providers 失败改内联横幅（不再清空整页）                                        | 无（后端没 `error_code` 时回落到今天的通用文案） |
| b   | CHN-U3~U7 | 状态词表收紧 / 表单重置守卫 / invalidate 替代 setQueryData / 提交前 refetch / 下拉服务端搜索 | 无                                               |
| c   | CHN-P5    | `form-spec.ts` 纯函数（含回落分支），不碰组件                                                | 无                                               |
| d   | CHN-P6    | UI 接线 + 修死表单 + 拆 sheet                                                                | 无                                               |
| e   | CHN-P7    | 删客户端兜底 manifest 与飞书编译分支；`listProviders()` 丢弃缺 `form` 的 manifest            | **硬依赖：后端 `CHN-P2` 已部署**                 |

**只有 e 有跨仓依赖**，且它的半态被设计成降级可读：对老后端 `providers` 为空 →
走 a 步的横幅「provider 不可用、新建已禁用」，而渠道列表、卡片、启停、删除全部照常。
没有这个过滤，老后端下会渲染出零字段却可点保存的表单——静默且危险。

## 6. 测试与门禁

**只有 `src/api/__tests__/*.ts` 能被 CI 碰到 channel 代码。**
`src/pages/settings/channels/__tests__/utils.test.ts` 今天存在、写得完整、
**但不被任何 npm script 的 glob 命中**，等于零回归保护。

所以：

- 新增的纯函数必须是可从 `src/api/__tests__/channel.test.ts` 直接 import 的无 React 依赖导出。
- `utils.test.ts` 的 4 条 `revision_stale` 断言迁进 `src/api/__tests__/`，然后删掉原文件。
- 组件行为没有测试门禁——**把人工验证方式写进账本，不要假装有测试**。

体积：新增文件均须 <600 行且**不得写入 `scripts/file-size-baseline.json`**；
`channel-form-sheet.tsx` 当前 310 行已进"300-400 计划拆分"档，本条目只能让它变小。
零新增运行时依赖，`check:bundle-size` 三档不受影响。

## 变更日志

| 日期       | 变更                                                  | 提交   |
| ---------- | ----------------------------------------------------- | ------ |
| 2026-08-05 | 建稿。与 MultiRAG 侧 `docs/channel-program/` 账本配套 | 待回填 |
