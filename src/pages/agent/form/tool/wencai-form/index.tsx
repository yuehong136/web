import { Operator } from '../../../constant'
import { WenCaiForm } from '../../wencai-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const WenCaiToolForm = createToolFormWrapper(Operator.WenCai, WenCaiForm)

export default WenCaiToolForm
