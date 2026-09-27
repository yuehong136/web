export default {
  documentCreate: {
    menu: 'Add document',
    uploadFile: 'Upload files',
    fromWeb: 'Import webpage',
    blank: 'Create blank document',
    webTitle: 'Create document from webpage',
    blankTitle: 'Create blank document',
    webDescription: 'The webpage will be saved as a PDF document.',
    blankDescription: 'Open the chunk editor after creation to add content.',
    name: 'Document name',
    webNamePlaceholder: 'Example: Product guide',
    blankNamePlaceholder: 'Example: notes.txt',
    url: 'Webpage URL',
    urlPlaceholder: 'https://example.com/article',
    nameRequired: 'Enter a document name.',
    nameTooLong: 'The name cannot exceed 255 UTF-8 bytes.',
    urlInvalid: 'Enter a valid HTTP or HTTPS webpage URL.',
    parseAfterCreate: 'Parse after creation',
    parseAfterCreateDescription:
      'Start parsing automatically after the webpage is saved.',
    create: 'Create document',
    creating: 'Creating...',
    webSuccess: 'Webpage document created.',
    blankSuccess: 'Blank document created.',
    createFailed:
      'Could not create the document. Check the input and try again.',
    parseFailed:
      'Document created, but parsing could not start. Start it from the document list.',
    parseStarted: 'Document parsing started.',
  },
}
