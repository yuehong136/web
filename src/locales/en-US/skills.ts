export const skillsResource = {
  skills: {
    readOnly:
      'This library is available for reading and download. Changes are disabled on this service.',
    advanced: 'Advanced settings',
    import: 'Import skill',
    close: 'Close',
    space: 'Space',
    history: 'Version history',
    sourceText: 'View source',
    localSource: 'Local package',
    retryIndex: 'Retry indexing',
    taskDetails: 'Task details',
    filesStored:
      'Files are saved. Search availability is shown separately below.',
    spaceDescription:
      'Group related skills so they are easier to discover and search.',
    discoverDescription:
      'Discover reusable skills, read their instructions, and import your own. Skills are never executed automatically.',
    previewPackage: 'Preview selected files ({{count}})',
    noMatches:
      'No matching skills. Try another query or check the search configuration.',
    core: {
      importDescription:
        'Choose a directory containing SKILL.md. Files are saved first; rebuild the search index when ready. Existing version folders are not overwritten here.',
      filesSaved: 'All {{count}} files saved.',
      partialFiles:
        '{{count}} of {{total}} files saved. Inspect this folder before importing again.',
      indexReady: 'Search index is ready.',
      indexPending:
        'Files can be read and downloaded. Search has not yet been rebuilt.',
      inspectFiles: 'Inspect saved files',
      deletionPending: 'Removing files and search entries…',
      rerankNotApplied:
        'Reranking is not executed by this search service. A saved reranking preference will not change results.',
      configDescription:
        'Choose a model for semantic search. Save changes, then rebuild the index.',
      strategyHint:
        '0 uses keyword search, 1 uses semantic search; values in between blend both.',
      emptySpace:
        'Import a skill directory to start. Browsing files does not require a search index.',
      readDescription: 'Open the skill to read its instructions and files.',
      versionDescription:
        'Read instructions and browse the files stored in this skill.',
      defaultVersion: 'Default version: {{version}}',
      legacyVersion: 'Skill folder',
      removeIndex: 'Remove from search',
      indexRemoved: 'Search entry removed. Files remain available.',
    },
    operations: {
      install: 'Import skill',
      activate: 'Change published version',
      reindex: 'Build search index',
      delete_version: 'Delete version',
      delete_skill: 'Uninstall skill',
      delete_space: 'Delete space',
      delete_skills: 'Uninstall skills',
      delete_spaces: 'Delete spaces',
    },
    title: 'Skill library',
    subtitle:
      'Versioned skill assets. Stored here, never executed automatically.',
    createUnknown:
      'The result is uncertain. Close this dialog and check the refreshed space list before creating another space.',
    createSpace: 'Create space',
    editSpace: 'Edit space',
    name: 'Name',
    description: 'Description',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    loading: 'Loading skill assets',
    empty: 'No assets yet',
    emptyDescription:
      'Create a space and install a local skill package to begin.',
    error: 'The request could not be completed.',
    retry: 'Retry',
    refresh: 'Refresh',
    select: 'Select {{name}}',
    selected: '{{count}} selected',
    delete: 'Delete',
    deleteSelected: 'Delete selected',
    deleteConfirm: 'Delete these assets?',
    deleteDescription:
      'Files and search indexes will be removed. This cannot be undone.',
    search: 'Search',
    filter: 'Filter by name',
    previous: 'Previous',
    next: 'Next',
    page: 'Page {{page}} · {{total}} results',
    upload: 'Install package',
    uploadDescription:
      'Upload a ZIP with SKILL.md at its root, or choose a directory. Published versions are immutable.',
    zip: 'ZIP archive',
    directory: 'Directory',
    files: 'Files',
    version: 'Version',
    activateOnInstall: 'Set as active when ready',
    install: 'Install',
    packageRules:
      'Up to 1,000 files, 5 MiB per file and 50 MiB total. ZIP files must include SKILL.md directly at the root.',
    configuration: 'Search configuration',
    configurationDescription:
      'Changes require rebuilding the index. The previous generation remains available until the replacement is ready.',
    embedding: 'Embedding model',
    rerank: 'Reranking model',
    none: 'None',
    unavailable: 'Unavailable',
    topK: 'Candidate limit',
    vectorWeight: 'Vector weight',
    threshold: 'Similarity threshold',
    field: 'Field',
    weight: 'Weight',
    enabled: 'Enabled',
    tags: 'Tags',
    content: 'Content',
    reindex: 'Rebuild index',
    requiresReindex: 'Configuration saved. Rebuild the index to apply it.',
    browse: 'Browse assets',
    retrieve: 'Search active versions',
    keyword: 'Keyword',
    vector: 'Vector',
    hybrid: 'Hybrid',
    query: 'Search query',
    resultCount: '{{total}} candidates',
    lowerBound:
      'Showing the first {{total}} candidates. Increase the candidate limit in search configuration for more.',
    score: 'Score {{score}}',
    active: 'Active',
    noActive: 'No active version',
    setActive: 'Set active',
    clearActive: 'Clear active version',
    deleteVersion: 'Delete version',
    uninstall: 'Uninstall skill',
    download: 'Download ZIP',
    downloadFile: 'Download file',
    preview: 'Preview',
    chooseFile: 'Select a file to preview.',
    binary: 'This file is not UTF-8 text. Download it to view it.',
    immutable:
      'Published versions are read-only. Install a new version to change content.',
    size: '{{count}} files · {{bytes}} bytes',
    operation: 'Operation',
    accepted: 'Request accepted',
    progress: '{{completed}} / {{total}} completed',
    dismiss: 'Dismiss',
    item: 'Resource',
    skipped: '{{count}} binary files stored but not indexed',
    ownerMismatch:
      'This space belongs to the other backend. Open its owning backend to make changes.',
    noStorage: 'Storage is unavailable. Installation is disabled.',
    noSearch: 'Search is unavailable on this backend.',
    sortName: 'Name',
    sortCreated: 'Created',
    ascending: 'Ascending',
    descending: 'Descending',
    errors: {
      CORE_VERSION_EXISTS:
        'This version folder already exists. Inspect it or choose another version name.',
      CORE_REQUEST_FAILED:
        'This request failed. Refresh the resource and check your inputs before retrying.',
      CORE_INDEX_PARTIAL:
        'Some skills could not be indexed. Your files are retained; check the model configuration and rebuild the index.',
      CORE_DELETE_PARTIAL:
        'Some files could not be deleted. Refresh to inspect what remains, then retry.',
      DELETE_FAILED: 'Deletion did not finish. Retry to continue cleaning up.',
      MODEL_NOT_CONFIGURED:
        'Select an embedding model in search configuration before rebuilding the index.',
      MODEL_NOT_FOUND:
        'The selected model is unavailable. Choose an enabled model.',
      MODEL_DRIVER_UNAVAILABLE:
        'This model provider is not supported by the backend.',
      SOURCE_CHANGED:
        'The assets changed during indexing. Retry to include the current versions.',
      RESOURCE_BUSY:
        'Another operation is changing this resource. Wait for it to finish.',
      INVALID_SKILL:
        'The package needs a root SKILL.md with valid UTF-8 name, description, and optional tags.',

      VERSION_CONFLICT:
        'This version already exists with different content. Choose a new version.',
      ACTIVE_VERSION: 'Switch or clear the active version before deleting it.',
      BACKEND_OWNER_MISMATCH: 'This backend does not own this space.',
      IDEMPOTENCY_CONFLICT:
        'This request key is already used for different content.',
      INDEX_NOT_READY:
        'The search index is not ready. Configure a model and rebuild it.',
      INVALID_PACKAGE: 'The package paths, size, or root SKILL.md are invalid.',
      INVALID_SKILL_RESPONSE: 'The server returned an incompatible response.',
      REVISION_CONFLICT:
        'This resource changed. Refresh it before trying again.',
      HTTP_401: 'Your session expired. Sign in again.',
      HTTP_404: 'This resource is unavailable.',
      HTTP_413: 'The package exceeds the upload size limit.',
      HTTP_422: 'Check the submitted fields and package.',
      HTTP_503: 'The required service is unavailable. Try again later.',
    },
    states: {
      active: 'Active',
      deleting: 'Deleting',
      delete_failed: 'Deletion failed',
      deleted: 'Deleted',
      staging: 'Uploading',
      installed: 'Installed',
      install_failed: 'Installation failed',
      unindexed: 'Not indexed',
      indexing: 'Indexing',
      ready: 'Ready',
      failed: 'Failed',
      pending: 'Pending',
      running: 'Running',
      succeeded: 'Completed',
      partial: 'Partially completed',
    },
    phases: {
      staging: 'Uploading',
      sealed: 'Queued',
      indexing: 'Building index',
      cleaning: 'Cleaning resources',
      done: 'Finished',
    },
  },
}
