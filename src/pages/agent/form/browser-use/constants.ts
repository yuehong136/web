import { AgentGlobals } from '../../constant'

export type BrowserFormValues = {
  llm_id: string
  prompts: string
  max_steps: number
  temperature: number
  max_retries: number
  headless: boolean
  enable_default_extensions: boolean
  chromium_sandbox: boolean
  persist_session: boolean
  upload_sources: Array<string | Record<string, unknown>>
  outputs: Record<string, { type: string; value: unknown }>
}

export const initialBrowserValues: BrowserFormValues = {
  llm_id: '',
  prompts: `{${AgentGlobals.SysQuery}}`,
  max_steps: 30,
  temperature: 0,
  max_retries: 0,
  headless: true,
  enable_default_extensions: false,
  chromium_sandbox: false,
  persist_session: true,
  upload_sources: [],
  outputs: {
    content: { type: 'string', value: '' },
    downloaded_files: { type: 'Array<Object>', value: [] },
  },
}
