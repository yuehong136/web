export const WenCaiQueryTypeOptions = [
  'stock',
  'zhishu',
  'fund',
  'hkstock',
  'usstock',
  'threeboard',
  'conbond',
  'insurance',
  'futures',
  'lccp',
  'foreign_exchange',
]

export const Jin10TypeOptions = ['flash', 'calendar', 'symbols', 'news']
export const Jin10FlashTypeOptions = new Array(5)
  .fill(1)
  .map((_, idx) => (idx + 1).toString())
export const Jin10CalendarTypeOptions = ['cj', 'qh', 'hk', 'us']
export const Jin10CalendarDatashapeOptions = ['data', 'event', 'holiday']
export const Jin10SymbolsTypeOptions = ['GOODS', 'FOREX', 'FUTURE', 'CRYPTO']
export const Jin10SymbolsDatatypeOptions = ['symbols', 'quotes']
export const TuShareSrcOptions = [
  'sina',
  'wallstreetcn',
  '10jqka',
  'eastmoney',
  'yuncaijing',
  'fenghuang',
  'jinrongjie',
]
