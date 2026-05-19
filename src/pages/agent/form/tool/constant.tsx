import type { ComponentType } from 'react'
import { Operator } from '../../constant'
import type { INextOperatorForm } from '../../types'
import ArxivToolForm from './arxiv-form'
import BingToolForm from './bing-form'
import CrawlerToolForm from './crawler-form'
import DuckDuckGoToolForm from './duckduckgo-form'
import EmailToolForm from './email-form'
import ExeSQLToolForm from './exesql-form'
import GithubToolForm from './github-form'
import GoogleToolForm from './google-form'
import GoogleScholarToolForm from './google-scholar-form'
import PubMedToolForm from './pubmed-form'
import RetrievalToolForm from './retrieval-form'
import SearXNGToolForm from './searxng-form'
import TavilyToolForm, { TavilyExtractToolForm } from './tavily-form'
import WenCaiToolForm from './wencai-form'
import WikipediaToolForm from './wikipedia-form'
import YahooFinanceToolForm from './yahoo-finance-form'

function EmptyToolConfig() {
  return null
}

export const ToolFormConfigMap: Partial<
  Record<Operator, ComponentType<INextOperatorForm>>
> = {
  [Operator.ArXiv]: ArxivToolForm,
  [Operator.Bing]: BingToolForm,
  [Operator.Code]: EmptyToolConfig,
  [Operator.Crawler]: CrawlerToolForm,
  [Operator.DuckDuckGo]: DuckDuckGoToolForm,
  [Operator.Email]: EmailToolForm,
  [Operator.ExeSQL]: ExeSQLToolForm,
  [Operator.GitHub]: GithubToolForm,
  [Operator.Google]: GoogleToolForm,
  [Operator.GoogleScholar]: GoogleScholarToolForm,
  [Operator.PubMed]: PubMedToolForm,
  [Operator.Retrieval]: RetrievalToolForm,
  [Operator.SearXNG]: SearXNGToolForm,
  [Operator.TavilySearch]: TavilyToolForm,
  [Operator.TavilyExtract]: TavilyExtractToolForm,
  [Operator.WenCai]: WenCaiToolForm,
  [Operator.Wikipedia]: WikipediaToolForm,
  [Operator.YahooFinance]: YahooFinanceToolForm,
}
