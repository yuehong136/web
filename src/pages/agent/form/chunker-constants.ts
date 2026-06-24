export const TokenChunkerDelimiterMode = {
  TokenSize: 'token_size',
  Delimiter: 'delimiter',
  One: 'one',
} as const

export type TokenChunkerDelimiterMode =
  (typeof TokenChunkerDelimiterMode)[keyof typeof TokenChunkerDelimiterMode]

export const initialTokenChunkerValues = {
  outputs: {
    chunks: { type: 'Array<Object>', value: [] },
  },
  delimiter_mode: TokenChunkerDelimiterMode.TokenSize,
  chunk_token_size: 512,
  overlapped_percent: 0,
  delimiters: [{ value: '\n' }],
  enable_children: false,
  children_delimiters: [] as Array<{ value: string }>,
  image_table_context_window: 0,
}

export const TitleChunkerMethod = {
  Hierarchy: 'hierarchy',
  Group: 'group',
} as const

export type TitleChunkerMethod =
  (typeof TitleChunkerMethod)[keyof typeof TitleChunkerMethod]

export const initialTitleChunkerRules = [
  {
    levels: [
      { expression: '^#[^#]' },
      { expression: '^##[^#]' },
      { expression: '^###[^#]' },
      { expression: '^####[^#]' },
    ],
  },
  {
    levels: [
      { expression: '第[零一二三四五六七八九十百0-9]+(分?编|部分)' },
      { expression: '第[零一二三四五六七八九十百0-9]+章' },
      { expression: '第[零一二三四五六七八九十百0-9]+节' },
      { expression: '第[零一二三四五六七八九十百0-9]+条' },
      { expression: '[\\(（][零一二三四五六七八九十百]+[\\)）]' },
    ],
  },
  {
    levels: [
      { expression: '第[0-9]+章' },
      { expression: '第[0-9]+节' },
      { expression: '[0-9]{1,2}[\\.、]' },
      { expression: '[0-9]{1,2}\\.[0-9]{1,2}($|[^a-zA-Z/%~.-])' },
      { expression: '[0-9]{1,2}\\.[0-9]{1,2}\\.[0-9]{1,2}' },
    ],
  },
  {
    levels: [
      { expression: '第[零一二三四五六七八九十百0-9]+章' },
      { expression: '第[零一二三四五六七八九十百0-9]+节' },
      { expression: '[零一二三四五六七八九十百]+[ 、]' },
      { expression: '[\\(（][零一二三四五六七八九十百]+[\\)）]' },
      { expression: '[\\(（][0-9]{,2}[\\)）]' },
    ],
  },
  {
    levels: [
      { expression: 'PART (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)' },
      { expression: 'Chapter (I+V?|VI*|XI|IX|X)' },
      { expression: 'Section [0-9]+' },
      { expression: 'Article [0-9]+' },
    ],
  },
]

export function cloneTitleChunkerRules() {
  return initialTitleChunkerRules.map((rule) => ({
    levels: rule.levels.map((level) => ({ ...level })),
  }))
}

export const initialTitleChunkerValues = {
  outputs: {
    chunks: { type: 'Array<Object>', value: [] },
  },
  method: TitleChunkerMethod.Hierarchy,
  hierarchyHierarchy: '3',
  hierarchyGroup: '0',
  include_heading_content: false,
  root_chunk_as_heading: false,
  hierarchyRules: cloneTitleChunkerRules(),
  groupRules: cloneTitleChunkerRules(),
}
