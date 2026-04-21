import { Operator } from '../../../constant'
import { ExeSQLForm } from '../../exesql'
import { createToolFormWrapper } from '../tool-form-wrapper'

const ExeSQLToolForm = createToolFormWrapper(Operator.ExeSQL, ExeSQLForm)

export default ExeSQLToolForm
