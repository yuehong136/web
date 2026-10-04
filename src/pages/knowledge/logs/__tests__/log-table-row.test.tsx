import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import en from '@/locales/en-US/knowledge'
import zh from '@/locales/zh-CN/knowledge'
import { LogTableRow } from '../components/log-table-row'
import { LogTabType } from '../constants'

async function render(
  taskType: string,
  language: string,
  tab = LogTabType.DATASET_LOGS,
) {
  const i18n = createInstance()
  await i18n.init({
    lng: language,
    resources: { en: { translation: en }, zh: { translation: zh } },
  })
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <table>
        <tbody>
          <LogTableRow
            item={{ id: 'log', task_type: taskType, operation_status: '3' }}
            activeTab={tab}
            onViewDetail={() => {}}
          />
        </tbody>
      </table>
    </I18nextProvider>,
  )
}

describe('dataset processing type display', () => {
  for (const [language, label] of [
    ['en', 'Knowledge graph'],
    ['zh', '知识图谱'],
  ]) {
    for (const type of ['GraphRAG', 'Graph']) {
      it(`${language} renders ${type} with a graph icon and translated label`, async () => {
        const html = await render(type!, language!)
        expect(html).toContain(label)
        expect(html).toContain('lucide-network')
        expect(html).toContain('aria-hidden="true"')
      })
    }
  }
  it('keeps RAPTOR, unknown types, and file task types unchanged', async () => {
    for (const type of ['RAPTOR', 'future-task']) {
      const html = await render(type, 'en')
      expect(html).toContain(type)
      expect(html).not.toContain('lucide-network')
    }
    const file = await render('GraphRAG', 'zh', LogTabType.FILE_LOGS)
    expect(file).toContain('GraphRAG')
    expect(file).not.toContain('lucide-network')
  })
})
