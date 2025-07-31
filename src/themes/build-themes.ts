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

function main() {
  console.log('🎨 开始生成主题文件...')
  
  try {
    // 生成主题文件内容
    const { light, dark, errors } = generateThemeFiles()
    
    // 显示验证错误（如果有）
    if (errors.length > 0) {
      console.warn('⚠️  设计令牌验证警告:')
      errors.forEach(error => console.warn(`   - ${error}`))
      console.warn('')
    }
    
    // 写入文件
    fs.writeFileSync(LIGHT_CSS_PATH, light, 'utf8')
    fs.writeFileSync(DARK_CSS_PATH, dark, 'utf8')
    
    console.log('✅ 主题文件生成成功!')
    console.log(`   📄 ${path.relative(process.cwd(), LIGHT_CSS_PATH)}`)
    console.log(`   📄 ${path.relative(process.cwd(), DARK_CSS_PATH)}`)
    
    // 统计信息
    const lightTokenCount = (light.match(/--color-/g) || []).length
    const darkTokenCount = (dark.match(/--color-/g) || []).length
    
    console.log('')
    console.log('📊 统计信息:')
    console.log(`   🌞 亮色主题令牌数量: ${lightTokenCount}`)
    console.log(`   🌙 暗色主题令牌数量: ${darkTokenCount}`)
    console.log(`   📦 文件大小: ${(fs.statSync(LIGHT_CSS_PATH).size / 1024).toFixed(1)}KB + ${(fs.statSync(DARK_CSS_PATH).size / 1024).toFixed(1)}KB`)
    
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