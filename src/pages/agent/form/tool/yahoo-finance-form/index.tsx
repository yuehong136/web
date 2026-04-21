import { Operator } from '../../../constant'
import { YahooFinanceForm } from '../../yahoo-finance-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const YahooFinanceToolForm = createToolFormWrapper(
  Operator.YahooFinance,
  YahooFinanceForm,
)

export default YahooFinanceToolForm
