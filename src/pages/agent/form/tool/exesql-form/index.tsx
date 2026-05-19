import { Button } from '@/components/ui/button'
import type { FieldValues } from 'react-hook-form'
import { z } from 'zod'
import type { INextOperatorForm } from '../../../types'
import { dbTypeOptions } from '../../exesql/constants'
import type { ExeSqlFormValues } from '../../exesql/use-submit-form'
import { useSubmitForm } from '../../exesql/use-submit-form'
import { ToolConfigForm } from '../tool-config-form'
import {
  ToolNumberField,
  ToolSelectField,
  ToolTextField,
  useFlowLabel,
} from '../tool-fields'

const schema = z.object({
  db_type: z.string(),
  database: z.string(),
  username: z.string(),
  host: z.string(),
  port: z.coerce.number(),
  password: z.string().optional(),
  max_records: z.coerce.number(),
})

export default function ExeSQLToolForm({ node }: INextOperatorForm) {
  const t = useFlowLabel()
  const { testConnection, isLoading } = useSubmitForm()

  return (
    <ToolConfigForm
      node={node}
      schema={schema}
      onSubmit={(values: FieldValues) =>
        void testConnection(values as ExeSqlFormValues)
      }
    >
      <ToolSelectField
        name="db_type"
        label={t('dbType', 'Database Type')}
        options={dbTypeOptions}
        searchable
      />
      <div className="gap-space-md grid md:grid-cols-2">
        <ToolTextField name="host" label={t('host', 'Host')} />
        <ToolNumberField
          name="port"
          label={t('port', 'Port')}
          fallback={3306}
          min={1}
        />
        <ToolTextField name="database" label={t('database', 'Database')} />
        <ToolTextField name="username" label={t('username', 'Username')} />
        <ToolTextField
          name="password"
          label={t('password', 'Password')}
          type="password"
        />
        <ToolNumberField
          name="max_records"
          label={t('maxRecords', 'Max Records')}
          fallback={1024}
          min={1}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" loading={isLoading}>
          {t('test', 'Test')}
        </Button>
      </div>
    </ToolConfigForm>
  )
}
