import { Operator } from '../../../constant'
import { SearXNGForm } from '../../searxng-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const SearXNGToolForm = createToolFormWrapper(Operator.SearXNG, SearXNGForm)

export default SearXNGToolForm
