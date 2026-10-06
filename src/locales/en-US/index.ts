import common from './common'
import { skillsResource } from './skills'
import datasource from './datasource'
import flow from './flow'
import layout from './layout'
import agent from './agent'
import agents from './agents'
import knowledge from './knowledge'
import documentCreate from './document-create'
import home from './home'
import chat from './chat'
import explore from './explore'
import search from './search'
import memory from './memory'
import studio from './studio'
import tools from './tools'
import mcp from './mcp'
import settings from './settings'
import channel from './channel'
import routeErrors from './route-errors'
import { authResource as auth } from './auth'
import { desktopResource as desktop } from './desktop'

export default {
  ...skillsResource,
  ...common,
  ...datasource,
  ...flow,
  ...layout,
  ...agent,
  ...agents,
  ...knowledge,
  ...documentCreate,
  ...home,
  ...chat,
  ...explore,
  ...search,
  ...memory,
  ...studio,
  ...tools,
  ...mcp,
  ...settings,
  ...channel,
  ...routeErrors,
  ...auth,
  ...desktop,
}
