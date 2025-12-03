'use client'

import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

export function PictureConfiguration() {
  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <div className="text-sm text-text-tertiary py-4 text-center">
          图片解析器使用 OCR 和视觉理解，无需额外配置。
        </div>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
