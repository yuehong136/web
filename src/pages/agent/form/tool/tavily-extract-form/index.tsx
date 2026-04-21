import { Operator } from '../../../constant'
import { TavilyExtractForm } from '../../tavily-extract-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const TavilyExtractToolForm = createToolFormWrapper(
  Operator.TavilyExtract,
  TavilyExtractForm,
)

export default TavilyExtractToolForm
