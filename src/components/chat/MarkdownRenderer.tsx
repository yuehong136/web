import markdownit from 'markdown-it';

const md = markdownit({ 
  html: true, 
  breaks: true,
  linkify: true,
  typographer: true
});

// 配置markdown-it以支持更好的渲染
md.renderer.rules.heading_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  const tag = token.tag;
  const level = parseInt(tag.charAt(1));
  
  // 为标题添加合适的样式类
  const styleClasses = {
    1: 'text-2xl font-medium mb-4 mt-6',
    2: 'text-xl font-medium mb-3 mt-5',
    3: 'text-lg font-medium mb-2 mt-4',
    4: 'text-base font-medium mb-2 mt-3',
    5: 'text-sm font-medium mb-1 mt-2',
    6: 'text-xs font-medium mb-1 mt-2'
  };
  
  token.attrJoin('class', styleClasses[level as keyof typeof styleClasses] || '');
  return renderer.renderToken(tokens, idx, options);
};

// 为段落添加间距
md.renderer.rules.paragraph_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'mb-3 last:mb-0');
  return renderer.renderToken(tokens, idx, options);
};

// 为列表添加样式
md.renderer.rules.bullet_list_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'list-disc list-inside mb-4 space-y-1');
  return renderer.renderToken(tokens, idx, options);
};

md.renderer.rules.ordered_list_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'list-decimal list-inside mb-4 space-y-1');
  return renderer.renderToken(tokens, idx, options);
};

// 为代码块添加样式
md.renderer.rules.code_inline = function (tokens, idx, _options, _env, _renderer) {
  const token = tokens[idx];
  return `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${token.content}</code>`;
};

md.renderer.rules.fence = function (tokens, idx, _options, _env, _renderer) {
  const token = tokens[idx];
  const langName = token.info ? ` data-language="${token.info}"` : '';
  
  return `<pre class="bg-muted p-4 rounded-lg overflow-x-auto mb-4"><code class="text-sm font-mono"${langName}>${token.content}</code></pre>`;
};

// 为链接添加样式
md.renderer.rules.link_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline');
  token.attrSet('target', '_blank');
  token.attrSet('rel', 'noopener noreferrer');
  return renderer.renderToken(tokens, idx, options);
};

// 为引用块添加样式
md.renderer.rules.blockquote_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'border-l-4 border-primary pl-4 italic text-muted-foreground mb-4');
  return renderer.renderToken(tokens, idx, options);
};

// 为强调文本添加样式
md.renderer.rules.strong_open = function (_tokens, _idx, _options, _env, _renderer) {
  return '<strong class="font-medium">';
};

md.renderer.rules.em_open = function (_tokens, _idx, _options, _env, _renderer) {
  return '<em class="italic">';
};

// 为表格添加样式
md.renderer.rules.table_open = function (_tokens, _idx, _options, _env, _renderer) {
  return '<div class="overflow-x-auto mb-4"><table class="min-w-full border-collapse border border-border">';
};

md.renderer.rules.table_close = function (_tokens, _idx, _options, _env, _renderer) {
  return '</table></div>';
};

md.renderer.rules.thead_open = function (_tokens, _idx, _options, _env, _renderer) {
  return '<thead class="bg-muted">';
};

md.renderer.rules.th_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'border border-border px-4 py-2 text-left font-medium');
  return renderer.renderToken(tokens, idx, options);
};

md.renderer.rules.td_open = function (tokens, idx, options, _env, renderer) {
  const token = tokens[idx];
  token.attrJoin('class', 'border border-border px-4 py-2');
  return renderer.renderToken(tokens, idx, options);
};

export const renderMarkdown = (content: string): string => {
  return md.render(content);
};

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderedContent = renderMarkdown(content);
  
  // 为不同主题应用适当的样式
  const themeClasses = className.includes('prose-invert') 
    ? 'prose-invert [&_code]:bg-white/20 [&_pre]:bg-white/20 [&_blockquote]:border-white/30 [&_a]:text-blue-200 [&_a:hover]:text-blue-100'
    : '';
  
  return (
    <div 
      className={`prose prose-sm max-w-none ${themeClasses} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}