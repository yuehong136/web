import assert from 'node:assert/strict'
import test from 'node:test'
import { ProgrammingLanguage } from '../../../constant'
import {
  createCodeEditorOptions,
  getCodeLanguageLabel,
  getCodeLineCount,
} from '../code-editor-config'

test('code editor config keeps language-specific indentation and accessibility', () => {
  const pythonOptions = createCodeEditorOptions({
    ariaLabel: 'Python code editor',
    language: ProgrammingLanguage.Python,
  })
  const javascriptOptions = createCodeEditorOptions({
    ariaLabel: 'JavaScript code editor',
    language: ProgrammingLanguage.JavaScript,
  })

  assert.equal(pythonOptions?.tabSize, 4)
  assert.equal(javascriptOptions?.tabSize, 2)
  assert.equal(pythonOptions?.accessibilitySupport, 'auto')
  assert.equal(pythonOptions?.ariaLabel, 'Python code editor')
  assert.equal(pythonOptions?.automaticLayout, true)
  assert.equal(pythonOptions?.wordWrap, 'off')
})

test('code editor status derives stable labels and line counts', () => {
  assert.equal(getCodeLanguageLabel(ProgrammingLanguage.Python), 'Python')
  assert.equal(
    getCodeLanguageLabel(ProgrammingLanguage.JavaScript),
    'JavaScript',
  )
  assert.equal(getCodeLineCount(''), 1)
  assert.equal(getCodeLineCount('first\r\nsecond\nthird'), 3)
})
