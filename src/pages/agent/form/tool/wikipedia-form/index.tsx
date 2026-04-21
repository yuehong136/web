import { Operator } from '../../../constant'
import { WikipediaForm } from '../../wikipedia-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const WikipediaToolForm = createToolFormWrapper(
  Operator.Wikipedia,
  WikipediaForm,
)

export default WikipediaToolForm
