/**
 * Where provider logos come from: our own SVGs under assets/svg/llm and, for
 * providers we have no file for, @lobehub/icons-static-svg marks. Every file
 * is imported as its own URL (`no-inline`), so the logo table costs a few
 * strings in the first-load bundle and each logo loads when it is shown.
 *
 * The RAGFlow iconfont sprite that used to draw most of IconMap is gone; its
 * names map onto these sources in SPRITE_SUCCESSORS.
 */
import openDataLoaderLogoUrl from '@/assets/images/opendataloader.webp?url&no-inline'
// Brand marks imported one by one so only these reach the bundle. `-color`
// files are full-colour images; the others are single-colour marks drawn as a
// mask in the text colour, so they follow light and dark like the sprite did.
import ai302Logo from '@lobehub/icons-static-svg/icons/ai302-color.svg?url&no-inline'
import alibabaCloudLogo from '@lobehub/icons-static-svg/icons/alibabacloud-color.svg?url&no-inline'
import anthropicLogo from '@lobehub/icons-static-svg/icons/anthropic.svg?url&no-inline'
import anyscaleLogo from '@lobehub/icons-static-svg/icons/anyscale-color.svg?url&no-inline'
import awsLogo from '@lobehub/icons-static-svg/icons/aws.svg?url&no-inline'
import azureLogo from '@lobehub/icons-static-svg/icons/azure-color.svg?url&no-inline'
import baichuanLogo from '@lobehub/icons-static-svg/icons/baichuan-color.svg?url&no-inline'
import baiduCloudLogo from '@lobehub/icons-static-svg/icons/baiducloud-color.svg?url&no-inline'
import bailianLogo from '@lobehub/icons-static-svg/icons/bailian-color.svg?url&no-inline'
import bedrockLogo from '@lobehub/icons-static-svg/icons/bedrock-color.svg?url&no-inline'
import byteDanceLogo from '@lobehub/icons-static-svg/icons/bytedance-color.svg?url&no-inline'
import cerebrasLogo from '@lobehub/icons-static-svg/icons/cerebras.svg?url&no-inline'
import chatGlmLogo from '@lobehub/icons-static-svg/icons/chatglm-color.svg?url&no-inline'
import claudeLogo from '@lobehub/icons-static-svg/icons/claude-color.svg?url&no-inline'
import cloudflareLogo from '@lobehub/icons-static-svg/icons/cloudflare-color.svg?url&no-inline'
import cohereLogo from '@lobehub/icons-static-svg/icons/cohere-color.svg?url&no-inline'
import cometApiLogo from '@lobehub/icons-static-svg/icons/cometapi-color.svg?url&no-inline'
import deepInfraLogo from '@lobehub/icons-static-svg/icons/deepinfra-color.svg?url&no-inline'
import deepSeekLogo from '@lobehub/icons-static-svg/icons/deepseek-color.svg?url&no-inline'
import doubaoLogo from '@lobehub/icons-static-svg/icons/doubao-color.svg?url&no-inline'
import falLogo from '@lobehub/icons-static-svg/icons/fal-color.svg?url&no-inline'
import fireworksLogo from '@lobehub/icons-static-svg/icons/fireworks-color.svg?url&no-inline'
import fishAudioLogo from '@lobehub/icons-static-svg/icons/fishaudio.svg?url&no-inline'
import giteeAiLogo from '@lobehub/icons-static-svg/icons/giteeai.svg?url&no-inline'
import githubLogo from '@lobehub/icons-static-svg/icons/github.svg?url&no-inline'
import googleLogo from '@lobehub/icons-static-svg/icons/google-color.svg?url&no-inline'
import googleCloudLogo from '@lobehub/icons-static-svg/icons/googlecloud-color.svg?url&no-inline'
import groqLogo from '@lobehub/icons-static-svg/icons/groq.svg?url&no-inline'
import huaweiLogo from '@lobehub/icons-static-svg/icons/huawei-color.svg?url&no-inline'
import huggingFaceLogo from '@lobehub/icons-static-svg/icons/huggingface-color.svg?url&no-inline'
import hunyuanLogo from '@lobehub/icons-static-svg/icons/hunyuan-color.svg?url&no-inline'
import hyperbolicLogo from '@lobehub/icons-static-svg/icons/hyperbolic-color.svg?url&no-inline'
import iflytekLogo from '@lobehub/icons-static-svg/icons/iflytekcloud-color.svg?url&no-inline'
import infinigenceLogo from '@lobehub/icons-static-svg/icons/infinigence-color.svg?url&no-inline'
import jinaLogo from '@lobehub/icons-static-svg/icons/jina.svg?url&no-inline'
import kimiLogo from '@lobehub/icons-static-svg/icons/kimi.svg?url&no-inline'
import leptonLogo from '@lobehub/icons-static-svg/icons/leptonai-color.svg?url&no-inline'
import lmStudioLogo from '@lobehub/icons-static-svg/icons/lmstudio.svg?url&no-inline'
import longcatLogo from '@lobehub/icons-static-svg/icons/longcat-color.svg?url&no-inline'
import metaLogo from '@lobehub/icons-static-svg/icons/meta.svg?url&no-inline'
import microsoftLogo from '@lobehub/icons-static-svg/icons/microsoft-color.svg?url&no-inline'
import miniMaxLogo from '@lobehub/icons-static-svg/icons/minimax-color.svg?url&no-inline'
import mistralLogo from '@lobehub/icons-static-svg/icons/mistral-color.svg?url&no-inline'
import modelScopeLogo from '@lobehub/icons-static-svg/icons/modelscope-color.svg?url&no-inline'
import moonshotLogo from '@lobehub/icons-static-svg/icons/moonshot.svg?url&no-inline'
import novitaLogo from '@lobehub/icons-static-svg/icons/novita.svg?url&no-inline'
import nvidiaLogo from '@lobehub/icons-static-svg/icons/nvidia-color.svg?url&no-inline'
import ollamaLogo from '@lobehub/icons-static-svg/icons/ollama.svg?url&no-inline'
import openAiLogo from '@lobehub/icons-static-svg/icons/openai.svg?url&no-inline'
import openRouterLogo from '@lobehub/icons-static-svg/icons/openrouter.svg?url&no-inline'
import ppioLogo from '@lobehub/icons-static-svg/icons/ppio-color.svg?url&no-inline'
import qwenLogo from '@lobehub/icons-static-svg/icons/qwen-color.svg?url&no-inline'
import replicateLogo from '@lobehub/icons-static-svg/icons/replicate.svg?url&no-inline'
import sambaNovaLogo from '@lobehub/icons-static-svg/icons/sambanova-color.svg?url&no-inline'
import senseNovaLogo from '@lobehub/icons-static-svg/icons/sensenova-color.svg?url&no-inline'
import siliconCloudLogo from '@lobehub/icons-static-svg/icons/siliconcloud-color.svg?url&no-inline'
import sparkLogo from '@lobehub/icons-static-svg/icons/spark-color.svg?url&no-inline'
import tencentLogo from '@lobehub/icons-static-svg/icons/tencent-color.svg?url&no-inline'
import tencentCloudLogo from '@lobehub/icons-static-svg/icons/tencentcloud-color.svg?url&no-inline'
import togetherLogo from '@lobehub/icons-static-svg/icons/together-color.svg?url&no-inline'
import upstageLogo from '@lobehub/icons-static-svg/icons/upstage-color.svg?url&no-inline'
import vertexAiLogo from '@lobehub/icons-static-svg/icons/vertexai-color.svg?url&no-inline'
import vllmLogo from '@lobehub/icons-static-svg/icons/vllm-color.svg?url&no-inline'
import volcengineLogo from '@lobehub/icons-static-svg/icons/volcengine-color.svg?url&no-inline'
import voyageLogo from '@lobehub/icons-static-svg/icons/voyage-color.svg?url&no-inline'
import wenxinLogo from '@lobehub/icons-static-svg/icons/wenxin-color.svg?url&no-inline'
import xaiLogo from '@lobehub/icons-static-svg/icons/xai.svg?url&no-inline'
import xinferenceLogo from '@lobehub/icons-static-svg/icons/xinference-color.svg?url&no-inline'
import zhipuLogo from '@lobehub/icons-static-svg/icons/zhipu-color.svg?url&no-inline'

export interface LogoFile {
  url: string
  /** Single-colour: drawn as a mask in the current text colour. */
  mono?: true
}

/** Our own logo files, by IconMap icon name (with -bright/-dark variants). */
const LOCAL_LOGOS = import.meta.glob<string>(
  '/src/assets/svg/llm/{local-ai,gemini,stepfun,wenxin,yi,youdao,baai,nomic-ai,sentence-transformers,aimlapi,astraflow,fastembed,funasr,futurmix,greenpt,grok,huaweicloud,mws,new-api,orcarouter,qiniu,somark,tokenhub,xiaomi,mineru-bright,mineru-dark,paddleocr,n1n,jiekouai-bright,jiekouai-dark,avian,ragcon,perplexity-bright,perplexity-dark,openai-api,perfx-cloud,gpustack,deerapi,tokenpony,builtin}.svg',
  { eager: true, query: '?url&no-inline', import: 'default' },
)
/** Local files that are a single colour (no fill of their own). */
const MONO_LOCAL = new Set(['builtin'])

export function localProviderLogo(iconName: string): LogoFile | undefined {
  if (iconName === 'opendataloader') return { url: openDataLoaderLogoUrl }
  const url = LOCAL_LOGOS[`/src/assets/svg/llm/${iconName}.svg`]
  if (!url) return undefined
  return MONO_LOCAL.has(iconName) ? { url, mono: true } : { url }
}

/** @lobehub/icons marks by icon key. */
export const LOBE_LOGOS: Record<string, LogoFile> = {
  ai302: { url: ai302Logo },
  alibabacloud: { url: alibabaCloudLogo },
  anthropic: { url: anthropicLogo, mono: true },
  anyscale: { url: anyscaleLogo },
  aws: { url: awsLogo, mono: true },
  azure: { url: azureLogo },
  baichuan: { url: baichuanLogo },
  baiducloud: { url: baiduCloudLogo },
  bailian: { url: bailianLogo },
  bedrock: { url: bedrockLogo },
  bytedance: { url: byteDanceLogo },
  cerebras: { url: cerebrasLogo, mono: true },
  chatglm: { url: chatGlmLogo },
  claude: { url: claudeLogo },
  cloudflare: { url: cloudflareLogo },
  cohere: { url: cohereLogo },
  cometapi: { url: cometApiLogo },
  deepinfra: { url: deepInfraLogo },
  deepseek: { url: deepSeekLogo },
  doubao: { url: doubaoLogo },
  fal: { url: falLogo },
  fireworks: { url: fireworksLogo },
  fishaudio: { url: fishAudioLogo, mono: true },
  giteeai: { url: giteeAiLogo, mono: true },
  github: { url: githubLogo, mono: true },
  google: { url: googleLogo },
  googlecloud: { url: googleCloudLogo },
  groq: { url: groqLogo, mono: true },
  huawei: { url: huaweiLogo },
  huggingface: { url: huggingFaceLogo },
  hunyuan: { url: hunyuanLogo },
  hyperbolic: { url: hyperbolicLogo },
  iflytekcloud: { url: iflytekLogo },
  infinigence: { url: infinigenceLogo },
  jina: { url: jinaLogo, mono: true },
  kimi: { url: kimiLogo, mono: true },
  leptonai: { url: leptonLogo },
  lmstudio: { url: lmStudioLogo, mono: true },
  longcat: { url: longcatLogo },
  meta: { url: metaLogo, mono: true },
  microsoft: { url: microsoftLogo },
  minimax: { url: miniMaxLogo },
  mistral: { url: mistralLogo },
  modelscope: { url: modelScopeLogo },
  moonshot: { url: moonshotLogo, mono: true },
  novita: { url: novitaLogo, mono: true },
  nvidia: { url: nvidiaLogo },
  ollama: { url: ollamaLogo, mono: true },
  openai: { url: openAiLogo, mono: true },
  openrouter: { url: openRouterLogo, mono: true },
  ppio: { url: ppioLogo },
  qwen: { url: qwenLogo },
  replicate: { url: replicateLogo, mono: true },
  sambanova: { url: sambaNovaLogo },
  sensenova: { url: senseNovaLogo },
  siliconcloud: { url: siliconCloudLogo },
  spark: { url: sparkLogo },
  tencent: { url: tencentLogo },
  tencentcloud: { url: tencentCloudLogo },
  together: { url: togetherLogo },
  upstage: { url: upstageLogo },
  vertexai: { url: vertexAiLogo },
  vllm: { url: vllmLogo },
  volcengine: { url: volcengineLogo },
  voyage: { url: voyageLogo },
  wenxin: { url: wenxinLogo },
  xai: { url: xaiLogo, mono: true },
  xinference: { url: xinferenceLogo },
  zhipu: { url: zhipuLogo },
}

/**
 * IconMap names the retired sprite drew, and the @lobehub key that draws them
 * now. A theme pair (`together-bright`, `together-dark`) maps by its base name;
 * the marks drawn as masks already follow the theme.
 */
export const SPRITE_SUCCESSORS: Record<string, string> = {
  'tongyi-qianwen': 'qwen',
  moonshot: 'moonshot',
  openai: 'openai',
  zhipu: 'zhipu',
  ollama: 'ollama',
  xinference: 'xinference',
  modelscope: 'modelscope',
  deepseek: 'deepseek',
  volcengine: 'volcengine',
  baichuan: 'baichuan',
  jina: 'jina',
  MiniMax: 'minimax',
  mistral: 'mistral',
  azure: 'azure',
  bedrock: 'bedrock',
  'groq-next': 'groq',
  'open-router': 'openrouter',
  nvidia: 'nvidia',
  'lm-studio': 'lmstudio',
  cohere: 'cohere',
  lepton: 'leptonai',
  together: 'together',
  upstage: 'upstage',
  'novita-ai': 'novita',
  siliconflow: 'siliconcloud',
  ppio: 'ppio',
  replicate: 'replicate',
  hunyuan: 'hunyuan',
  spark: 'spark',
  wenxinyiyan: 'wenxin',
  'fish-audio': 'fishaudio',
  'tencent-cloud': 'tencentcloud',
  anthropic: 'anthropic',
  voyage: 'voyage',
  'google-cloud': 'googlecloud',
  huggingface: 'huggingface',
  vllm: 'vllm',
  'gitee-ai': 'giteeai',
  xai: 'xai',
  ai302: 'ai302',
  deepinfra: 'deepinfra',
  longcat: 'longcat',
  cometapi: 'cometapi',
}

/**
 * Other spellings of a provider (lowercase letters and digits only) and the
 * @lobehub icon key that draws it. Names matching a key directly need no entry.
 */
export const LOBE_ALIASES: Record<string, string> = {
  alibaba: 'alibabacloud',
  aliyun: 'alibabacloud',
  amazon: 'aws',
  baidu: 'baiducloud',
  bigmodel: 'zhipu',
  dashscope: 'bailian',
  ernie: 'baiducloud',
  fireworksai: 'fireworks',
  falai: 'fal',
  glm: 'chatglm',
  githubmodels: 'github',
  googleai: 'google',
  googleaistudio: 'google',
  iflytek: 'iflytekcloud',
  llama: 'meta',
  metaai: 'meta',
  moonshot: 'kimi',
  moonshotai: 'kimi',
  qianfan: 'baiducloud',
  qianwen: 'qwen',
  sensetime: 'sensenova',
  siliconflow: 'siliconcloud',
  tongyi: 'qwen',
  vertex: 'vertexai',
  googlevertexai: 'vertexai',
  volcark: 'doubao',
  workersai: 'cloudflare',
  xfyun: 'iflytekcloud',
  zhipuai: 'zhipu',
}
