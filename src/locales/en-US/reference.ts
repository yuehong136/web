export default {
  reference: {
    unknownDocument: 'Unknown document',
    openOriginalHint: 'Open the full document in a new tab',
    openWebSourceHint: 'Open the source web page in a new tab',
    docType: {
      table: 'Table',
      image: 'Image',
      text: 'Text',
    },
    marker: {
      label: 'Citation {{index}}: {{name}}',
      copy: 'Copy',
      openOriginal: 'Source',
      details: 'Details',
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
    sheet: {
      description:
        'Content, document metadata and retrieval diagnostics of the cited passage',
      openOriginal: 'View source',
      content: 'Content',
      noContent: 'No content',
      copy: 'Copy',
      copied: 'Copied',
      contentCopied: 'Content copied',
      documentMetadata: 'Document metadata',
      related: 'Other citations from this document ({{count}})',
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
      positions: 'Position data',
      noPositions: 'No position data',
      chunkId: 'Chunk ID',
      documentId: 'Document ID',
      datasetId: 'Knowledge base ID',
      imageId: 'Image ID',
      copyValue: 'Copy {{label}}',
      valueCopied: '{{label}} copied',
    },
  },
}
