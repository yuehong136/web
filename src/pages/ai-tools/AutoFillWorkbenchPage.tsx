import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DetailTemplate } from '@/components/page-templates'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import FileUpload, { type ProcessedFile } from './ref/FileUpload'
import DataInput from './ref/DataInput'
import ResultDownload from './ref/ResultDownload'
import { FilledDocxPreview } from './ref/filled-docx-preview'
import { AutoFillSteps, type AutoFillStep } from './auto-fill-steps'

const StepHeading = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="mb-space-lg flex flex-col gap-space-2xs">
    <h2 className="text-base font-semibold text-text-primary">{title}</h2>
    <p className="text-sm text-text-secondary">{description}</p>
  </div>
)

/**
 * Auto-fill: upload a .docx with placeholders, fill them (by hand or AI) next
 * to a live preview, then download. The title and step bar sit in the card
 * header; each step is one column without nested cards.
 */
const AutoFillWorkbenchPage: React.FC = () => {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState<AutoFillStep>(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedFile | null>(null)
  const [filledFileData, setFilledFileData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <DetailTemplate
      title={t('aiTools.autoFill.title')}
      actions={<AutoFillSteps current={currentStep} />}
      bodyScroll="none"
    >
      {currentStep === 2 ? (
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize="50%" minSize="30%">
            <div className="scroll-area h-full overflow-auto px-space-lg py-space-lg">
              <div className="mx-auto max-w-2xl">
                <StepHeading
                  title={t('aiTools.autoFill.fill.heading')}
                  description={t('aiTools.autoFill.fill.description')}
                />
                {processedData ? (
                  <DataInput
                    placeholders={processedData.placeholders}
                    processedFile={processedData.file}
                    originalFileName={uploadedFile?.name}
                    onDataFilled={(file) => {
                      setFilledFileData(file)
                      setCurrentStep(3)
                    }}
                    onBackToUpload={() => setCurrentStep(1)}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                ) : null}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%" minSize="30%">
            <FilledDocxPreview
              fileData={processedData?.file || null}
              className="border-l border-border-subtle"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="scroll-area h-full overflow-auto">
          <div className="mx-auto max-w-2xl px-space-lg py-space-xl">
            {currentStep === 1 ? (
              <>
                <StepHeading
                  title={t('aiTools.autoFill.upload.heading')}
                  description={t('aiTools.autoFill.upload.description')}
                />
                <FileUpload
                  onFileUploaded={setUploadedFile}
                  onFileProcessed={(data) => {
                    setProcessedData(data)
                    setCurrentStep(2)
                  }}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </>
            ) : filledFileData ? (
              <ResultDownload
                fileData={filledFileData}
                onReset={() => {
                  setCurrentStep(1)
                  setUploadedFile(null)
                  setProcessedData(null)
                  setFilledFileData(null)
                }}
                originalFileName={uploadedFile?.name || 'document.docx'}
                onBackToFill={() => setCurrentStep(2)}
              />
            ) : null}
          </div>
        </div>
      )}
    </DetailTemplate>
  )
}

export default AutoFillWorkbenchPage
