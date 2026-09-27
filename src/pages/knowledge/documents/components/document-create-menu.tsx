import { FilePlus2, Globe2, Plus, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DocumentCreationMode } from '@/api/knowledge-rest'

interface DocumentCreateMenuProps {
  onOpenUpload: () => void
  onOpenCreate: (
    mode: DocumentCreationMode.WEB | DocumentCreationMode.EMPTY,
  ) => void
}

export function DocumentCreateMenu({
  onOpenUpload,
  onOpenCreate,
}: DocumentCreateMenuProps) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-space-sm size-icon-sm" aria-hidden="true" />
          {t('documentCreate.menu')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right">
        <DropdownMenuItem onClick={onOpenUpload}>
          <Upload aria-hidden="true" />
          {t('documentCreate.uploadFile')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenCreate(DocumentCreationMode.WEB)}
        >
          <Globe2 aria-hidden="true" />
          {t('documentCreate.fromWeb')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenCreate(DocumentCreationMode.EMPTY)}
        >
          <FilePlus2 aria-hidden="true" />
          {t('documentCreate.blank')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
