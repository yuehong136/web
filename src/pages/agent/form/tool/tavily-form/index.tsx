import { Operator } from '../../../constant'
import { TavilyForm } from '../../tavily-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const TavilyToolForm = createToolFormWrapper(Operator.TavilySearch, TavilyForm)
export const TavilyExtractToolForm = createToolFormWrapper(
  Operator.TavilyExtract,
  TavilyForm,
)

export default TavilyToolForm
