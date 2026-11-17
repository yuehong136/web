export const pipelineWorkbenchMessages = {
  header: {
    title: 'Pipeline 运行与日志工作台',
    idleHint: '上传文档触发数据流处理，并在右侧时间线和输出视图查看结果。',
    lastRunAt: '最近一次运行 {{time}}',
    reset: '清空当前 Pipeline 运行记录',
    close: '关闭 Pipeline 工作台',
  },
  workbench: {
    description:
      '上传文档或填写 Begin 输入，启动 Pipeline 数据流，查看节点时间线与最终输出',
    tabs: {
      run: '运行',
      log: '日志',
      output: '输出',
    },
    stop: '停止',
    cancelling: '取消中…',
    timelineTitle: '数据流时间线',
  },
  runPanel: {
    uploadDocument: '上传文档',
    beginInputsTitle: 'Begin 输入',
    beginInputsHint:
      '上传文档或填写 Begin 节点定义的字段，点击"启动 Pipeline"会保存当前画布并触发数据流处理。',
    start: '启动 Pipeline',
    running: '运行中…',
    startFailed: '启动失败',
    quickRunTitle: '快速运行',
    quickRunHint:
      '当前 Begin 节点没有定义输入字段。直接上传样本文档即可启动 Pipeline 数据流。',
    selectSamples: '选择样本文档',
  },
  outputPanel: {
    title: 'END 节点输出',
    viewResult: '查看结果',
    downloadJson: '下载 JSON',
    resultReady: '已准备结果页上下文，可跳转查看本次运行结果。',
    resultMissingDocId:
      '已记录本次文件；缺少 doc_id 时只能在当前面板查看 END 输出。',
    empty:
      'Pipeline 暂无可下载的 END 输出。运行完成后此处会展示数据流的最终结果。',
    errorTitle: '运行异常',
  },
  timeline: {
    empty: 'Pipeline 暂未启动或还没有日志，可在运行页填写开始输入并启动。',
    node: '节点',
    toolNode: '工具节点',
    progress: '进度',
    runMessages: '运行消息',
    subtasks: '子任务',
  },
  notices: {
    missingCanvasForSave: '缺少画布 ID，无法保存当前 Pipeline 上下文',
    saveFailed: '保存失败，无法启动 Pipeline',
    missingCanvasForRun: '缺少画布 ID，无法运行 Pipeline',
    tokenizerRequired: '请先添加 Tokenizer 节点，再启动 Pipeline',
    noDownloadableOutput: '当前 Pipeline 暂无可下载的输出',
    noResult: '当前 Pipeline 还没有可查看的结果',
    resultMissingDocId:
      '已生成 END 输出，但缺少文件 doc_id，暂不能打开结果落地页',
  },
}
