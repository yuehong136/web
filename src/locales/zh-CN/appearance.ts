export const appearanceResource = {
  appearance: {
    title: '外观',
    description: '为你的工作方式留出空间。修改会立即应用并保存在这台设备上。',
    reset: '恢复默认',
    saved: '已保存在此设备',
    preset: '工作台风格',
    presetDescription: '选择配色，阅读字号与信息密度仍可独立调整。',
    presets: {
      ink: {
        name: '墨',
        description:
          '中性灰阶配墨色主按钮，强调色只用于选中、焦点与引用。默认风格。',
      },
      mist: {
        name: '雾蓝',
        description: '冷灰蓝底色与钢蓝主按钮，延续原来的默认风格。',
      },
      celadon: {
        name: '青瓷',
        description: '带绿意的灰底与沉静的青瓷色，适合检索与阅读。',
      },
      clay: {
        name: '陶土',
        description: '暖色纸面配陶土强调，长回答使用衬线字体，适合写作与研究。',
      },
      iris: {
        name: '鸢尾',
        description: '紫罗兰强调与紫灰底色，适合 Agent 编排与创作。',
      },
      amber: {
        name: '琥珀',
        description: '石墨底色配琥珀高亮，适合运维、数据与开发工作。',
      },
    },
    mode: '明暗模式',
    modes: { system: '跟随系统', light: '浅色', dark: '深色' },
    density: '信息密度',
    densities: { comfortable: '舒适', compact: '紧凑' },
    textScale: '阅读字号',
    scales: { standard: '标准', larger: '较大', largest: '最大' },
    motion: '动效',
    motions: { system: '跟随系统', reduced: '减少动效' },
    contrast: '对比度',
    contrastDescription:
      '高对比会加深次要文字、描边和焦点环，适合强光环境或需要更清晰的文字时使用。',
    contrasts: { standard: '标准', high: '高' },
    action: '主按钮颜色',
    actionDescription: '主按钮与发送按钮使用墨色或强调色。',
    actions: { scheme: '跟随风格', ink: '墨色', accent: '强调色' },
    language: '界面语言',
    languageDescription: '只影响界面。你的消息与模型回答各自保留原有语言。',
    preview: '实时预览',
    previewDescription: '以当前外观展示一段示例对话。',
    previewQuestion: '帮我梳理研究资料中的关键观点。',
    previewAnswer:
      '从证据出发。归纳相关发现，对比不同来源，再把有依据的观点整理成下一步行动。',
    previewSource: '研究笔记',
    previewSourceDetail: '从回答打开来源，可以在这里查看支持观点的原始材料。',
    previewComposer: '继续追问',
    previewSend: '预览发送按钮',
    previewMenu: '查看来源',
    previewDocument: '来源详情',
  },
}
