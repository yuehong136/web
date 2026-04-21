import { Operator } from '../../../constant'
import { DuckDuckGoForm } from '../../duckduckgo-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const DuckDuckGoToolForm = createToolFormWrapper(
  Operator.DuckDuckGo,
  DuckDuckGoForm,
)

export default DuckDuckGoToolForm
