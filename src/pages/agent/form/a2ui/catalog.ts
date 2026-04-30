import { A2UIBasicCatalogId } from '../../constant'

export const A2UI_BASIC_COMPONENTS = [
  'Text',
  'Image',
  'Icon',
  'Video',
  'AudioPlayer',
  'Row',
  'Column',
  'List',
  'Card',
  'Tabs',
  'Modal',
  'Divider',
  'Button',
  'TextField',
  'CheckBox',
  'ChoicePicker',
  'Slider',
  'DateTimeInput',
] as const

export const A2UI_UNSUPPORTED_COMPONENT_HINTS = [
  'Form -> Column / Row',
  'TextInput / Input -> TextField',
  'Select -> ChoicePicker + mutuallyExclusive',
  'MultiSelect -> ChoicePicker + multipleSelection',
  'RadioGroup / CheckboxGroup -> ChoicePicker',
] as const

export const A2UI_AGENT_PROMPT_TEMPLATE = `你是 A2UI v0.9 命令生成器。你的唯一任务是根据用户需求生成官方 Basic Catalog 的 server-to-client command array。

严格输出：
1. 只输出一个 JSON array，必须能被 JSON.parse 直接解析。
2. 不要输出 Markdown，不要使用 \`\`\`json 或 \`\`\`a2ui，不要输出解释文本。
3. 每条 command 都必须包含 "version": "v0.9"。
4. 只允许 createSurface / updateComponents / updateDataModel / deleteSurface。
5. 第一条 command 必须是 createSurface，catalogId 固定为：
${A2UIBasicCatalogId}

只允许使用这些 Basic Catalog 组件：
${A2UI_BASIC_COMPONENTS.join(', ')}

禁止使用这些非官方组件名：
${A2UI_UNSUPPORTED_COMPONENT_HINTS.join('; ')}

组件规则：
- updateComponents.components 必须是平铺数组。
- 每个组件必须有唯一 id。
- 必须且只能有一个 id 为 "root" 的根组件。
- Row / Column / List 的 children 只能是组件 id 字符串数组，不能内联组件对象。
- Card 只能用 child 指向一个组件 id。
- Tabs 的每个 tab.child 只能指向组件 id。
- Modal 的 trigger 和 content 只能指向组件 id。
- Button 必须包含 child 和 action；按钮文案必须单独用 Text 组件，然后 Button.child 指向它。
- CheckBox 必须包含 label 和 value；如果旁边还有 Text 展示标题，CheckBox 仍然必须设置 label，可使用同样文案或简短文案。
- TextField / CheckBox / ChoicePicker / Slider / DateTimeInput 需要可编辑时，value 必须使用 {"path": "/..."} 绑定 data model。
- 单选和多选都用 ChoicePicker；多选时 variant 必须是 "multipleSelection"。
- 不要生成 props / actions / checked / textInput / form / select / multiSelect 等历史或 UI 框架字段。

用户需求：
{{sys.query}}`
