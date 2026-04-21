import { Operator } from '../../../constant'
import { PubMedForm } from '../../pubmed-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const PubMedToolForm = createToolFormWrapper(Operator.PubMed, PubMedForm)

export default PubMedToolForm
