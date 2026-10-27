// DocGenerator节点初始值
export const initialDocGeneratorValues = {
  output_format: 'pdf',
  content: '',
  filename: '',
  header_text: '',
  footer_text: '',
  watermark_text: '',
  add_page_numbers: true,
  add_timestamp: true,
  include_download_info_in_content: false,
  font_size: 12,
  outputs: {
    doc_id: { type: 'string', value: '' },
    filename: { type: 'string', value: '' },
    mime_type: { type: 'string', value: '' },
    size: { type: 'number', value: 0 },
    download: { type: 'string', value: '' },
  },
}
