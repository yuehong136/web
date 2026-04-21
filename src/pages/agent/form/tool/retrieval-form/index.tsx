import { Operator } from '../../../constant'
import { RetrievalForm } from '../../retrieval'
import { createToolFormWrapper } from '../tool-form-wrapper'

const RetrievalToolForm = createToolFormWrapper(
  Operator.Retrieval,
  RetrievalForm,
)

export default RetrievalToolForm
