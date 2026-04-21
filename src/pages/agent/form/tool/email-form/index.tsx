import { Operator } from '../../../constant'
import { EmailForm } from '../../email-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const EmailToolForm = createToolFormWrapper(Operator.Email, EmailForm)

export default EmailToolForm
