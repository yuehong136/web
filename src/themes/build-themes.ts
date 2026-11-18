#!/usr/bin/env tsx

/**
 * 主题构建脚本
 * 自动生成 light.css 和 dark.css 文件
 *
 * 使用方法:
 * npm run build:themes
 * 或
 * npx tsx src/themes/build-themes.ts
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { generateThemeFiles } from './theme-generator'
import { COLOR_SCHEMES } from './color-schemes'
import { SEMANTIC_TOKENS } from './semantic-tokens'
import { TOKEN_NAMES } from './tokens'
import { generateTailwindThemeFiles } from './tailwind-theme-generator'
import { format, resolveConfig } from 'prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const THEMES_DIR = path.join(__dirname)
const LIGHT_CSS_PATH = path.join(THEMES_DIR, 'light.css')
const DARK_CSS_PATH = path.join(THEMES_DIR, 'dark.css')
const TOKEN_VALUES_PATH = path.join(THEMES_DIR, 'token-values.generated.ts')

async function main() {
  console.log('🎨 开始生成主题文件...')

  try {
    // 生成主题文件内容（CSS + typed JS token target，同一来源）
    const { light, dark, tokenValues, errors } = generateThemeFiles()

    // 显示验证错误（如果有）
    if (errors.length > 0) {
      console.error('❌ 设计令牌验证失败:')
      errors.forEach((error) => console.warn(`   - ${error}`))
      throw new Error('Appearance token generation failed validation')
    }

    // 写入文件
    const options = await resolveConfig(LIGHT_CSS_PATH)
    const outputs = {
      [LIGHT_CSS_PATH]: light,
      [DARK_CSS_PATH]: dark,
      [TOKEN_VALUES_PATH]: tokenValues,
      ...Object.fromEntries(
        Object.entries(generateTailwindThemeFiles()).map(([filename, css]) => [
          path.join(THEMES_DIR, filename),
          css,
        ]),
      ),
    }
    // Drop mapping shards left over from a larger registry, and keep the
    // hand-written tailwind.css importing exactly the shards that exist.
    const shards = Object.keys(generateTailwindThemeFiles())
    for (const file of fs.readdirSync(THEMES_DIR))
      if (
        /^tailwind-tokens-\d+\.generated\.css$/.test(file) &&
        !shards.includes(file)
      )
        fs.rmSync(path.join(THEMES_DIR, file))
    const entry = fs.readFileSync(path.join(THEMES_DIR, 'tailwind.css'), 'utf8')
    const imported = [
      ...entry.matchAll(
        /@import '\.\/(tailwind-tokens-\d+\.generated\.css)' reference;/g,
      ),
    ].map((match) => match[1])
    if (imported.join() !== shards.join())
      throw new Error(`tailwind.css must import exactly: ${shards.join(', ')}`)
    for (const [filepath, content] of Object.entries(outputs)) {
      fs.writeFileSync(
        filepath,
        await format(content, { ...options, plugins: [], filepath }),
        'utf8',
      )
    }

    console.log('✅ 主题文件生成成功!')
    console.log(`   📄 ${path.relative(process.cwd(), LIGHT_CSS_PATH)}`)
    console.log(`   📄 ${path.relative(process.cwd(), DARK_CSS_PATH)}`)
    console.log(`   📄 ${path.relative(process.cwd(), TOKEN_VALUES_PATH)}`)

    // 每个方案的基础块都必须声明全部语义令牌，否则组件会静默取到空值。
    for (const [name, css] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      const missing = SEMANTIC_TOKENS.filter(
        (token) =>
          css.split(`--color-${token}:`).length - 1 < COLOR_SCHEMES.length,
      )
      if (missing.length > 0) {
        console.error(`❌ ${name}.css 缺少语义令牌: ${missing.join(', ')}`)
        process.exit(1)
      }
    }
    const size = (file: string) =>
      `${(fs.statSync(file).size / 1024).toFixed(1)}KB`
    console.log(
      `   📦 ${COLOR_SCHEMES.length} 个方案 × 明暗；JS 产物每套 ${TOKEN_NAMES.length} 个令牌；${size(LIGHT_CSS_PATH)} + ${size(DARK_CSS_PATH)} + ${size(TOKEN_VALUES_PATH)}`,
    )
  } catch (error) {
    console.error('❌ 生成主题文件失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件（pathToFileURL 兼容 Windows 盘符与反斜杠路径）
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main()
}

export { main as buildThemes }
