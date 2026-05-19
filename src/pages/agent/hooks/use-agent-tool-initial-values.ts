import omit from 'lodash/omit.js'
import pick from 'lodash/pick.js'
import { useCallback } from 'react'
import { Operator } from '../constant'
import { useInitializeOperatorParams } from './use-add-node'

export function useAgentToolInitialValues() {
  const { initialFormValuesMap } = useInitializeOperatorParams()

  const initializeAgentToolValues = useCallback(
    (operatorName: Operator) => {
      const initialValues = initialFormValuesMap[operatorName]

      switch (operatorName) {
        case Operator.Retrieval:
          return {
            ...omit(initialValues, 'query', 'outputs'),
            description: '',
          }
        case Operator.TavilySearch:
        case Operator.TavilyExtract:
          return {
            api_key: '',
          }
        case Operator.ExeSQL:
          return omit(initialValues, 'sql', 'outputs')
        case Operator.Bing:
          return omit(initialValues, 'query', 'outputs')
        case Operator.YahooFinance:
          return omit(initialValues, 'stock_code', 'outputs')
        case Operator.Email:
          return pick(
            initialValues,
            'smtp_server',
            'smtp_port',
            'email',
            'password',
            'sender_name',
          )
        case Operator.DuckDuckGo:
          return pick(initialValues, 'top_n', 'channel')
        case Operator.Wikipedia:
          return pick(initialValues, 'top_n', 'language')
        case Operator.Google:
          return pick(initialValues, 'api_key', 'country', 'language')
        case Operator.GoogleScholar:
          return omit(initialValues, 'query', 'outputs')
        case Operator.ArXiv:
          return pick(initialValues, 'top_n', 'sort_by')
        case Operator.PubMed:
          return pick(initialValues, 'top_n', 'email')
        case Operator.GitHub:
          return pick(initialValues, 'top_n')
        case Operator.WenCai:
          return pick(initialValues, 'top_n', 'query_type')
        case Operator.Code:
          return {}
        case Operator.SearXNG:
          return pick(initialValues, 'searxng_url', 'top_n')
        case Operator.Crawler:
          return pick(initialValues, 'proxy', 'extract_type')
        default:
          return omit(initialValues, 'query', 'outputs')
      }
    },
    [initialFormValuesMap],
  )

  return { initializeAgentToolValues }
}
