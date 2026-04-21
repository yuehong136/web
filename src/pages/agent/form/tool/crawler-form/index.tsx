import { Operator } from '../../../constant'
import { CrawlerForm } from '../../crawler-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const CrawlerToolForm = createToolFormWrapper(Operator.Crawler, CrawlerForm)

export default CrawlerToolForm
