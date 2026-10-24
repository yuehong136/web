import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createInstance } from 'i18next'
import { loadLocaleResource } from '../locale-registry'
import {
  createTypedTranslator,
  type TypedTranslate,
} from '../typed-translation'

// Checked by the Web compiler; ts-expect-error itself fails if a constraint drifts.
function typeContract(
  layout: TypedTranslate<'layout'>,
  workspace: TypedTranslate<'chat.aiWorkspace'>,
) {
  layout('sidebar.accountMenu', { name: 'Ada' })
  layout('invitations.pending', { count: 2 })
  workspace('evidence')
  // @ts-expect-error An unknown catalog key must not compile.
  workspace('evidnce')
  // @ts-expect-error An interpolation value is required.
  layout('sidebar.accountMenu')
  // @ts-expect-error A misspelled interpolation must not compile.
  layout('sidebar.accountMenu', { names: 'Ada' })
  // @ts-expect-error Counts must retain i18next's numeric plural contract.
  layout('invitations.pending', { count: '2' })
  // @ts-expect-error Plain labels do not accept arbitrary interpolation values.
  workspace('evidence', { source: 'invented' })
}
void typeContract

test('typed translators preserve instance locale, interpolation and JSON v4 plurals', async () => {
  const english = createInstance()
  const chinese = createInstance()
  await Promise.all(
    [english, chinese].map(async (instance, index) => {
      const locale = index === 0 ? 'en-US' : 'zh-CN'
      await instance.init({
        lng: locale,
        fallbackLng: false,
        interpolation: { escapeValue: false },
        resources: {
          [locale]: {
            translation: await loadLocaleResource(locale, ['layout', 'chat']),
          },
        },
      })
    }),
  )
  const t = createTypedTranslator('layout', english.t)
  assert.equal(
    t('sidebar.accountMenu', { name: 'Ada' }),
    'Account menu for Ada',
  )
  assert.equal(t('invitations.pending', { count: 1 }), '1 pending invitation')
  assert.equal(t('invitations.pending', { count: 2 }), '2 pending invitations')
  assert.equal(
    createTypedTranslator('layout', chinese.t)('invitations.pending', {
      count: 2,
    }),
    '2 个待处理的邀请',
  )
  assert.equal(
    createTypedTranslator('chat.aiWorkspace', english.t)('evidence'),
    'Evidence',
  )
  assert.equal(
    createTypedTranslator('chat.aiWorkspace', chinese.t)('evidence'),
    '证据',
  )
  assert.equal(english.language, 'en-US')
  assert.equal(chinese.language, 'zh-CN')
})
