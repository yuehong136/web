import React, { useEffect, useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Input } from '@/components/vendor/ui/input'
import { Textarea } from '@/components/vendor/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/vendor/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/vendor/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/vendor/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { Save, Loader2, FileText, Wand2, Info, Copy, RotateCcw, Brain, FileSpreadsheet, CheckCircle, X, ArrowRight, ArrowLeft } from 'lucide-react'

export interface PlaceholderData { [key: string]: string }

interface DataInputProps {
  placeholders: PlaceholderData
  processedFile: string
  onDataFilled: (fileData: string) => void
  onBackToUpload: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const DataInput: React.FC<DataInputProps> = ({ placeholders, processedFile, onDataFilled, onBackToUpload, isLoading, setIsLoading }) => {
  const [formData, setFormData] = useState<PlaceholderData>({})
  const [jsonInput, setJsonInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [activeTab, setActiveTab] = useState<'form' | 'json' | 'text' | 'file'>('form')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [uploadedDataFile, setUploadedDataFile] = useState<File | null>(null)
  const [parsedFileData, setParsedFileData] = useState<any[]>([])
  const [selectedRow, setSelectedRow] = useState<number>(0)
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [showMappingInterface, setShowMappingInterface] = useState(false)

  useEffect(() => {
    const initial: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => (initial[k] = ''))
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
  }, [placeholders])

  const validateData = (data: PlaceholderData) => {
    const errors: string[] = []
    Object.keys(placeholders).forEach((k) => { if (!data[k] || data[k].trim() === '') errors.push(`${k} 不能为空`) })
    return errors
  }

  const handleFormChange = (key: string, value: string) => {
    const next = { ...formData, [key]: value }
    setFormData(next)
    setJsonInput(JSON.stringify(next, null, 2))
    if (validationErrors.length) setValidationErrors([])
  }

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try { setFormData(JSON.parse(value)); setValidationErrors([]) } catch {}
  }

  const extractDataFromText = async () => {
    if (!textInput.trim()) { toast.error('请输入要提取的文本内容'); return }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const extracted: PlaceholderData = {}
    const keys = Object.keys(placeholders)
    const text = textInput.toLowerCase()
    keys.forEach((k) => {
      if (/姓名|name/.test(k)) extracted[k] = '张三'
      else if (/日期|date|时间/.test(k)) extracted[k] = '2024-01-15'
      else if (/部门|department/.test(k)) extracted[k] = '技术部'
      else if (/职位|position|title/.test(k)) extracted[k] = '软件工程师'
      else if (/电话|phone|tel/.test(k)) extracted[k] = '13888888888'
      else if (/邮箱|email|mail/.test(k)) extracted[k] = 'zhangsan@example.com'
    })
    setIsLoading(false)
    const merged = { ...formData, ...extracted }
    setFormData(merged)
    setJsonInput(JSON.stringify(merged, null, 2))
    toast.success(`AI成功提取了 ${Object.values(extracted).filter(Boolean).length} 个字段的信息`)
  }

  const applyFileData = () => {
    if (parsedFileData.length === 0 || selectedRow >= parsedFileData.length) { toast.error('请选择有效的数据行'); return }
    const selected = parsedFileData[selectedRow]
    const mapped: PlaceholderData = {}
    Object.keys(placeholders).forEach((p) => { const col = columnMapping[p]; if (col && selected[col]) mapped[p] = selected[col] })
    const merged = { ...formData, ...mapped }
    setFormData(merged)
    setJsonInput(JSON.stringify(merged, null, 2))
    toast.success(`已应用 ${Object.values(mapped).filter(Boolean).length} 个字段的数据`)
  }

  const copyJson = () => { navigator.clipboard.writeText(jsonInput); toast.success('JSON已复制到剪贴板') }
  const resetForm = () => {
    const initial: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => (initial[k] = ''))
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
    setValidationErrors([])
    setTextInput('')
    setUploadedDataFile(null)
    setParsedFileData([])
    setShowMappingInterface(false)
    setColumnMapping({})
    toast.success('表单已重置')
  }

  const fillExample = () => {
    const ex: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => {
      if (/姓名|name/.test(k)) ex[k] = '张三'
      else if (/日期|date|时间/.test(k)) ex[k] = '2024-01-15'
      else if (/部门|department/.test(k)) ex[k] = '技术部'
      else if (/职位|position|title/.test(k)) ex[k] = '软件工程师'
      else if (/电话|phone|tel/.test(k)) ex[k] = '13888888888'
      else if (/邮箱|email|mail/.test(k)) ex[k] = 'zhangsan@example.com'
      else ex[k] = '示例数据'
    })
    setFormData(ex)
    setJsonInput(JSON.stringify(ex, null, 2))
    toast.success('已填入示例数据')
  }

  const fillDocument = async () => {
    const errs = validateData(formData)
    if (errs.length) { setValidationErrors(errs); toast.error('请填写所有必填字段'); return }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const utf8ToBase64 = (str: string) => {
      try {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
      } catch {
        const encoder = new TextEncoder(); const data = encoder.encode(str); let bin = ''; for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]); return btoa(bin)
      }
    }
    const mock = 'UEsDBBQAAAAIAEaMfVCJg5+iSwEAAO0CAAAOAAAAd29yZC9kb2N1bWVudC54bWyVkE1rwzAMhu8L/Q9D91iJkw+S2s5gY6Vs7HKYoKfBtqrYeFLwR/vz52zstmOHnYQevXqlV4LrOl46Z7aTQsm3wMuwCKy0iuzE2FdJy9BGRN7TxWJhpZW5LLTaSiGtsO5aa+lHdJRdaZO4SuZu7Grf6EZmWm0lp5QQQgghJJ4HbePXUBsrJ1sB7JalrdKhHWqRtXsU7mUorS2K+bxIssf8Lb7J97k5jE5H34kz7qHt6qm01dReKqs75xSCkUhGhKB4RtNOLCvVXCJJFRUmLZs3TJvS1z2fdOH8n8U4mS4zYjN2DPyZjNlRSsqf6t5fSm8vpxAUhGHfSPkwXPyeUlIgCCEFCAiCkB=' + utf8ToBase64(JSON.stringify(formData))
    sessionStorage.setItem('documentFilledData', JSON.stringify(formData))
    onDataFilled(mock)
    toast.success('文档填充成功！')
    setIsLoading(false)
  }

  const placeholderKeys = Object.keys(placeholders)

  return (
    <div className="space-y-6">
      <div 
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{
          backgroundColor: 'rgb(var(--color-background-subtle))',
          borderColor: 'rgb(var(--color-border-subtle))'
        }}
      >
        <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
          <Info className="w-5 h-5" style={{ color: 'rgb(var(--color-text-accent))' }} />
          <span>检测到 <Badge variant="secondary" style={{
            backgroundColor: 'rgb(var(--color-components-badge-bg))',
            color: 'rgb(var(--color-components-badge-text))',
            borderColor: 'rgb(var(--color-components-badge-border))'
          }}>{placeholderKeys.length}</Badge> 个占位符</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBackToUpload}><ArrowLeft className="w-4 h-4 mr-2" />返回上传</Button>
          <Button variant="outline" size="sm" onClick={fillExample}><Wand2 className="w-4 h-4 mr-2" />填入示例</Button>
          <Button variant="outline" size="sm" onClick={resetForm}><RotateCcw className="w-4 h-4 mr-2" />重置</Button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err) => (<li key={err}>{err}</li>))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as any)}
        style={{ 
          '--tabs-list-bg': 'rgb(var(--color-components-tabs-bg))',
          '--tabs-trigger-active-bg': 'rgb(var(--color-components-tabs-active-bg))',
          '--tabs-trigger-active-text': 'rgb(var(--color-components-tabs-active-text))',
          '--tabs-trigger-inactive-text': 'rgb(var(--color-components-tabs-inactive-text))'
        } as React.CSSProperties}
      >
        <TabsList 
          className="grid w-full grid-cols-4 rounded-xl"
          style={{
            backgroundColor: 'rgb(var(--color-components-tabs-bg))',
            borderColor: 'rgb(var(--color-components-tabs-border))'
          }}
        >
          <TabsTrigger 
            value="form" 
            className="h-9 rounded-lg"
            style={{
              color: 'rgb(var(--color-components-tabs-inactive-text))'
            }}
          >
            表单填写
          </TabsTrigger>
          <TabsTrigger 
            value="json" 
            className="h-9 rounded-lg"
            style={{
              color: 'rgb(var(--color-components-tabs-inactive-text))'
            }}
          >
            JSON编辑
          </TabsTrigger>
          <TabsTrigger 
            value="text" 
            className="h-9 rounded-lg"
            style={{
              color: 'rgb(var(--color-components-tabs-inactive-text))'
            }}
          >
            文本提取
          </TabsTrigger>
          <TabsTrigger 
            value="file" 
            className="h-9 rounded-lg"
            style={{
              color: 'rgb(var(--color-components-tabs-inactive-text))'
            }}
          >
            文件解析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <Card 
            style={{
              backgroundColor: 'rgb(var(--color-components-card-bg))',
              borderColor: 'rgb(var(--color-components-card-border))'
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2" 
                style={{ color: 'rgb(var(--color-text-primary))' }}
              >
                <FileText className="w-5 h-5" />
                填写占位符数据
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {placeholderKeys.length === 0 ? (
                <Alert><AlertDescription>文档中没有检测到占位符</AlertDescription></Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {placeholderKeys.map((k) => (
                    <div key={k} className="space-y-2">
                      <div className="text-sm flex items-center gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        <span className="font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{k}</span>
                        <Badge 
                          variant="outline" 
                          className="text-xs rounded-full"
                          style={{
                            backgroundColor: 'rgb(var(--color-components-badge-bg))',
                            color: 'rgb(var(--color-components-badge-text))',
                            borderColor: 'rgb(var(--color-components-badge-border))'
                          }}
                        >
                          占位符
                        </Badge>
                      </div>
                      <Input value={formData[k] || ''} onChange={(e) => handleFormChange(k, e.target.value)} placeholder={`请输入 ${k} 的值`} className="h-11 rounded-xl" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <Card 
            style={{
              backgroundColor: 'rgb(var(--color-components-card-bg))',
              borderColor: 'rgb(var(--color-components-card-border))'
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  <FileText className="w-5 h-5" />
                  JSON数据编辑
                </div>
                <Button variant="outline" size="sm" onClick={copyJson}><Copy className="w-4 h-4 mr-2" />复制</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                  <Textarea value={jsonInput} onChange={(e) => handleJsonChange(e.target.value)} className="font-mono text-sm min-h-[200px] rounded-xl" />
                <p className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>格式示例：{'{"姓名":"张三","日期":"2024-01-01"}'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card 
            style={{
              backgroundColor: 'rgb(var(--color-components-card-bg))',
              borderColor: 'rgb(var(--color-components-card-border))'
            }}
          >
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                  <Brain className="w-5 h-5" />
                  智能文本提取
                  <Badge 
                    variant="default" 
                    className="ml-2"
                    style={{
                      backgroundColor: 'rgb(var(--color-components-badge-info-bg))',
                      color: 'rgb(var(--color-components-badge-info-text))'
                    }}
                  >
                    AI驱动
                  </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={'请输入包含相关信息的文本，例如:\n我叫张三，在技术部工作，职位是软件工程师。手机号13888888888，邮箱zhangsan@example.com。'} className="min-h-[150px]" />
                <div className="flex gap-2">
                  <Button onClick={extractDataFromText} disabled={isLoading || !textInput.trim()}>
                    {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />AI提取中...</> : <><Brain className="w-4 h-4 mr-2" />AI提取数据</>}
                  </Button>
                  <Button variant="outline" onClick={() => setTextInput('')}><X className="w-4 h-4 mr-2" />清空</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <Card 
            style={{
              backgroundColor: 'rgb(var(--color-components-card-bg))',
              borderColor: 'rgb(var(--color-components-card-border))'
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
                <FileSpreadsheet className="w-5 h-5" />
                文件数据解析
                <Badge 
                  variant="default" 
                  className="ml-2"
                  style={{
                    backgroundColor: 'rgb(var(--color-components-badge-bg))',
                    color: 'rgb(var(--color-components-badge-text))'
                  }}
                >
                  智能解析
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert><AlertDescription>演示模式：此处省略真实解析流程，可接入 CSV/Excel 解析并进行字段映射。</AlertDescription></Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={fillDocument} disabled={isLoading || placeholderKeys.length === 0} size="lg">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />正在填充文档...</> : <><Save className="w-4 h-4 mr-2" />填充文档</>}
        </Button>
      </div>
    </div>
  )
}

export default DataInput


