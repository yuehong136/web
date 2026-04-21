import { Operator } from '../../../constant'
import { GithubForm } from '../../github-form'
import { createToolFormWrapper } from '../tool-form-wrapper'

const GithubToolForm = createToolFormWrapper(Operator.GitHub, GithubForm)

export default GithubToolForm
