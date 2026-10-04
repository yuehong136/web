export const metadata = {
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
    valueType: 'Value type',
    invalidNumber: 'Enter finite numeric values.',
    types: { string: 'Text', list: 'List', time: 'Time', number: 'Number' },
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
    removeValueAria: 'Remove {{value}}',
  },
}
