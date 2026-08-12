/**
 * 认证凭证、密码与密钥不得写入浏览器 console。
 *
 * 本规则只拦截直接 console 调用中的明确敏感标识，避免误伤 tokenCount、
 * designToken 等无凭证含义的变量。它不尝试做跨函数数据流分析；日志平台接入后
 * 仍需在统一 logger 边界做运行时脱敏。
 */

const SENSITIVE_NAMES = new Set([
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'authtoken',
  'bearertoken',
  'authorizationtoken',
  'githubaccesstoken',
  'jwt',
  'password',
  'passwd',
  'imappassword',
  'secret',
  'clientsecret',
  'appsecret',
  'apisecret',
  'accesskeysecret',
  'awssecretaccesskey',
  'apikey',
  'accesskey',
  'privatekey',
  'serviceaccountkey',
  'authorization',
  'credential',
  'credentials',
  'auth',
])

const AUTH_RESPONSE_LABEL =
  /\b(?:full\s+)?(?:login|register|registration|auth|authentication)\s+(?:response|result|payload)\b/i
const NAME_PREFIX = /^(?:get|read|load|fetch|resolve|extract|decrypt)/
const LABEL_PREFIX = /^(?:extracted|setting|received|resolved)/

function normalizedName(value) {
  return typeof value === 'string'
    ? value.replace(/[^a-z0-9]/gi, '').toLowerCase()
    : ''
}

function staticPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') return null
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }
  if (
    node.computed &&
    node.property.type === 'Literal' &&
    typeof node.property.value === 'string'
  ) {
    return node.property.value
  }
  return null
}

function isSensitiveName(value) {
  const normalized = normalizedName(value)
  return (
    SENSITIVE_NAMES.has(normalized) ||
    SENSITIVE_NAMES.has(normalized.replace(NAME_PREFIX, ''))
  )
}

function isGlobalObject(node) {
  return (
    node?.type === 'Identifier' &&
    ['window', 'globalThis', 'self'].includes(node.name)
  )
}

function isConsoleObject(node) {
  if (node?.type === 'Identifier' && node.name === 'console') return true
  return (
    node?.type === 'MemberExpression' &&
    isGlobalObject(node.object) &&
    staticPropertyName(node) === 'console'
  )
}

function isConsoleMethod(node) {
  if (!node || node.type !== 'MemberExpression') return false
  if (!isConsoleObject(node.object)) return false
  const method = staticPropertyName(node)
  return ['log', 'info', 'debug', 'warn', 'error'].includes(method)
}

function containsSensitiveReference(node) {
  if (!node || typeof node !== 'object') return false

  if (node.type === 'Identifier' && isSensitiveName(node.name)) {
    return true
  }

  if (node.type === 'MemberExpression') {
    const propertyName = staticPropertyName(node)
    if (isSensitiveName(propertyName)) return true
    return containsSensitiveReference(node.object)
  }

  if (node.type === 'Property') {
    const keyName =
      node.key.type === 'Identifier'
        ? node.key.name
        : node.key.type === 'Literal'
          ? node.key.value
          : null
    const isSafeStatusLiteral =
      node.value.type === 'Literal' &&
      (typeof node.value.value === 'boolean' ||
        typeof node.value.value === 'number' ||
        node.value.value === null)
    if (isSensitiveName(keyName) && !isSafeStatusLiteral) return true
    return containsSensitiveReference(node.value)
  }

  if (node.type === 'Literal') return false

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') continue
    if (Array.isArray(value)) {
      if (value.some((child) => containsSensitiveReference(child))) return true
    } else if (value && typeof value === 'object') {
      if (containsSensitiveReference(value)) return true
    }
  }

  return false
}

function hasSensitiveLabel(node) {
  if (!node) return false
  let text = ''
  if (node.type === 'Literal' && typeof node.value === 'string') {
    text = node.value
  }
  if (node.type === 'TemplateLiteral') {
    text = node.quasis.map((part) => part.value.cooked ?? '').join(' ')
  }

  if (!text) return false
  if (AUTH_RESPONSE_LABEL.test(text)) return true
  if (/[^a-z0-9\s_:=-]/i.test(text)) return false

  const normalized = normalizedName(text).replace(LABEL_PREFIX, '')
  return isSensitiveName(normalized)
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow authentication credentials, passwords, and secrets in browser console calls.',
    },
    schema: [],
    messages: {
      sensitiveConsole:
        '禁止把认证凭证、密码、密钥或完整认证响应写入 console；只记录脱敏后的事件码和 trace ID。',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isConsoleMethod(node.callee)) return

        const hasLabeledDynamicValue =
          hasSensitiveLabel(node.arguments[0]) && node.arguments.length > 1
        if (
          hasLabeledDynamicValue ||
          node.arguments.some((argument) =>
            containsSensitiveReference(argument),
          )
        ) {
          context.report({ node, messageId: 'sensitiveConsole' })
        }
      },
    }
  },
}
