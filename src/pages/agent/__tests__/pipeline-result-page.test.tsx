import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import PipelineResultPage from '../pipeline-result'

vi.mock('@/hooks/use-agent-request', () => ({
  useFetchMessageTrace: () => ({
    data: [
      {
        component_id: 'END',
        component_name: 'END',
        status: 'success',
        trace: [
          {
            message: JSON.stringify({
              chunks: [
                {
                  doc_type_kwd: 'image',
                  img_id: 'preview-image',
                  content: 'Image description',
                  extension: 'PNG',
                },
              ],
            }),
          },
        ],
      },
    ],
    isLoading: false,
    isError: false,
  }),
}))

let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it.each(['', '&extension=PNG', '&extension=tiff'])(
  'renders nameless pipeline image results with extension metadata %s',
  async (metadata) => {
    await act(async () =>
      root.render(
        <MemoryRouter
          initialEntries={[
            `/dataflow-result?agent_id=agent&id=message${metadata}`,
          ]}
        >
          <PipelineResultPage />
        </MemoryRouter>,
      ),
    )
    expect(host.textContent).toContain('Image description')
    expect(host.textContent).toContain('preview-image')
    expect(host.textContent).not.toContain('undefined')
    const json = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('JSON'),
    )!
    expect(json).toBeDefined()
    await act(async () => json.click())
    expect(host.querySelector('pre')?.textContent).toContain('preview-image')
    expect(host.querySelector('pre')?.textContent).toContain(
      '"extension": "PNG"',
    )
  },
)
