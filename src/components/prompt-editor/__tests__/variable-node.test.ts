import assert from 'node:assert/strict'
import test from 'node:test'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical'
import { VariableNode } from '../variable-node'

test('VariableNode keeps data type separate from Lexical node type', async () => {
  const editor = createEditor({
    namespace: 'VariableNodeTest',
    nodes: [VariableNode],
    onError(error) {
      throw error
    },
  })

  await new Promise<void>((resolve, reject) => {
    editor.update(() => {
      try {
        const node = new VariableNode(
          'retrieval@json',
          'json',
          undefined,
          'Retrieval',
          'Array<Object>',
        )

        const serialized = node.exportJSON()
        const cloned = VariableNode.clone(node)

        assert.equal(VariableNode.getType(), 'variable')
        assert.equal(serialized.type, 'variable')
        assert.equal(serialized.variableType, 'Array<Object>')
        assert.equal(node.getTextContent(), '{retrieval@json}')
        assert.equal(cloned.getTextContent(), '{retrieval@json}')
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  })
})

test('prompt state round trip preserves Chinese text and variable metadata', () => {
  const config = {
    namespace: 'PromptRoundTripTest',
    nodes: [VariableNode],
    onError(error: Error) {
      throw error
    },
  }
  const editor = createEditor(config)
  editor.update(
    () => {
      $getRoot().append(
        $createParagraphNode().append(
          $createTextNode('中文提示 '),
          new VariableNode(
            'retrieval@json',
            'json',
            undefined,
            'Retrieval',
            'Array<Object>',
          ),
          $createTextNode(' 后续内容'),
        ),
      )
    },
    { discrete: true },
  )

  const serialized = editor.getEditorState().toJSON()
  const restored = createEditor(config).parseEditorState(
    JSON.stringify(serialized),
  )
  assert.deepEqual(restored.toJSON(), serialized)
  restored.read(() => {
    assert.equal(
      $getRoot().getTextContent(),
      '中文提示 {retrieval@json} 后续内容',
    )
  })
})
