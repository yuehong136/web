/**
 * 兼容现有业务导入路径的安全 toast 出口。
 *
 * Sonner 通过 React 节点渲染 message，不会把远端错误或用户输入解释为 HTML。
 * 业务代码统一从本适配层导入，便于后续集中添加可观测和默认策略。
 */
export { toast } from 'sonner'
