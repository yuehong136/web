import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useFetchPersonDataList } from '@/hooks/use-agent-request'

interface PersonDataMultiSelectProps {
  /** datav workflow id（画布/agent id），决定候选项来源 */
  workflowId?: string
  /** 分享/嵌入公开运行时传入，走 beta token 接口；编辑器登录态留空 */
  betaToken?: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

/**
 * Begin 节点 `persondata` 输入类型的运行时控件。
 * 候选项动态拉取（列表展示 `title`，选中并推送 `dataobject`）。
 * 同时供画布内调试运行与公共分享页复用。
 */
export function PersonDataMultiSelect({
  workflowId,
  betaToken,
  value,
  onChange,
  disabled,
}: PersonDataMultiSelectProps) {
  const { t } = useTranslation()
  const { items, isLoading, isError } = useFetchPersonDataList({
    workflowId,
    betaToken,
  })

  const options = useMemo(
    () => [
      {
        label: t('flow.persondata', '人员数据'),
        options: items.map((item) => ({
          label: item.title,
          value: item.dataobject,
        })),
      },
    ],
    [items, t],
  )

  const emptyText = isError
    ? t('flow.persondataLoadFailed', '人员数据加载失败')
    : t('flow.persondataEmpty', '暂无可选人员数据')

  return (
    <MultiSelectWithSearch
      options={options}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      disabled={disabled || isLoading}
      allowClear
      placeholder={t('flow.persondataPlaceholder', '请选择人员数据')}
      emptyText={emptyText}
    />
  )
}
