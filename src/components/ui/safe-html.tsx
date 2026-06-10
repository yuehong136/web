/**
 * SafeHtml —— 仓库内唯一允许直接使用 dangerouslySetInnerHTML 的出口（展示组件）。
 *
 * 模型输出 / 工具结果 / 文档解析内容 / 检索高亮一律按攻击者可控对待
 * （CLAUDE.md「模型输出是不可信输入」，默认存在 prompt injection），
 * 渲染为 HTML 前必须经 DOMPurify 净化。业务代码不要再手写
 * dangerouslySetInnerHTML —— lint 规则 security/no-raw-dangerously-set-inner-html
 * （error 级）会拦截裸用法。
 *
 * 用法：
 *   <SafeHtml html={modelHtml} />                       // 默认 HTML profile
 *   <SafeHtml html={tableHtml} options={TABLE_ONLY} />  // 自定义白名单
 *
 * options 请提升为模块级常量（内联字面量会让 useMemo 每次渲染都重新净化）。
 * 注意：DOMPurify 默认白名单不含 target/rel，链接需要 target="_blank" 时
 * 通过 options 的 ADD_ATTR: ['target', 'rel'] 显式保留。
 */
import { useMemo, type HTMLAttributes } from 'react'
import DOMPurify from 'dompurify'
import type { Config } from 'dompurify'

const DEFAULT_OPTIONS: Config = { USE_PROFILES: { html: true } }

export interface SafeHtmlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'dangerouslySetInnerHTML'
> {
  /** 待渲染的 HTML（按不可信输入对待，内部经 DOMPurify 净化） */
  html: string
  /** DOMPurify 配置（标签/属性白名单等）；缺省为 USE_PROFILES: { html: true } */
  options?: Config
}

export function SafeHtml({ html, options, ...rest }: SafeHtmlProps) {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(html, options ?? DEFAULT_OPTIONS),
    [html, options],
  )

  return <div {...rest} dangerouslySetInnerHTML={{ __html: sanitized }} />
}
