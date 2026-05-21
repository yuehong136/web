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
import { fileURLToPath } from 'url'
import { generateThemeFiles } from './theme-generator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const THEMES_DIR = path.join(__dirname)
const LIGHT_CSS_PATH = path.join(THEMES_DIR, 'light.css')
const DARK_CSS_PATH = path.join(THEMES_DIR, 'dark.css')
const TOKEN_VALUES_PATH = path.join(THEMES_DIR, 'token-values.generated.ts')

function main() {
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
    fs.writeFileSync(LIGHT_CSS_PATH, light, 'utf8')
    fs.writeFileSync(DARK_CSS_PATH, dark, 'utf8')
    fs.writeFileSync(TOKEN_VALUES_PATH, tokenValues, 'utf8')

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

    // 漂移校验（CSS 分类器对少量令牌有已知遗漏，故 JS 是完整超集，不强制 CSS==JS）：
    //  - 两个 CSS 主题键数一致；两个 JS 主题键数一致；JS 为 CSS 的超集。
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
    if (jsLightCount < lightTokenCount) {
      console.error(
        `❌ JS 产物未覆盖 CSS 令牌(应为超集): JS=${jsLightCount} < CSS=${lightTokenCount}`,
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

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as buildThemes }
