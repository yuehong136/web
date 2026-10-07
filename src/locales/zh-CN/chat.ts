export default {
  chat: {
    stream: {
      failed: '生成失败，请重试。',
      interrupted: '生成未完成，已保留已生成的内容。',
    },
    scroll: {
      region: '对话消息',
      latest: '回到底部',
      newContent: '有新内容',
    },
    knowledgePrompt: {
      block: '以下是知识库：\n{knowledge}\n以上是知识库。',
      inserted:
        '已在系统提示词末尾插入 {knowledge}，检索到的知识库内容会填充到这里。',
      insertedOnSave:
        '已在系统提示词末尾补充 {knowledge}，否则应用不会检索知识库。',
      missing:
        '已关联知识库或联网搜索，但系统提示词中没有 {knowledge} 占位符，检索内容无法传给模型。保存时会自动补充到末尾。',
      insert: '插入 {knowledge}',
    },
  },
}
