export const corpus = [
  {
    id: 'cjk',
    text: '# 中文与 English\n\n这是**重点结论。**AI model 输出包含中文、English 与数字 2026。\n\n- 可核对的结论\n- 保留用户自己的名称\n',
    expect: { text: 'AI model', strong: 1 },
  },
  {
    id: 'unclosed-code',
    text: '代码还在输出：\n\n```typescript\nconst message = "中文 streaming";\nconst next = message.toUpperCase();\n',
    expect: { text: 'toUpperCase', code: 1 },
  },
  {
    id: 'citations',
    text: '结论引用真实片段。<sup>1</sup> 再次引用同一片段。<sup>1</sup>\n\n[安全文档](https://example.com/guide)\n',
    expect: { text: '结论引用', citationButtons: 2 },
  },
  {
    id: 'long-table',
    text:
      '| 编号 | Evidence | Value |\n| --- | --- | ---: |\n' +
      Array.from(
        { length: 180 },
        (_, index) =>
          `| 行 ${index + 1} | 中文 evidence ${index + 1} | ${index * 3} |`,
      ).join('\n') +
      '\n\nEND_TABLE\n',
    expect: { text: 'END_TABLE', tableRows: 181 },
  },
  {
    id: 'math',
    text: '公式 $E=mc^2$ 与 \\(a^2+b^2=c^2\\)。\n\n$$\\frac{1}{2} + \\sqrt{x}$$\n\nEND_MATH\n',
    expect: { text: 'END_MATH', math: 3 },
  },
  {
    id: 'mermaid',
    text: '```mermaid\ngraph LR\n  A[开始] --> B[查找证据]\n  B --> C[形成结论]\n```\n\nEND_MERMAID\n',
    expect: { text: 'END_MERMAID', diagram: 1 },
  },
  {
    id: 'unsafe-html',
    text: '安全正文\n\n<script>window.__rendererProbe="script"</script>\n<img src="x-missing" onerror="window.__rendererProbe=\'image\'">\n<a href="javascript:window.__rendererProbe=1">bad link</a>\n<iframe srcdoc="<script>parent.__rendererProbe=2</script>"></iframe>\n\nEND_SECURITY\n',
    expect: { text: 'END_SECURITY', safe: true },
  },
  {
    id: 'unsafe-links',
    text: '[execute](javascript:window.__rendererProbe=3)\n\n[data](data:text/html,evil)\n\n[good](https://example.com/safe)\n\nEND_LINKS\n',
    expect: { text: 'END_LINKS', safe: true },
  },
]

/** Equal cumulative input chunks; final input also covers intentionally open syntax. */
export function framesFor(text, targetFrames = 36) {
  const step = Math.max(1, Math.ceil(text.length / targetFrames))
  return Array.from({ length: Math.ceil(text.length / step) }, (_, index) =>
    text.slice(0, Math.min(text.length, (index + 1) * step)),
  )
}
