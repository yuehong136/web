/** Home 对话区 Markdown 的作用域样式（从 ChatSection 原样迁出）。 */
export const HomeChatStyles = () => (
  <style>{`
            .home-chat-area .markdown-content {
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content a {
              color: var(--color-text-accent) !important;
            }
            .home-chat-area .markdown-content table:not(pre) {
              border-collapse: collapse !important;
              display: block !important;
              width: max-content !important;
              max-width: 100% !important;
              overflow: auto !important;
              margin: 8px 0 16px 0 !important;
              border: 1px solid var(--color-border-default) !important;
              border-radius: 8px !important;
              background-color: var(--color-surface-primary) !important;
            }
            .home-chat-area .markdown-content th,
            .home-chat-area .markdown-content td {
              border: 1px solid var(--color-border-default) !important;
              padding: 8px 12px !important;
              text-align: left !important;
              vertical-align: top !important;
            }
            .home-chat-area .markdown-content th {
              background-color: var(--color-surface-secondary) !important;
              color: var(--color-text-primary) !important;
              font-weight: 600 !important;
            }
            .home-chat-area .markdown-content td {
              background-color: var(--color-surface-primary) !important;
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content code {
              background-color: var(--color-background-subtle) !important;
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content pre {
              background-color: var(--color-components-pre-bg) !important;
              border-color: var(--color-components-pre-border) !important;
            }
            .home-chat-area .markdown-content pre code {
              color: var(--color-components-pre-text) !important;
            }
            .home-chat-area .markdown-content .ant-mermaid-graph {
              height: auto !important;
              min-height: 220px !important;
              max-height: 70vh !important;
            }
            .home-chat-area .markdown-content .ant-mermaid-code {
              height: auto !important;
              min-height: 220px !important;
              max-height: 70vh !important;
            }
          `}</style>
)
