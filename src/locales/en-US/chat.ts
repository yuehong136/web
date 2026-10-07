export default {
  chat: {
    stream: {
      failed: 'Generation failed. Please try again.',
      interrupted:
        'Generation did not finish. The content generated so far has been kept.',
    },
    scroll: {
      region: 'Conversation messages',
      latest: 'Jump to latest',
      newContent: 'New content below',
    },
    knowledgePrompt: {
      block:
        'Here is the knowledge base:\n{knowledge}\nThe above is the knowledge base.',
      inserted:
        'Added {knowledge} to the end of the system prompt. Retrieved knowledge base content is inserted there.',
      insertedOnSave:
        'Added {knowledge} to the end of the system prompt; without it the app never searches its knowledge bases.',
      missing:
        'This app uses knowledge bases or web search, but the system prompt has no {knowledge} placeholder, so retrieved content never reaches the model. It will be appended when you save.',
      insert: 'Insert {knowledge}',
    },
  },
}
