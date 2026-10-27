export const browserMessages = {
  browserUploadFiles: 'Upload files',
  browserRequiredModel: 'Select a model.',
  browserUploadedFile: 'Uploaded file reference',
  browser: 'Browser',
  browserDescription:
    'Automate browser tasks with an OpenAI-compatible model and prompt. Upload scoped files or URLs and save downloaded files.',
  maxSteps: 'Max steps',
  headless: 'Headless',
  enableDefaultExtensions: 'Enable default extensions',
  enableDefaultExtensionsTip:
    'Enable browser-use extensions for blocking ads, handling cookies and cleaning URLs. This may download extensions at runtime.',
  chromiumSandbox: 'Chromium sandbox',
  chromiumSandboxTip:
    'Enable the Chromium sandbox on regular hosts. Containers running as root may require it to be disabled.',
  persistSession: 'Persist browser session',
  persistSessionTip:
    'Reuse the session for this user, agent and Browser node to avoid repeated logins.',
  uploadSources: 'Upload sources',
  uploadSourcesTip:
    'Add file IDs, HTTP(S) URLs, or variables referring to uploaded files. Use {sys.file_refs} for files attached to this run; {sys.files} contains parsed content. Each row is one source.',
  addUploadSource: 'Add upload source',
  removeUploadSource: 'Remove upload source {{index}}',
  uploadSourceLabel: 'Upload source {{index}}',
  uploadSourcePlaceholder:
    'File ID, https://example.com/file.pdf, or {CodeExec:files@result}',
  browserInvalidNumber: 'Enter a valid number in the allowed range.',
  browserRequiredPrompt: 'Enter a browser task prompt.',
}
