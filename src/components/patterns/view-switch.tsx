import { useTranslation } from 'react-i18next'
import { LayoutGrid, List } from 'lucide-react'
import { SegmentedControl } from '@/components/ui/segmented-control'

export type CollectionView = 'list' | 'grid'

export interface ViewSwitchProps {
  value: CollectionView
  onChange: (value: CollectionView) => void
  /** Group label; defaults to the shared "View" label. */
  label?: string
  listLabel?: string
  gridLabel?: string
  className?: string
}

/**
 * List / grid switch for collection pages: the icon-only SegmentedControl
 * preset with the shared labels and icons.
 */
export function ViewSwitch({
  value,
  onChange,
  label,
  listLabel,
  gridLabel,
  className,
}: ViewSwitchProps) {
  const { t } = useTranslation()
  return (
    <SegmentedControl
      aria-label={label ?? t('common.patterns.view.label')}
      iconOnly
      size="sm"
      value={value}
      onValueChange={onChange}
      className={className}
      options={[
        {
          value: 'list',
          label: listLabel ?? t('common.patterns.view.list'),
          icon: <List />,
        },
        {
          value: 'grid',
          label: gridLabel ?? t('common.patterns.view.grid'),
          icon: <LayoutGrid />,
        },
      ]}
    />
  )
}
