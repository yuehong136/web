import type { RecommendCard } from '../types'

/**
 * 推荐卡片数据
 */
export const recommendCards: RecommendCard[] = [
  {
    id: 1,
    title: '银发经济崛起背后有哪些新商机?',
    titleKey: 'home.recommendations.silverEconomy',
    tag: '猜你想聊',
    tagKey: 'home.recommendations.guess',
    bgColor: 'bg-components-recommend-card-bg-1',
  },
  {
    id: 2,
    title: '副业收入超主业，该辞职全职搞副业吗?',
    titleKey: 'home.recommendations.sideBusiness',
    tag: '猜你想聊',
    tagKey: 'home.recommendations.guess',
    bgColor: 'bg-components-recommend-card-bg-2',
  },
  {
    id: 3,
    title: '一键直出动植物百科',
    titleKey: 'home.recommendations.animalEncyclopedia',
    tag: '创意设计',
    tagKey: 'home.recommendations.creativeDesign',
    bgColor: 'bg-components-recommend-card-bg-3',
    hasImage: true,
    imageUrl:
      'https://images.unsplash.com/photo-1698844243252-520dc762243e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk3Mzg5MTV8&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 4,
    title: '水贝杰我睿疑似暴雷，专班介入后现状如何?',
    titleKey: 'home.recommendations.shuibeiRisk',
    tag: '聊热点',
    tagKey: 'home.recommendations.hotTopic',
    bgColor: 'bg-components-recommend-card-bg-4',
  },
  {
    id: 5,
    title: '470万颗冰毒坠泰国河中，生态影响与恢复需多久?',
    titleKey: 'home.recommendations.methRiverImpact',
    tag: '聊热点',
    tagKey: 'home.recommendations.hotTopic',
    bgColor: 'bg-components-recommend-card-bg-4',
  },
]
