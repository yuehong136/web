import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, Pencil, Trash2, Upload } from 'lucide-react'
import {
  ResourceList,
  ResourceListHeader,
  ResourceRow,
  type ResourceSelection,
} from '@/components/patterns'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { StatusDot } from '@/components/studio'
import { Button } from '@/components/ui/button'

/**
 * Shared presentation for both skill protocols. Pages adapt their API data
 * (asset service or core folders) into these view models; everything below
 * renders the same rows, menus and states.
 */

export interface SkillStatus {
  label: string
  tone?: 'default' | 'success' | 'warning' | 'error'
}

export interface SkillSpaceItem {
  id: string
  name: string
  description?: string
  /** Route to the space, including any tracked operation parameters. */
  href: string
  /** Omitted while the space is active. */
  status?: SkillStatus
  /** Why changes are disabled (read-only service, other backend). */
  note?: string
  selection?: ResourceSelection
  onImport?: () => void
  importDisabled?: boolean
  onEdit?: () => void
  editDisabled?: boolean
  onDelete?: () => void
  deleteDisabled?: boolean
}

export interface SkillAssetItem {
  /** Unique per row (a search hit is skill + version). */
  key: string
  name: string
  description?: string
  href: string
  status?: SkillStatus
  /** Version, tags, score… */
  meta?: ReactNode
  selection?: ResourceSelection
}

function StatusBadge({ status }: { status?: SkillStatus }) {
  if (!status) return null
  return (
    <StatusDot
      tone={status.tone === 'default' || !status.tone ? 'neutral' : status.tone}
      label={status.label}
    />
  )
}

function SpaceActions({ space }: { space: SkillSpaceItem }) {
  const { t } = useTranslation()
  if (!space.onImport && !space.onEdit && !space.onDelete) return null
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('skills.actionsFor', { name: space.name })}
        >
          <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        {space.onImport ? (
          <ActionMenuItem
            disabled={space.importDisabled}
            onSelect={space.onImport}
          >
            <Upload className="size-icon-sm" aria-hidden="true" />
            {t('skills.import')}
          </ActionMenuItem>
        ) : null}
        {space.onEdit ? (
          <ActionMenuItem disabled={space.editDisabled} onSelect={space.onEdit}>
            <Pencil className="size-icon-sm" aria-hidden="true" />
            {t('skills.editSpace')}
          </ActionMenuItem>
        ) : null}
        {space.onDelete ? (
          <>
            <ActionMenuSeparator />
            <ActionMenuItem
              danger
              disabled={space.deleteDisabled}
              onSelect={space.onDelete}
            >
              <Trash2 className="size-icon-sm" aria-hidden="true" />
              {t('skills.delete')}
            </ActionMenuItem>
          </>
        ) : null}
      </ActionMenuContent>
    </ActionMenu>
  )
}

/** Skill spaces as rows: name, description, state, note and actions. */
export function SkillSpaceList({
  spaces,
  selectAll,
}: {
  spaces: SkillSpaceItem[]
  /** Page-level select-all for protocols with bulk deletion. */
  selectAll?: {
    checked: boolean
    indeterminate?: boolean
    onCheckedChange: (checked: boolean) => void
  }
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <ResourceList
      label={t('skills.spaces')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('common.status')}
          meta={t('skills.access')}
          selection={
            selectAll
              ? { ...selectAll, label: t('skills.selectPage') }
              : undefined
          }
        />
      }
    >
      {spaces.map((space) => (
        <ResourceRow
          key={space.id}
          name={space.name}
          description={space.description || t('skills.spaceDescription')}
          avatar={{ seed: space.id, badge: 'skill' }}
          status={<StatusBadge status={space.status} />}
          meta={
            space.note ? (
              <span className="truncate" title={space.note}>
                {space.note}
              </span>
            ) : undefined
          }
          selection={space.selection}
          onOpen={() => navigate(space.href)}
          actions={<SpaceActions space={space} />}
        />
      ))}
    </ResourceList>
  )
}

/** Skills (or search hits) as rows: name, description, status and meta. */
export function SkillAssetList({
  skills,
  metaLabel,
  selectAll,
}: {
  skills: SkillAssetItem[]
  /** Caption of the meta column, e.g. "Version" or "Score". */
  metaLabel?: string
  selectAll?: {
    checked: boolean
    indeterminate?: boolean
    onCheckedChange: (checked: boolean) => void
  }
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <ResourceList
      label={t('skills.skillList')}
      header={
        <ResourceListHeader
          name={t('common.name')}
          status={t('common.status')}
          meta={metaLabel}
          selection={
            selectAll
              ? { ...selectAll, label: t('skills.selectPage') }
              : undefined
          }
        />
      }
    >
      {skills.map((skill) => (
        <ResourceRow
          key={skill.key}
          name={skill.name}
          description={skill.description || undefined}
          avatar={{ seed: skill.key, badge: 'skill' }}
          status={<StatusBadge status={skill.status} />}
          meta={skill.meta}
          selection={skill.selection}
          onOpen={() => navigate(skill.href)}
        />
      ))}
    </ResourceList>
  )
}

/** Page-level select-all over the visible ids, keeping the rest. */
export function pageSelection(
  visibleIds: string[],
  selected: string[],
  setSelected: (ids: string[]) => void,
) {
  const onPage = visibleIds.filter((id) => selected.includes(id)).length
  const checked = visibleIds.length > 0 && onPage === visibleIds.length
  return {
    checked,
    indeterminate: onPage > 0 && !checked,
    onCheckedChange: () => {
      const visible = new Set(visibleIds)
      setSelected(
        checked
          ? selected.filter((id) => !visible.has(id))
          : [...new Set([...selected, ...visibleIds])],
      )
    },
  }
}

/** Notices above a skill list: operations, errors and service limits. */
export function SkillNotices({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-space-sm empty:hidden">{children}</div>
  )
}
