import React, { useState } from 'react'
import FileUpload, { type ProcessedFile } from './ref/FileUpload'
import DataInput from './ref/DataInput'
import ResultDownload from './ref/ResultDownload'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/vendor/ui/card'
import { Progress } from '@/components/vendor/ui/progress'
import { Badge } from '@/components/vendor/ui/badge'
import { FileText, Database, Download, Info, ChevronRight } from 'lucide-react'

const AutoFillWorkbenchPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedFile | null>(null)
  const [filledFileData, setFilledFileData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const steps = [
    { id: 1, title: '上传文档', description: '上传包含表格的Word文档', icon: FileText },
    { id: 2, title: '填写数据', description: '提供占位符对应的数据', icon: Database },
    { id: 3, title: '下载结果', description: '下载填充完成的文档', icon: Download }
  ]
  
  const currentStepData = steps.find(step => step.id === currentStep)
  const progressValue = (currentStep - 1) * 50

  return (
    <div className="autofill-page p-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
        <span className="hover:text-foreground cursor-default">工具箱</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">自动填表工作台</span>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">自动填表助手</h1>
        <p className="text-muted-foreground mt-1">
          上传Word表格文档，自动识别占位符并快速填充数据，让文档处理变得简单高效
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((stepItem, index) => {
            const Icon = stepItem.icon
            const isActive = stepItem.id === currentStep
            const isCompleted = stepItem.id < currentStep
            
            return (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isActive 
                      ? 'border-primary text-primary bg-background' 
                      : 'border-muted-foreground/30 text-muted-foreground bg-background'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 flex-1">
                  <p className={`font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {stepItem.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{stepItem.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className={`h-0.5 transition-colors ${
                      stepItem.id < currentStep ? 'bg-primary' : 'bg-border'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <Progress 
          value={progressValue} 
          className="h-1"
        />
      </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {currentStepData && <currentStepData.icon className="w-6 h-6 text-primary" />}
              <CardTitle>{currentStepData?.title}</CardTitle>
              <Badge variant="secondary">{currentStep}/3</Badge>
            </div>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-6">
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
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>支持 .docx 格式的Word文档 • 自动识别表格占位符 • 安全可靠的本地处理</p>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
          <div className="flex items-center gap-2 text-foreground">
            <Info className="w-4 h-4 text-primary" />
            <span className="font-medium">演示模式</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            当前为前端演示版本，使用模拟数据展示功能流程。实际部署时需要连接后端API服务。
          </p>
        </div>
    </div>
  )
}

export default AutoFillWorkbenchPage


