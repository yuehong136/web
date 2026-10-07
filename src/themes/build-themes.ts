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
      console.warn('⚠️  设计令牌验证警告:')
      errors.forEach((error) => console.warn(`   - ${error}`))
      console.warn('')
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

    // 统计信息
    const lightTokenCount = (light.match(/--color-/g) || []).length
    const darkTokenCount = (dark.match(/--color-/g) || []).length
    // JS 产物每套令牌一行 `'key': '...'`，按 key 数统计应与 CSS 一致
    const jsLightCount = (tokenValues.match(
      /lightTokenValues[\s\S]*?darkTokenValues/,
    ) ?? [''])[0]
      .split('\n')
      .filter((line) => /^\s+"/.test(line)).length
    const jsDarkCount =
      tokenValues
        .split('darkTokenValues')[1]
        ?.split('\n')
        .filter((line) => /^\s+"/.test(line)).length ?? 0

    console.log('')
    console.log('📊 统计信息:')
    console.log(`   🌞 亮色主题令牌数量(CSS): ${lightTokenCount}`)
    console.log(`   🌙 暗色主题令牌数量(CSS): ${darkTokenCount}`)
    console.log(
      `   🧩 JS 产物令牌数量: light ${jsLightCount} / dark ${jsDarkCount}`,
    )
    console.log(
      `   📦 文件大小: ${(fs.statSync(LIGHT_CSS_PATH).size / 1024).toFixed(1)}KB + ${(fs.statSync(DARK_CSS_PATH).size / 1024).toFixed(1)}KB + ${(fs.statSync(TOKEN_VALUES_PATH).size / 1024).toFixed(1)}KB`,
    )

    // 两种消费入口必须覆盖同一套令牌，不能让组件因分类遗漏而缺少 CSS 值。
    if (lightTokenCount !== darkTokenCount) {
      console.error(
        `❌ CSS 明暗令牌数不一致: light=${lightTokenCount} dark=${darkTokenCount}`,
      )
      process.exit(1)
    }
    if (jsLightCount !== jsDarkCount) {
      console.error(
        `❌ JS 明暗令牌数不一致: light=${jsLightCount} dark=${jsDarkCount}`,
      )
      process.exit(1)
    }
    if (jsLightCount !== lightTokenCount) {
      console.error(
        `❌ CSS 与 JS 令牌数量不一致: JS=${jsLightCount} CSS=${lightTokenCount}`,
      )
      process.exit(1)
    }

    if (errors.length === 0) {
      console.log('   ✨ 所有设计令牌验证通过')
    }
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
