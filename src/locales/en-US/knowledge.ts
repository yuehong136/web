export default {
  knowledge: {
    common: {
      loading: 'Loading page',
      preparing: 'Preparing content.',
      cancel: 'Cancel',
      save: 'Save',
      refresh: 'Refresh',
      retry: 'Retry',
      emptyDescription: 'No description',
      documentsCount: '{{count}} documents',
      chunksCount: '{{count}} chunks',
      tokensCount: '{{count}} tokens',
    },
    nav: {
      label: 'Knowledge navigation',
      documents: 'Documents',
      graph: 'Knowledge graph',
      search: 'Retrieval test',
      logs: 'Logs',
      settings: 'Settings',
      backToList: 'Back to knowledge bases',
      breadcrumbLabel: 'Chunk navigation',
      knowledge: 'Knowledge',
      chunks: 'Chunks',
      documentFallback: 'Document',
    },
    settings: {
      title: 'Knowledge settings',
      description: 'Configure parsing methods and options.',
      missingTitle: 'Knowledge base not found',
      missingDescription:
        'This knowledge base may have been deleted or you may not have access.',
      backToList: 'Back to knowledge bases',
      validationTitle: 'Validation failed',
      emptyName: 'Knowledge base name is required',
      successTitle: 'Updated',
      successMessage: 'Knowledge settings were updated.',
      errorTitle: 'Update failed',
      errorMessage: 'An error occurred while updating knowledge settings.',
      formLabel: 'Settings form',
      previewLabel: 'Parser preview',
      sections: {
        basic: 'Basic information',
        indexing: 'Global indexing',
        pipeline: 'Data pipeline',
        datasource: 'Data source',
      },
      fields: {
        avatar: 'Knowledge avatar',
        uploadAvatar: 'Upload avatar',
        avatarTip: 'JPG and PNG supported. Recommended size: 128 x 128 px.',
        name: 'Knowledge base name',
        namePlaceholder: 'Enter a knowledge base name',
        permission: 'Access permission',
        permissionTooltip:
          'When permission is set to Team, all team members can operate this knowledge base.',
        description: 'Description',
        descriptionPlaceholder: 'Enter a knowledge base description',
        embeddingModel: 'Embedding model',
        embeddingModelTooltip:
          'The default embedding model used by this knowledge base. After chunks have been created, the default embedding model cannot be changed unless all chunks in the knowledge base are deleted.',
        embeddingModelPlaceholder: 'Select an embedding model',
        loading: 'Loading...',
        pageRank: 'PageRank weight',
        pageRankTooltip:
          'Set a higher PageRank score for a specific knowledge base. Matching chunks from that knowledge base will receive this score in hybrid similarity ranking.',
        parseType: 'Parse type',
        chunkMethod: 'Chunk method',
        chunkMethodTooltip:
          'Choose how documents are parsed. Different parsers work best for different document types.',
        chunkMethodPlaceholder: 'Select a chunk method',
        pipeline: 'Data pipeline',
        pipelineTooltip:
          'Select an existing data pipeline to process documents. Data pipelines can customize the parsing flow.',
        pipelinePlaceholder: 'Select a data pipeline',
        pipelineEmpty: 'No data pipelines available',
        createFromScratch: 'Create from scratch',
        layoutParser: 'PDF parser',
        layoutParserTooltip:
          'Use a visual model to analyze PDF layouts, identify document structure, and locate titles, text blocks, images, and tables. Plain text only extracts PDF text. This option only applies to PDF documents.',
        layoutParserPlaceholder: 'Select a parser',
        maxToken: 'Recommended chunk size',
        maxTokenTooltip:
          'Recommended token threshold for generated chunks. Short segments are merged with following segments until the next merge would exceed this threshold.',
        delimiter: 'Text segmentation delimiter',
        delimiterTooltip:
          'Multiple-character delimiters are supported. Wrap multi-character delimiters with two backticks ``. Make sure you understand the segmentation mechanism before changing this value.',
        autoKeywords: 'Auto keyword extraction',
        autoKeywordsTooltip:
          'Extract N keywords from each chunk to improve query precision. This consumes additional tokens.',
        autoQuestions: 'Auto question extraction',
        autoQuestionsTooltip:
          'Use the default chat model to extract N questions from each chunk and improve ranking. This consumes additional tokens.',
        html4excel: 'Convert table to HTML',
        html4excelTooltip:
          'Used with the General chunk method. When enabled, spreadsheet files are parsed as HTML tables and split by row count.',
        tocExtraction: 'TOC enhancement',
        tocExtractionTooltip:
          'Generate hierarchical table-of-contents information for existing chunks. During retrieval, TOC enhancement helps the system locate relevant chunks.',
        imageTableContext: 'Image and table context window',
        imageTableContextTooltip:
          'Capture N tokens of surrounding text above and below images and tables to provide richer chunk context. Set to 0 to disable.',
        parserType: 'Parser type',
        parserTypePlaceholder: 'Select a parser type',
        mineruOptions: 'MinerU options',
        mineruParseMethod: 'Parse method',
        mineruParseMethodTooltip:
          'PDF parse method: auto for automatic detection, txt for text extraction, or ocr for optical character recognition.',
        mineruParseMethodPlaceholder: 'Select a parse method',
        mineruLanguage: 'OCR language',
        mineruLanguageTooltip: 'Preferred OCR language for MinerU.',
        mineruLanguagePlaceholder: 'Select a language',
        mineruFormula: 'Formula recognition',
        mineruFormulaTooltip:
          'Enable formula recognition. It may not work properly for Cyrillic documents.',
        mineruTable: 'Table recognition',
        mineruTableTooltip: 'Enable table recognition and extraction.',
        autoMetadata: 'Auto metadata',
        autoMetadataTooltip:
          'Automatically extract metadata from documents. When enabled, the system uses AI models to extract metadata based on predefined field templates.',
        settings: 'Settings',
        childrenChunks: 'Use child chunks for retrieval',
        childrenChunksTooltip:
          'When enabled, the system splits parent chunks into child chunks with the child delimiter. Retrieval matches child chunks but returns the corresponding parent chunk.',
        childDelimiter: 'Child delimiter',
        childDelimiterTooltip:
          'Delimiter used to split parent chunks into child chunks. Escape sequences such as \\n for newline and \\t for tab are supported.',
        overlappedPercent: 'Overlap percentage',
        overlappedPercentTooltip:
          'Overlap ratio between adjacent chunks. Higher overlap can preserve more context but increases storage and processing cost.',
        tagSet: 'Tag set',
        tagSetTooltip1:
          'Select one or more tag sets or tag knowledge bases to tag each chunk in this knowledge base.',
        tagSetTooltip2:
          'Tag knowledge bases must be created with the Tag parser.',
        tagSetPlaceholder: 'Select tag knowledge bases',
        tagSetSearchPlaceholder: 'Search knowledge bases...',
        tagSetEmpty: 'No tag knowledge bases available',
        tagSetTip:
          'No tag knowledge bases are available. Create a knowledge base with the Tag parser first.',
        topNTags: 'Number of tags',
        topNTagsTooltip: 'Maximum number of tags assigned to each chunk.',
      },
      options: {
        permission: {
          me: 'Only me',
          team: 'Team visible',
        },
        layoutParser: {
          plainText: 'Plain text',
        },
        parseType: {
          builtin: 'Built-in',
          manual: 'Manual setup',
        },
        raptorScope: {
          dataset: 'Entire knowledge base',
          file: 'Single file',
        },
      },
      parserDescription: {
        fallbackTitle: 'Select a parser type',
        fallbackDescription:
          'Choose a parser type on the left to see details and examples.',
        unknownTitle: 'Unknown parser',
        unknownDescription: 'No description',
        supportedFormats: 'Supported formats:',
        methodDescription: 'Chunk method description',
        examples: 'Examples',
        examplesDescription:
          'Reference screenshots help explain how this parser works.',
        exampleAlt: 'Example {{index}}',
        exampleLabel: 'Example {{index}}',
        defaultDescription: 'Configure parser options to get the best result.',
        multipleFormats: 'Multiple formats',
        details: {
          naive: {
            description:
              'This method applies a simple chunking strategy to files:\n\nThe system uses a visual detection model to split continuous text into segments. These segments are then merged into chunks whose token count does not exceed the configured token limit.',
            supportedFormats:
              'MD, MDX, DOCX, XLSX, XLS, PPT, PDF, TXT, JPEG, JPG, PNG, TIF, GIF, CSV, JSON, EML, HTML',
          },
          qa: {
            description:
              'This chunk method supports Excel and CSV/TXT files.\n\nFor Excel files, each sheet should contain two columns without headers: one question column followed by one answer column. Multiple sheets are accepted when the column structure is correct.\n\nFor CSV/TXT files, use UTF-8 encoding and separate questions from answers with TAB.\n\nRows that do not follow these rules are ignored. Each question-answer pair is treated as a distinct chunk.',
            supportedFormats: 'Excel, CSV, TXT',
          },
          resume: {
            description:
              'Resumes come in many formats, but they often need to be normalized into structured data for search.\n\nInstead of chunking resumes, this parser extracts structured resume data. HR users can query the knowledge base to list qualified candidates.',
            supportedFormats: 'DOCX, PDF, TXT',
          },
          manual: {
            description:
              'This parser assumes manuals have hierarchical section structures. It uses the lowest-level section titles as split points, so figures and tables in the same section are kept together and chunks may be large.',
            supportedFormats: 'PDF',
          },
          table: {
            description:
              'Tips:\n\n• For CSV or TXT files, use TAB as the column delimiter\n• The first row must contain column headers\n• Column headers should be meaningful terms that the language model can understand\n• Use slashes to list synonyms, or square brackets to enumerate values\n\nEach table row is treated as one chunk.',
            supportedFormats: 'XLSX, CSV, TXT',
          },
          paper: {
            description:
              'When the model performs well, papers are split by sections such as Abstract, 1.1, and 1.2.\n\nThis helps the LLM summarize relevant sections more comprehensively. The tradeoff is a larger conversation context and higher compute cost.',
            supportedFormats: 'PDF',
          },
          book: {
            description:
              'Books are long and not every section is useful. For PDFs, set page ranges to remove irrelevant content and reduce parsing cost.',
            supportedFormats: 'DOCX, PDF, TXT',
          },
          laws: {
            description:
              'Legal documents follow strict writing formats. This parser detects split points from textual features.\n\nChunk granularity follows ARTICLE-level sections, and upper-level context is included in each chunk.',
            supportedFormats: 'DOCX, PDF, TXT',
          },
          presentation: {
            description:
              'Each page is treated as a chunk, and a thumbnail is stored for each page.\n\nUploaded PPT files are automatically chunked with this method without per-file setup.',
            supportedFormats: 'PDF, PPTX',
          },
          picture: {
            description:
              'Image document processing uses OCR to extract text from images. It is suitable for documents with many images, charts, or scanned content.',
            supportedFormats: 'JPEG, JPG, PNG, TIF, GIF, PDF',
          },
          one: {
            description:
              'The entire document is treated as a single chunk and is not split.\n\nUse this method when summarization needs the full document context and the selected LLM context window can cover the document length.',
            supportedFormats: 'DOCX, EXCEL, PDF, TXT',
          },
          audio: {
            description:
              'Audio content processing supports speech-to-text and audio analysis. It is suitable for recordings, podcasts, and similar audio content.',
            supportedFormats: 'MP3, WAV, M4A, FLAC',
          },
          email: {
            description:
              'Dedicated email parsing recognizes structures such as sender, recipient, and subject. It is suitable for email archives and analysis.',
            supportedFormats: 'EML, MSG, MBOX',
          },
          tag: {
            description:
              'Knowledge bases created with the Tag chunk method act as tag sets. Other knowledge bases can match tags from the tag set to their own chunks by similarity, and retrieval can use these tags for labeling.\n\nTag sets do not directly participate in RAG retrieval.\n\nEach chunk in a tag set is an independent pair of tag description and tag.\n\nFor XLSX files, the file should contain two columns without headers: tag description first, then tag.\n\nFor CSV/TXT files, use UTF-8 encoding and TAB as the delimiter between content and tag.\n\nUse English commas to separate multiple tags in the tag column.',
            supportedFormats: 'XLSX, CSV, TXT',
          },
          knowledge_graph: {
            description:
              'Knowledge graph construction extracts entities and relationships to build a structured knowledge network. Entity recognition and relation extraction convert documents into graph-structured knowledge.',
            supportedFormats: 'PDF, DOCX, TXT',
          },
        },
      },
      graphrag: {
        enable: 'Extract knowledge graph',
        enableTooltip:
          'Build a knowledge graph from all chunks in this knowledge base to improve multi-hop and complex question answering. This can consume many tokens and take a long time.',
        entityTypes: 'Entity types',
        entityTypesTooltip:
          'Specify entity types to extract from documents, such as organization, person, location, and event.',
        entityTypesPlaceholder: 'Enter an entity type and press Enter',
        method: 'Method',
        methodPlaceholder: 'Select a method',
        methodTooltipLight:
          'Entity and relation extraction prompts come from LightRAG, a simple and fast retrieval-augmented generation method.',
        methodTooltipGeneral:
          'Entity and relation extraction prompts come from Microsoft GraphRAG, a graph-based modular retrieval-augmented generation system.',
        resolution: 'Entity resolution',
        resolutionTooltip:
          'During parsing, entities with the same meaning are merged to make the knowledge graph cleaner and more accurate.',
        community: 'Community report generation',
        communityTooltip:
          'Chunks are clustered into hierarchical communities. The system then uses an LLM to generate a summary for each community.',
      },
      raptor: {
        enable: 'Use RAPTOR retrieval enhancement',
        enableTooltip:
          'RAPTOR is commonly used for complex multi-hop QA. To enable it, go to the knowledge base document page and run Generate > RAPTOR.',
        scope: 'Generation scope',
        scopeTooltip:
          'Choose whether RAPTOR is generated for the entire knowledge base or a single file.',
        prompt: 'Prompt',
        promptTooltip:
          'System prompts provide task instructions, response requirements, and other constraints for the LLM.',
        promptPlaceholder: 'Enter a summarization prompt',
        defaultPrompt:
          'Summarize the key points of the following content. Be concise, accurate, and highlight the important information.\n\n{content}\n\nSummary:',
        maxToken: 'Max tokens',
        maxTokenTooltip: 'Maximum token count for each chunk to be summarized.',
        threshold: 'Clustering threshold',
        thresholdTooltip:
          'In RAPTOR, chunks are clustered by semantic similarity. Higher thresholds create fewer chunks in each cluster; lower thresholds create larger clusters.',
        maxCluster: 'Max clusters',
        maxClusterTooltip: 'Maximum number of clusters that can be created.',
        randomSeed: 'Random seed',
        randomSeedTitle: 'Generate random seed',
      },
      configuration: {
        basic: 'Basic configuration',
        enhancement: 'Intelligent enhancement',
        selectParser: 'Select a parser type first',
        oneEmpty:
          'The One parser treats the entire document as a single chunk. No additional configuration is required.',
        pictureEmpty:
          'The Picture parser uses OCR and visual understanding. No additional configuration is required.',
        qaEmpty:
          'The Q&A parser is specialized for question-answer documents. No additional configuration is required.',
        resumeEmpty:
          'The Resume parser uses dedicated structured parsing. No additional configuration is required.',
        tableEmpty:
          'The Table parser uses dedicated table parsing. No additional configuration is required.',
        tagEmpty:
          'The Tag parser is used to create tag knowledge bases. No additional configuration is required.',
      },
      pipelinePreview: {
        title: 'Data pipeline',
        description:
          'Data pipelines customize document processing, including parsing, cleaning, and chunking.',
        createTip:
          'Create a new pipeline if none of the existing pipelines fits this knowledge base.',
      },
    },
    documents: {
      title: 'Documents',
      description: 'Manage documents, parsing tasks, and metadata.',
      searchPlaceholder: 'Search documents...',
      manageMetadata: 'Manage metadata',
      import: 'Import documents',
      selectAll: 'Select all',
      selectedCount: '{{count}} selected',
      totalDocuments: '{{count}} documents',
      displayCount: 'Showing {{visible}} / {{total}} documents',
      totalItems: '{{count}} items',
      emptyTitle: 'No documents',
      emptyDescription:
        'Upload a document to start building this knowledge base.',
      addDocument: 'Add document',
      renameTitle: 'Rename document',
      newName: 'New name',
      newNamePlaceholder: 'Enter a new name',
      confirm: 'Confirm',
      deleteTitle: 'Confirm deletion',
      deleteDescription: 'Delete this document? This action cannot be undone.',
      bulkDeleteConfirm: 'Delete {{count}} selected documents?',
      previousPage: 'Previous',
      nextPage: 'Next',
      filter: 'Filter',
      filterSearchPlaceholder: 'Search {{label}}...',
      clear: 'Clear',
      unknown: 'Unknown',
      defaultParser: 'Default',
      configureParser: 'Configure parser',
      table: {
        select: 'Select',
        fileType: 'File type',
        fileName: 'File name',
        size: 'Size',
        type: 'Type',
        chunks: 'Chunks',
        fileSizeBytes: 'File size: {{bytes}} bytes',
        chunksTooltip:
          'Document split into {{chunks}} chunks. Tokens: {{tokens}}',
        parser: 'Parser',
        metadata: 'Metadata',
        enabled: 'Enabled',
        taskStatus: 'Task status',
        uploader: 'Uploader',
        createdAt: 'Created at',
        created: 'Created: {{value}}',
        updated: 'Updated: {{value}}',
        actions: 'Actions',
      },
      filters: {
        system: 'System fields',
        fileType: 'File type',
        taskStatus: 'Task status',
        metadata: 'Metadata',
        noMetadata: 'No metadata',
        statusFallback: 'Status {{status}}',
      },
      taskStatus: {
        unstart: 'Not started',
        running: 'Running',
        cancel: 'Cancelled',
        done: 'Completed',
        fail: 'Failed',
      },
      metadataCell: {
        configured: '{{count}} fields configured',
        moreFields: '... {{count}} more',
        reparseTip: 'Reparse to extract metadata',
        notConfigured: 'No metadata configured',
        none: 'None',
      },
      actions: {
        viewDetail: 'View details',
        startParse: 'Start parsing',
        stopTask: 'Stop current task',
        rename: 'Rename document',
        download: 'Download document',
        delete: 'Delete document. This cannot be undone.',
        noDownloadPermission:
          'Contact an administrator for download permission.',
        enableDocument: 'Enable document',
        disableDocument: 'Disable document',
      },
      bulkActions: {
        selected: '{{count}} documents selected',
        enable: 'Enable',
        disable: 'Disable',
        startParse: 'Start parsing',
        stopTask: 'Stop task',
        delete: 'Delete',
        clearSelection: 'Clear selection',
      },
      generate: {
        button: 'Generate',
        tooltip: 'Generate knowledge graph / RAPTOR',
        disabledTooltip: 'Parse documents first to generate chunks.',
        tasksTitle: 'Generation tasks',
        viewLogs: 'View logs',
        deleteResult: 'Delete generated result',
        pause: 'Pause',
        collapse: 'Collapse',
        expandLogs: 'Expand logs',
        deleteTitle: 'Delete {{label}} generated result',
        deleteDescription:
          'Delete the generated result for {{label}}? You will need to generate it again.',
        runSuccess: '{{label}} task started.',
        runError: 'Failed to start {{label}}.',
        pauseSuccess: '{{label}} task paused.',
        pauseError: 'Failed to pause {{label}}.',
        deleteSuccess: '{{label}} generated result deleted.',
        deleteError: 'Delete failed.',
        types: {
          graph: {
            label: 'Knowledge graph',
            description:
              'Build a knowledge graph from chunks to improve multi-hop question answering.',
          },
          raptor: {
            label: 'RAPTOR',
            description:
              'Use hierarchical summary clustering to improve recall for complex questions.',
          },
        },
        status: {
          start: 'Not generated',
          running: 'Generating',
          completed: 'Completed',
          failed: 'Failed',
        },
        action: {
          start: 'Start generation',
          running: 'Pause',
          completed: 'Regenerate',
          failed: 'Retry',
        },
      },
      processLog: {
        title: 'File',
        fileType: 'File type',
        uploadedBy: 'Creator',
        fileName: 'File name',
        uploadDate: 'Upload date',
        fileSize: 'File size',
        processBeginAt: 'Started at',
        chunkNumber: 'Chunks',
        duration: 'Duration',
        status: 'Status',
        details: 'Details',
        close: 'Close',
      },
      reparse: {
        title: 'Start parsing',
        selected: '{{count}} documents selected',
        clearChunksTitle: 'Clear {{count}} existing chunks',
        clearChunksDescription:
          '{{count}} documents already have chunks. When selected, these chunks are cleared and the documents are parsed again.',
        applyMetadataTitle: 'Apply global auto metadata settings',
        applyMetadataDescription:
          'This knowledge base has {{count}} metadata fields configured. When selected, document metadata is extracted automatically.',
        metadataMissingWarning:
          'No metadata fields configured. Add them in knowledge settings first.',
        metadataOverwriteWarning:
          '{{count}} documents already have metadata. It will be extracted again.',
        defaultTip:
          'Documents will be parsed with the knowledge base default configuration.',
      },
      chunkMethodModal: {
        parseMethod: 'Parse method',
        builtin: 'Built-in',
        selectPipeline: 'Select pipeline',
        parserPlaceholder: 'Select a parser',
        parserEmpty: 'No matching parsers',
        pipelinePlaceholder: 'Select a pipeline',
        pipelineEmpty: 'No available pipelines',
        pipelineTip: 'Select a configured data processing pipeline.',
        metadataTitle: 'Metadata generation settings',
        metadataDescription:
          'Configure fields and rules for automatic metadata extraction. Changes affect newly parsed documents.',
        metadataTodo: 'Metadata configuration is under development.',
      },
    },
    search: {
      title: 'Retrieval test',
      description: 'Test retrieval quality and tune query parameters.',
      queryTitle: 'Query',
      queryDescription: 'Configure a retrieval task',
      queryLabel: 'Query text',
      queryPlaceholder: 'Enter a question or text to retrieve...',
      searchShortcut: 'Enter to search, Shift+Enter for newline',
      startSearch: 'Start retrieval',
      advancedParams: 'Advanced retrieval parameters',
      settings: 'Settings',
      adjustTip: 'Adjust parameters in settings.',
      resultsTitle: 'Results',
      searching: 'Searching...',
      foundResults: '{{count}} relevant chunks found',
      filteredDocs: '{{count}} documents filtered',
      source: 'Source',
      moreDocs: '+{{count}} documents',
      docFilter: 'Document filter',
      clear: 'Clear',
      all: 'All',
      startTitle: 'Start retrieval test',
      startDescription:
        'Enter a question on the left, choose a retrieval mode, and test this knowledge base.',
      searchingDescription: 'Searching, please wait...',
      noResultsTitle: 'No relevant results',
      noResultsDescription:
        'Try another query or lower the similarity threshold.',
      querySummary: 'Query: {{query}}',
      thresholdSummary: 'Similarity threshold: {{value}}',
      totalResults: '{{count}} results',
      configTitle: 'Retrieval configuration',
      currentMode: 'Current mode: {{mode}}',
      applyConfig: 'Apply',
      previewTitle: 'Content preview',
      raw: 'Raw',
      preview: 'Preview',
      charsCount: 'Characters: {{count}}',
      selectedDocsCount: '{{count}} documents selected',
      chunksCount: '{{count}} chunks',
      previousPage: 'Previous',
      nextPage: 'Next',
      chars: '{{count}} characters',
      similarity: 'Combined similarity',
      similarityShort: 'Combined',
      vector: 'Vector',
      text: 'Text',
      expand: 'Expand',
      fromDocument: 'From document',
      details: 'Details',
      badges: {
        threshold: 'Threshold {{value}}',
        vectorWeight: 'Vector weight {{value}}',
        topK: 'Top-K {{value}}',
        knowledgeGraph: 'Knowledge graph',
        keyword: 'Keyword boost',
        crossLanguages: '{{count}} cross-language',
        metadataAuto: 'Auto metadata filter',
        metadataSemiAuto: '{{count}} semi-auto fields',
        metadataManual: '{{count}} metadata filters',
      },
      config: {
        fallbackMode: 'Retrieval configuration',
        mode: 'Retrieval mode',
        modeDescription: 'Choose the recall strategy for this retrieval task.',
        unavailable: 'Unavailable',
        vectorWeight: 'Vector weight',
        sparseWeight: 'Full-text weight (auto)',
        fusionTextWeight: 'Text weight',
        fusionVectorWeight: 'Vector weight (auto)',
        hybridWeightHint:
          'Vector weight + full-text weight = 1.00 (rounded to 2 decimals).',
        fusionWeightHint:
          'Text weight + vector weight = 1.00 (rounded to 2 decimals).',
        advanced: 'Advanced parameters',
        pageSize: 'Page size',
        similarityThreshold: 'Similarity threshold',
        similarityThresholdTooltip:
          'Chunks below this hybrid similarity are filtered out. RAGFlow default is 0.2.',
        vectorSimilarityWeight: 'Vector similarity weight',
        vectorSimilarityWeightTooltip:
          'Used to combine keyword similarity with vector similarity or rerank score.',
        topKTooltip:
          'Number of chunks initially recalled or sent into the rerank model.',
        useKg: 'Use knowledge graph',
        highlight: 'Highlight matching text',
        keyword: 'Keyword boost',
        crossLanguage: 'Cross-language translation',
        languageCount: '{{count}} languages',
        languagePlaceholder: 'Select translation languages...',
        languageEmpty: 'No languages',
        languageHelp:
          'Translate the query into selected languages to improve matching for multilingual content.',
        manualMetadataEmpty:
          'This knowledge base has no metadata template configured. You can still enter field names manually.',
      },
      modes: {
        fusion: {
          label: 'Fusion retrieval',
          description:
            'Default mode using the traditional retrieval fusion strategy.',
        },
        sparse: {
          label: 'Sparse retrieval',
          description: 'Full-text retrieval based on keyword matching.',
        },
        hybrid: {
          label: 'Hybrid retrieval',
          description: 'Combine vector and full-text retrieval.',
        },
        dense: {
          label: 'Dense retrieval',
          description: 'Pure vector retrieval. Temporarily disabled.',
        },
      },
      rerank: {
        none: 'No reranking',
        providerOther: 'Other',
        label: 'Rerank model',
        loading: 'Loading rerank models...',
        tooltip:
          'Optional. Reranks initial retrieval results to improve quality.',
        placeholder: 'Select a rerank model',
        empty: 'No matching rerank models',
        loadError: 'Failed to load rerank models. Please try again.',
      },
      metadataFilter: {
        label: 'Metadata filter',
        selectMode: 'Select filter mode',
        autoHelp:
          'The backend automatically generates metadata filters from the question. A default chat model is required.',
        semiAutoHelp:
          'Choose metadata fields that participate in automatic filter generation.',
        noFields: 'This knowledge base has no metadata fields configured.',
        logic: 'Condition logic:',
        and: 'AND',
        or: 'OR',
        selectField: 'Select field',
        fieldName: 'Field name',
        selectOperator: 'Select operator',
        inputValue: 'Enter value',
        addCondition: 'Add condition',
        autoOperator: 'Auto',
        modes: {
          disabled: 'Disabled',
          auto: 'Auto',
          semi_auto: 'Semi-auto',
          manual: 'Manual',
        },
        operators: {
          is: 'Equals',
          'not is': 'Does not equal',
          contains: 'Contains',
          'not contains': 'Does not contain',
          'start with': 'Starts with',
          'end with': 'Ends with',
          empty: 'Is empty',
          'not empty': 'Is not empty',
          '>': 'Greater than',
          '<': 'Less than',
          '≥': 'Greater than or equal',
          '≤': 'Less than or equal',
        },
      },
    },
    graph: {
      loading: 'Loading knowledge graph...',
      errorTitle: 'Failed to load knowledge graph',
      emptyTitle: 'No knowledge graph data',
      emptyDescription:
        'Upload documents and run GraphRAG to generate a knowledge graph.',
    },
    logs: {
      title: 'Logs',
      description: 'View file processing and dataset operation logs.',
      stats: {
        totalFiles: 'Total files',
        totalFilesTooltip: 'Total files in this knowledge base.',
        downloading: 'Downloading',
        downloadingTooltip: 'Files currently downloading.',
        processing: 'Processing',
        processingTooltip: 'Files currently being processed or parsed.',
        success: 'Succeeded',
        failed: 'Failed',
        downloadSuccessTip: 'Files downloaded successfully.',
        downloadFailedTip: 'Files that failed to download.',
        processSuccessTip: 'Files processed successfully.',
        processFailedTip: 'Files that failed to process.',
      },
      tabs: {
        fileLogs: 'File logs',
        datasetLogs: 'Dataset logs',
      },
      filter: {
        button: 'Filter',
        byStatus: 'Filter by status',
        clear: 'Clear',
        searchPlaceholder: 'Search...',
      },
      status: {
        unstart: 'Pending',
        running: 'Running',
        cancel: 'Cancelled',
        done: 'Succeeded',
        fail: 'Failed',
        schedule: 'Scheduled',
        unknown: 'Unknown',
      },
      processingType: {
        knowledgeGraph: 'Knowledge graph',
        raptor: 'RAPTOR',
      },
      table: {
        empty: 'No data',
        pagination: '{{total}} records, page {{page}} / {{totalPages}}',
        previous: 'Previous',
        next: 'Next',
        viewDetail: 'View details',
        fileName: 'File name',
        source: 'Source',
        pipeline: 'Pipeline',
        startTime: 'Start time',
        taskType: 'Task type',
        processingType: 'Processing type',
        status: 'Status',
        actions: 'Actions',
      },
      detail: {
        fileTitle: 'File log details',
        datasetTitle: 'Dataset log details',
        description: 'View detailed log information and processing progress.',
        fileName: 'File name',
        taskId: 'Task ID',
        source: 'Source',
        localUpload: 'Local upload',
        taskType: 'Task type',
        startTime: 'Start time',
        duration: 'Duration',
        status: 'Status',
        progress: 'Progress',
        details: 'Detailed logs',
        close: 'Close',
      },
    },
    metadata: {
      modal: {
        manageTitle: 'Manage metadata',
        manageSubtitle:
          'View and manage metadata across all documents in this knowledge base.',
        settingTitle: 'Metadata generation settings',
        settingSubtitle:
          'Define metadata fields. Newly parsed documents will automatically extract these fields.',
        singleFileSettingTitle: 'Document metadata settings',
        singleFileSettingSubtitle:
          'Configure metadata fields for this document only.',
        updateSingleTitle: 'Edit metadata',
        updateSingleSubtitle: 'Edit metadata values for this document.',
        fallbackTitle: 'Metadata',
        fieldList: 'Fields',
        templateSettings: 'Template settings',
        addField: 'Add field',
        fieldName: 'Field name',
        description: 'Description',
        optionalValues: 'Optional values',
        values: 'Values',
        actions: 'Actions',
        loading: 'Loading...',
        emptyTitle: 'No metadata fields',
        emptyDescription: 'Use Add field to define metadata.',
        manageTip:
          'Deleting fields or values here affects all associated documents. To change the field definition template, go to knowledge settings.',
        settingTip:
          'Defined fields are used for AI metadata extraction. Clearer descriptions improve extraction quality.',
        confirmDelete: 'Delete',
      },
      delete: {
        fieldTitle: 'Delete metadata field',
        valueTitle: 'Delete metadata value',
        globalFieldWarn:
          'This field and all of its values will be removed from all associated files. This action cannot be undone.',
        globalValueWarn:
          'This value will be removed from all associated files. This action cannot be undone.',
        singleFieldWarn:
          'This field and all of its values will be removed from this file.',
        singleValueWarn: 'This value will be removed from this file.',
      },
      editor: {
        addField: 'Add field',
        addMetadata: 'Add metadata',
        editField: 'Edit field',
        editMetadata: 'Edit metadata',
        settingDescription:
          'Configure metadata field name, description, and optional values.',
        valueDescription: 'Set the value for this metadata field.',
        valuePlaceholder: 'Enter value...',
        duplicateField: 'Field name already exists.',
        duplicateValue: 'Value already exists.',
        requiredField: 'Enter a field name.',
        fieldName: 'Field name',
        fieldNamePlaceholder: 'Letters and underscores only',
        description: 'Description',
        descriptionTooltip:
          'Describe what this field is used for so AI can extract metadata more accurately.',
        descriptionPlaceholder: 'Describe this field...',
        restrictDefinedValues: 'Restrict to predefined values',
        restrictDefinedValuesTooltip:
          'When enabled, AI extracted values are limited to the optional values defined below.',
        optionalValues: 'Optional values',
        values: 'Values',
        add: 'Add',
        emptyValues: 'No values. Click Add to start.',
        saving: 'Saving...',
        confirm: 'Confirm',
        moreValues: '{{count}} more values',
        edit: 'Edit',
        delete: 'Delete',
        noMetadata: 'No metadata',
        selectField: 'Select field',
        fieldPlaceholder: 'Field name',
        selectValue: 'Select value',
        valueInputPlaceholder: 'Value. Separate multiple values with commas.',
        addMetadataButton: 'Add metadata',
      },
    },
  },
}
