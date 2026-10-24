export const browserMessages = {
  browserUploadFiles: '上传文件',
  browserRequiredModel: '请选择模型。',
  browserUploadedFile: '已上传文件引用',
  browser: '浏览器',
  browserDescription:
    '通过兼容 OpenAI 的模型和提示词自动执行浏览器任务，上传有权访问的文件或网址，并保存下载文件。',
  maxSteps: '最大步数',
  headless: '无头模式',
  enableDefaultExtensions: '启用默认扩展',
  enableDefaultExtensionsTip:
    '启用 browser-use 的广告拦截、Cookie 处理和网址清理扩展，运行时可能下载扩展。',
  chromiumSandbox: 'Chromium 沙箱',
  chromiumSandboxTip:
    '普通宿主机建议启用 Chromium 沙箱；以 root 运行的容器可能需要关闭。',
  persistSession: '持久化浏览器会话',
  persistSessionTip: '复用当前用户、Agent 和浏览器节点的会话，避免重复登录。',
  uploadSources: '上传来源',
  uploadSourcesTip:
    '添加文件 ID、HTTP(S) 网址或引用已上传文件的变量，每行一个来源。',
  addUploadSource: '添加上传来源',
  removeUploadSource: '移除上传来源 {{index}}',
  uploadSourceLabel: '上传来源 {{index}}',
  uploadSourcePlaceholder:
    '文件 ID、https://example.com/file.pdf 或 {CodeExec:files@result}',
  browserInvalidNumber: '请输入允许范围内的有效数字。',
  browserRequiredPrompt: '请输入浏览器任务提示词。',
}
