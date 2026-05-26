import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  expandOpenRegions,
  ExpandError,
} from '../designer/ai-skeleton/expand-regions'
import { buildReportHtml } from '../renderer/build-report-html'
import { fillSkeleton } from '../schema-fill'
import type { BlockData, SkeletonSchema } from '../types'

// fields 是判别联合的 Partial,直接写字面量会触发多余属性检查;测试里统一 cast。
const fields = (value: Record<string, unknown>) => value as Partial<BlockData>

/** 一节里:一个固定块 + 一个生成区(brief 存于 annotation)。 */
const withOpenRegion = (
  layout: SkeletonSchema['sections'][number]['layout'] = 'full',
  role?: 'main' | 'side',
): SkeletonSchema => ({
  title: 'T',
  sections: [
    {
      id: 'sec-1',
      layout,
      blocks: [
        {
          id: 'blk-fixed',
          type: 'heading',
          fields: fields({ type: 'heading', level: 2, content: 'Intro' }),
        },
        {
          id: 'blk-open',
          type: 'open-region',
          ...(role ? { role } : {}),
          annotation: 'First a paragraph, then a pie chart',
        },
      ],
    },
  ],
})

const REGION_BLOCKS = JSON.stringify({
  blocks: [
    { type: 'paragraph', hint: 'overview' },
    {
      type: 'chart',
      chartType: 'pie',
      nameKey: 'name',
      valueKey: 'value',
      hint: 'share',
    },
  ],
})

test('expandOpenRegions: splices generated template blocks, drops the placeholder', async () => {
  const r = await expandOpenRegions(withOpenRegion(), {
    sourceText: 'a long report...',
    callLLM: async () => REGION_BLOCKS,
  })

  assert.equal(r.openRegions, 1)
  assert.equal(r.okRegions, 1)
  assert.equal(r.errors.length, 0)

  const blocks = r.skeleton.sections[0].blocks
  // 无 open-region 残留;固定块在前,生成块按序在后
  assert.ok(blocks.every((b) => b.type !== 'open-region'))
  assert.equal(blocks.length, 3)
  assert.equal(blocks[0].id, 'blk-fixed')
  assert.equal(blocks[1].type, 'paragraph')
  assert.equal(blocks[2].type, 'chart')
  // 生成块是模板:内容标 llm,运行时再填
  assert.equal(blocks[1].fieldDirectives?.content?.mode, 'llm')
  assert.equal(blocks[2].fieldDirectives?.data?.mode, 'llm')
})

test('expandOpenRegions: generated blocks inherit the placeholder role (sidebar column)', async () => {
  const r = await expandOpenRegions(withOpenRegion('sidebar-left', 'side'), {
    sourceText: 'doc',
    callLLM: async () => REGION_BLOCKS,
  })
  const generated = r.skeleton.sections[0].blocks.filter(
    (b) => b.id !== 'blk-fixed',
  )
  assert.equal(generated.length, 2)
  assert.ok(generated.every((b) => b.role === 'side'))
})

test('expandOpenRegions: a failed region is recorded + dropped, others survive', async () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 'sec-1',
        layout: 'full',
        blocks: [{ id: 'open-a', type: 'open-region', annotation: 'a' }],
      },
      {
        id: 'sec-2',
        layout: 'full',
        blocks: [{ id: 'open-b', type: 'open-region', annotation: 'b' }],
      },
    ],
  }
  const responses = ['totally not json', REGION_BLOCKS]
  let call = 0
  const r = await expandOpenRegions(skeleton, {
    sourceText: 'doc',
    callLLM: async () => responses[call++],
  })

  assert.equal(r.openRegions, 2)
  assert.equal(r.okRegions, 1)
  assert.equal(r.errors.length, 1)
  assert.ok(r.errors[0] instanceof ExpandError)
  // 失败区:占位被剔除、该节空;成功区:生成块就位
  assert.equal(r.skeleton.sections[0].blocks.length, 0)
  assert.ok(r.skeleton.sections[1].blocks.length > 0)
  assert.ok(
    r.skeleton.sections[1].blocks.every((b) => b.type !== 'open-region'),
  )
})

test('expandOpenRegions: no open region → returns skeleton untouched, no model call', async () => {
  const skeleton: SkeletonSchema = {
    title: 'T',
    sections: [
      {
        id: 'sec-1',
        layout: 'full',
        blocks: [
          {
            id: 'blk-1',
            type: 'paragraph',
            fields: fields({ type: 'paragraph', content: 'x' }),
          },
        ],
      },
    ],
  }
  let called = false
  const r = await expandOpenRegions(skeleton, {
    sourceText: 'doc',
    callLLM: async () => {
      called = true
      return REGION_BLOCKS
    },
  })
  assert.equal(called, false)
  assert.equal(r.openRegions, 0)
  assert.equal(r.skeleton, skeleton) // 原样返回
})

test('expandOpenRegions: expanded skeleton feeds fillSkeleton → renders HTML', async () => {
  const expanded = await expandOpenRegions(withOpenRegion(), {
    sourceText: 'doc',
    callLLM: async () => REGION_BLOCKS,
  })
  // 展开产物是合法可填骨架:填值(模型缺键 → 保静态)后能渲染
  const filled = await fillSkeleton(expanded.skeleton, {
    sourceText: 'doc',
    resolveRef: () => undefined,
    callLLM: async () => '{}',
  })
  assert.ok(buildReportHtml(filled.schema).includes('<html'))
})
