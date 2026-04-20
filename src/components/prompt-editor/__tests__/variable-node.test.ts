import assert from 'node:assert/strict'
import test from 'node:test'
import { createEditor } from 'lexical'
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
