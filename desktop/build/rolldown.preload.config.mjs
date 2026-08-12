import { electronBuildConfigs } from './rolldown.config.mjs'

const [, { input, output }] = electronBuildConfigs

export default {
  ...input,
  output,
}
