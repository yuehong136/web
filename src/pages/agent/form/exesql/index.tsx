import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { initialExeSqlValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import { dbTypeOptions } from './constants'
import { exeSqlSchema, useSubmitForm } from './use-submit-form'

export function ExeSQLForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialExeSqlValues, node)
  const { testConnection, isLoading } = useSubmitForm()

  const form = useForm({
    resolver: zodResolver(exeSqlSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])

  return (
    <Form {...form}>
      <FormWrapper onSubmit={form.handleSubmit(testConnection)}>
        <FormField
          control={form.control}
          name="sql"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.sqlStatement', 'SQL Statement')}</FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value}
                  onChange={field.onChange}
                  nodeId={node?.id}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="db_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.dbType', 'Database Type')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value ?? initialExeSqlValues.db_type}
                  onChange={field.onChange}
                  options={dbTypeOptions}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-md md:grid-cols-2">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.host', 'Host')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.port', 'Port')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? 3306}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="database"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.database', 'Database')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.username', 'Username')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.password', 'Password')}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_records"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.maxRecords', 'Max Records')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? 1024}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="outline" loading={isLoading}>
            {t('flow.test', 'Test')}
          </Button>
        </div>

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
