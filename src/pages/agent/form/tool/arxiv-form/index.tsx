import { Operator } from '../../../constant'
import { ArxivForm } from '../../arxiv-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const ArxivToolForm = createToolFormWrapper(Operator.ArXiv, ArxivForm)

export default ArxivToolForm
