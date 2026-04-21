import { Operator } from '../../../constant'
import { GoogleForm } from '../../google-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const GoogleToolForm = createToolFormWrapper(Operator.Google, GoogleForm)

export default GoogleToolForm
