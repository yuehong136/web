import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload, { type ProcessedFile } from './ref/FileUpload'
import DataInput from './ref/DataInput'
import ResultDownload from './ref/ResultDownload'
import { FileText, Database, Download, CheckCircle2, House } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const AutoFillWorkbenchPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedFile | null>(null)
  const [filledFileData, setFilledFileData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const steps = [
    { id: 1, title: '上传文档', icon: FileText },
    { id: 2, title: '填写数据', icon: Database },
    { id: 3, title: '完成下载', icon: Download }
  ]

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/home')}>
                  <House className="w-4 h-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/tools')}>
                  工具箱
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>自动填表</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* 步骤指示器 */}
          <div className="hidden md:flex items-center gap-1">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              
              return (
                <React.Fragment key={step.id}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      isCompleted && 'bg-primary/10 text-primary',
                      isActive && 'bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="hidden lg:inline">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-8 h-0.5 rounded-full transition-colors',
                        step.id < currentStep ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* 页面标题 */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {currentStep === 1 && '上传您的文档'}
              {currentStep === 2 && '填写表单数据'}
              {currentStep === 3 && '下载完成'}
            </h1>
            <p className="text-muted-foreground">
              {currentStep === 1 && '支持 .docx 格式的 Word 文档，系统将自动识别占位符'}
              {currentStep === 2 && '填写或使用 AI 自动生成占位符对应的数据'}
              {currentStep === 3 && '您的文档已填充完成，可以下载使用'}
            </p>
          </div>

          {/* 步骤内容 */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              {currentStep === 1 && (
                <FileUpload
                  onFileUploaded={setUploadedFile}
                  onFileProcessed={(data) => { setProcessedData(data); setCurrentStep(2) }}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}

              {currentStep === 2 && processedData && (
                <DataInput
                  placeholders={processedData.placeholders}
                  processedFile={processedData.file}
                  originalFileName={uploadedFile?.name}
                  onDataFilled={(file) => { setFilledFileData(file); setCurrentStep(3) }}
                  onBackToUpload={() => setCurrentStep(1)}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}

              {currentStep === 3 && filledFileData && (
                <ResultDownload
                  fileData={filledFileData}
                  onReset={() => { setCurrentStep(1); setUploadedFile(null); setProcessedData(null); setFilledFileData(null) }}
                  originalFileName={uploadedFile?.name || 'document.docx'}
                  onBackToFill={() => setCurrentStep(2)}
                />
              )}
            </div>
          </div>

          {/* 底部提示 */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            文档在本地处理，数据安全可靠
          </p>
        </div>
      </main>
    </div>
  )
}

export default AutoFillWorkbenchPage
