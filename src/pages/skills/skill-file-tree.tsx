import { FileText, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SkillFileTree({
  files,
  prefix = '',
  selected,
  onSelect,
}: {
  files: { path: string }[]
  prefix?: string
  selected: string
  onSelect: (path: string) => void
}) {
  const children = new Map<string, { path: string }[]>()
  for (const file of files) {
    const part = file.path.slice(prefix.length).split('/')[0]
    children.set(part, [...(children.get(part) || []), file])
  }
  return (
    <ul className="flex flex-col gap-space-xs pl-space-sm">
      {[...children].map(([name, entries]) => {
        const path = `${prefix}${name}`
        const isFile = entries.length === 1 && entries[0].path === path
        return (
          <li key={path}>
            {isFile ? (
              <Button
                variant={selected === path ? 'secondary' : 'ghost'}
                className="max-w-full justify-start"
                onClick={() => onSelect(path)}
                title={path}
              >
                <FileText className="size-icon-sm shrink-0" />
                <span className="truncate">{name}</span>
              </Button>
            ) : (
              <details open>
                <summary className="flex cursor-pointer items-center gap-space-xs py-space-xs text-sm">
                  <Folder className="size-icon-sm" />
                  {name}
                </summary>
                <SkillFileTree
                  files={entries}
                  prefix={`${path}/`}
                  selected={selected}
                  onSelect={onSelect}
                />
              </details>
            )}
          </li>
        )
      })}
    </ul>
  )
}
