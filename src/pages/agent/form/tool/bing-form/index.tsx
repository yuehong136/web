import { Operator } from '../../../constant'
import { BingForm } from '../../bing-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const BingToolForm = createToolFormWrapper(Operator.Bing, BingForm)

export default BingToolForm
