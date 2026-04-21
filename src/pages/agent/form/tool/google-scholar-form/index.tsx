import { Operator } from '../../../constant'
import { GoogleScholarForm } from '../../google-scholar-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const GoogleScholarToolForm = createToolFormWrapper(
  Operator.GoogleScholar,
  GoogleScholarForm,
)

export default GoogleScholarToolForm
