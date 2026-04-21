import { DynamicStringForm } from '../../components'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { useWatch, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  WebhookSecurityAuthType,
} from '../../../constant'

const jwtAlgorithmOptions = ['HS256', 'HS384', 'HS512'].map((value) => ({
  label: value,
  value,
}))

export function WebhookAuth() {
  const { t } = useTranslation()
  const form = useFormContext()
  const authType = useWatch({
    control: form.control,
    name: 'security.auth_type',
  })

  if (authType === WebhookSecurityAuthType.Token) {
    return (
      <>
        <FormField
          control={form.control}
          name="security.token.token_header"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.tokenHeader', 'Token header')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="security.token.token_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.tokenValue', 'Token value')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
      </>
    )
  }

  if (authType === WebhookSecurityAuthType.Basic) {
    return (
      <>
        <FormField
          control={form.control}
          name="security.basic_auth.username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.username', 'Username')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="security.basic_auth.password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.password', 'Password')}</FormLabel>
              <FormControl>
                <Input type="password" {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
      </>
    )
  }

  if (authType === WebhookSecurityAuthType.Jwt) {
    return (
      <>
        <FormField
          control={form.control}
          name="security.jwt.algorithm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.algorithm', 'Algorithm')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value || 'HS256'}
                  onChange={field.onChange}
                  options={jwtAlgorithmOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="security.jwt.secret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.secret', 'Secret')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="security.jwt.issuer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.issuer', 'Issuer')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="security.jwt.audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.webhook.audience', 'Audience')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
        <DynamicStringForm
          name="security.jwt.required_claims"
          label={t('flow.webhook.requiredClaims', 'Required claims')}
        />
      </>
    )
  }

  return null
}
