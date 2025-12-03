'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function TableConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          表格解析器使用专门的表格解析，无需额外配置。
        </div>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
