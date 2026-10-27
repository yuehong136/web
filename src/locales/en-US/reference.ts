export default {
  reference: {
    unknownDocument: 'Unknown document',
    openWebSource: 'Open web page',
    openWebSourceHint: 'Open the source web page in a new tab',
    documentMetadata: 'Document metadata',
    docType: {
      table: 'Table',
      image: 'Image',
      text: 'Text',
    },
    marker: {
      label: 'Citation {{index}}: {{name}}',
    },
    panel: {
      title: 'Sources',
      documentCount_one: '{{count}} document',
      documentCount_other: '{{count}} documents',
      chunkCount_one: '{{count}} citation',
      chunkCount_other: '{{count}} citations',
      showMore: 'Show {{count}} more',
      showLess: 'Show less',
    },
    diagnostics: {
      title: 'Retrieval diagnostics',
      score: 'Retrieval match score',
      vectorScore: 'Vector match',
      termScore: 'Keyword match',
      unavailable: 'Unavailable',
      outOfRange:
        'Raw value {{value}} is outside 0–1 and is not shown as a percentage (ranking boosts such as PageRank can push it above 1)',
      scoreHint:
        "How closely this passage matched during retrieval, for troubleshooting retrieval. Its range depends on the app's retrieval settings; it does not tell whether the answer is correct.",
      noPositions: 'No position data',
      copyValue: 'Copy {{label}}',
      valueCopied: '{{label}} copied',
    },
  },
}
