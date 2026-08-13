import common from './common'
import datasource from './datasource'
import flow from './flow'
import layout from './layout'
import agent from './agent'
import agents from './agents'
import knowledge from './knowledge'
import home from './home'
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
  ...common,
  ...datasource,
  ...flow,
  ...layout,
  ...agent,
  ...agents,
  ...knowledge,
  ...home,
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
