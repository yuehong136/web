export const pipelineWorkbenchMessages = {
  header: {
    title: 'Pipeline run and logs',
    idleHint:
      'Upload a document to trigger dataflow processing, then review the results in the timeline and output views.',
    lastRunAt: 'Last run {{time}}',
    reset: 'Clear the current Pipeline run history',
    close: 'Close the Pipeline workbench',
  },
  workbench: {
    description:
      'Upload a document or fill in the Begin inputs to start the Pipeline dataflow, then review the node timeline and final output',
    tabs: {
      run: 'Run',
      log: 'Logs',
      output: 'Output',
    },
    stop: 'Stop',
    cancelling: 'Cancelling…',
    timelineTitle: 'Dataflow timeline',
  },
  runPanel: {
    uploadDocument: 'Upload document',
    beginInputsTitle: 'Begin inputs',
    beginInputsHint:
      'Upload a document or fill in the fields defined by the Begin node. "Start Pipeline" saves the current canvas and triggers dataflow processing.',
    start: 'Start Pipeline',
    running: 'Running…',
    startFailed: 'Failed to start',
    quickRunTitle: 'Quick run',
    quickRunHint:
      'The Begin node defines no input fields. Upload a sample document to start the Pipeline dataflow.',
    selectSamples: 'Select sample documents',
  },
  outputPanel: {
    title: 'END node output',
    viewResult: 'View result',
    downloadJson: 'Download JSON',
    resultReady: 'The result page is ready for this run.',
    resultMissingDocId:
      'The file for this run is recorded. Without a doc_id, the END output can only be viewed in this panel.',
    empty:
      'No END output to download yet. The final dataflow result appears here once the run completes.',
    errorTitle: 'Run error',
  },
  timeline: {
    empty:
      'The Pipeline has not started or has no logs yet. Fill in the start inputs on the Run tab to start it.',
    node: 'Node',
    toolNode: 'Tool node',
    progress: 'Progress',
    runMessages: 'Run messages',
    subtasks: 'Subtasks',
  },
  notices: {
    missingCanvasForSave:
      'Canvas ID is missing, so the current Pipeline context cannot be saved',
    saveFailed: 'Save failed, so the Pipeline cannot start',
    missingCanvasForRun: 'Canvas ID is missing, so the Pipeline cannot run',
    tokenizerRequired: 'Add a Tokenizer node before starting the Pipeline',
    noDownloadableOutput: 'This Pipeline has no output to download yet',
    noResult: 'This Pipeline has no result to view yet',
    resultMissingDocId:
      'END output is ready, but the file doc_id is missing, so the result page cannot open yet',
  },
}
