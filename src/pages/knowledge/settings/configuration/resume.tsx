'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function ResumeConfiguration() {
  return (
    <MainContainer>
    <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          简历解析器使用专门的结构化解析，无需额外配置。
        </div>
    </ConfigurationFormContainer>
    </MainContainer>
  )
}
