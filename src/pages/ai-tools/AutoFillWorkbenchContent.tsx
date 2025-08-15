import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/lib/toast'
import {
  FileText, Database, Download as DownloadIcon, Info, Upload, Loader2, CheckCircle,
  Wand2, X, ArrowLeft, ZoomIn, ZoomOut, RotateCw
} from 'lucide-react'

type PlaceholderMap = Record<string, string>

const DEFAULT_PLACEHOLDERS: PlaceholderMap = {
  '姓名': '',
  '日期': '',
  '部门': '',
  '职位': '',
  '联系电话': '',
  '邮箱地址': '',
  '工作内容': '',
  '备注': '',
}

const MOCK_PROCESSED_FILE = 'UEsDBBQAAAAIAEaMfVCJg5+iSwEAAO0CAAAOAAAAd29yZC9kb2N1bWVudC54bWyVkE1rwzAMhu8L/Q9D91iJkw+S2s5gY6Vs7HKYoKfBtqrYeFLwR/vz52zstmOHnYQevXqlV4LrOl46Z7aTQsm3wMuwCKy0iuzE2FdJy9BGRN7TxWJhpZW5LLTaSiGtsO5aa+lHdJRdaZO4SuZu7Grf6EZmWm0lp5QQQgghJJ4HbePXUBsrJ1sB7JalrdKhHWqRtXsU7mUorS2K+bxIssf8Lb7J97k5jE5H34kz7qHt6qm01dReKqs75xSCkUhGhKB4RtNOLCvVXCJJFRUmLZs3TJvS1z2fdOH8n8U4mS4zYjN2DPyZjNlRSsqf6t5fSm8vpxAUhGHfSPkwXPyeUlIgCCEFCAiCkB=='

const base64FromString = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    let binary = ''
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i])
    return btoa(binary)
  }
}

const downloadBase64Docx = (base64: string, filename: string) => {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const AutoFillWorkbenchContent: React.FC = () => {
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null)
  const [placeholders, setPlaceholders] = React.useState<PlaceholderMap>({})
  const [formData, setFormData] = React.useState<PlaceholderMap>({})
  const [jsonInput, setJsonInput] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'form' | 'json' | 'text'>('form')
  const [textInput, setTextInput] = React.useState('')
  const [filledFile, setFilledFile] = React.useState<string>('')
  const [showPreview, setShowPreview] = React.useState(false)
  const [zoom, setZoom] = React.useState(100)

  const steps = [
    { id: 1, title: '上传文档', desc: '上传包含表格的Word文档', icon: FileText },
    { id: 2, title: '填写数据', desc: '提供占位符对应的数据', icon: Database },
    { id: 3, title: '下载结果', desc: '下载填充完成的文档', icon: DownloadIcon },
  ] as const

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file)
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const initial = { ...DEFAULT_PLACEHOLDERS }
    setPlaceholders(initial)
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
    setIsLoading(false)
    setStep(2)
    toast.success('文档处理成功（演示数据）')
  }

  const handleAIExtract = async () => {
    if (!textInput.trim()) {
      toast.warning('请输入要提取的文本')
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const draft: PlaceholderMap = { ...formData }
    Object.keys(placeholders).forEach((key) => {
      if ((/姓名|name/).test(key)) draft[key] = '张三'
      else if ((/日期|date|时间/).test(key)) draft[key] = '2024-01-15'
      else if ((/部门|department/).test(key)) draft[key] = '技术部'
      else if ((/职位|position|title/).test(key)) draft[key] = '软件工程师'
      else if ((/电话|phone|tel/).test(key)) draft[key] = '13888888888'
      else if ((/邮箱|email|mail/).test(key)) draft[key] = 'zhangsan@example.com'
      else if ((/工作|work|job/).test(key)) draft[key] = '负责前端开发，参与需求与设计'
      else if ((/备注|note|remark/).test(key)) draft[key] = '演示数据'
    })
    setFormData(draft)
    setJsonInput(JSON.stringify(draft, null, 2))
    setIsLoading(false)
    toast.success('AI 提取完成（演示）')
  }

  const handleFill = async () => {
    const empty = Object.entries(formData).filter(([_, v]) => !v || !String(v).trim())
    if (empty.length > 0) {
      toast.error('请填写所有必填字段')
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const payload = base64FromString(JSON.stringify(formData))
    setFilledFile(MOCK_PROCESSED_FILE + payload)
    setIsLoading(false)
    setStep(3)
    toast.success('文档填充成功（演示数据）')
  }

  const handleDownload = () => {
    const name = (uploadedFile?.name || 'document.docx').replace(/\.docx$/i, '')
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    downloadBase64Docx(filledFile, `${name}_填充完成_${ts}.docx`)
  }

  const handleReset = () => {
    setStep(1)
    setUploadedFile(null)
    setPlaceholders({})
    setFormData({})
    setJsonInput('')
    setTextInput('')
    setFilledFile('')
  }

  const placeholderKeys = Object.keys(placeholders)

  return (
    <div>
      {/* 步骤指示 */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = step === (idx + 1)
            const isDone = step > (idx + 1)
            return (
              <div key={s.id} className="flex items-center gap-3 min-w-0">
                <div className={
                  isDone
                    ? 'w-10 h-10 rounded-full bg-success-500 text-white flex items-center justify-center'
                    : isActive
                    ? 'w-10 h-10 rounded-full border-2 border-text-accent text-text-accent bg-background'
                    : 'w-10 h-10 rounded-full border border-border-subtle text-text-secondary bg-background'
                }>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>{s.title}</div>
                  <div className="text-xs text-text-tertiary truncate">{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4">
          <Progress value={(step - 1) * 50} />
        </div>
      </div>

      {/* 主体卡片 */}
      <Card className="border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {(() => {
              const s = steps[step - 1]
              const Icon = s.icon
              return <Icon className="w-6 h-6 text-text-accent" />
            })()}
            <CardTitle>{steps[step - 1].title}</CardTitle>
            <Badge variant="secondary">{step}/3</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          {step === 1 && (
            <div className="space-y-4">
              <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${isLoading ? 'opacity-60 pointer-events-none' : ''} ${uploadedFile ? 'border-success-500 bg-success-50/40' : 'border-border-subtle hover:border-border-default'}`}>
                <div className="flex flex-col items-center gap-4">
                  {isLoading ? (
                    <Loader2 className="w-10 h-10 text-text-accent animate-spin" />
                  ) : uploadedFile ? (
                    <FileText className="w-10 h-10 text-success-600" />
                  ) : (
                    <Upload className="w-10 h-10 text-text-tertiary" />
                  )}

                  <div>
                    {isLoading ? (
                      <>
                        <h3 className="mb-2">正在处理文档...</h3>
                        <p className="text-text-secondary">请稍候，系统正在分析文档中的占位符</p>
                      </>
                    ) : uploadedFile ? (
                      <>
                        <h3 className="mb-2 text-success-700">文件已选择</h3>
                        <p className="text-text-secondary">{uploadedFile.name}</p>
                        <p className="text-sm text-text-tertiary mt-1">大小：{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <h3 className="mb-2">点击下方按钮选择文件</h3>
                        <p className="text-text-secondary">支持 .docx 格式，最大 10MB</p>
                      </>
                    )}
                  </div>

                  <div>
                    <input
                      id="file-input"
                      className="hidden"
                      type="file"
                      accept=".docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(f)
                      }}
                    />
                    {!isLoading && (
                      <Button variant="outline" onClick={() => document.getElementById('file-input')?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> 选择文件
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-components-card-bg border border-components-card-border">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-text-accent mt-0.5" />
                  <div className="text-sm text-text-secondary">
                    当前页面为前端静态演示：使用模拟数据展示占位符识别与填充流程，未接入真实后端。
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-secondary">检测到 <Badge variant="secondary">{placeholderKeys.length}</Badge> 个占位符</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> 返回上传
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const ex: PlaceholderMap = {}
                    Object.keys(placeholders).forEach((k) => {
                      if (/姓名|name/.test(k)) ex[k] = '张三'
                      else if (/日期|date|时间/.test(k)) ex[k] = '2024-01-15'
                      else if (/部门|department/.test(k)) ex[k] = '技术部'
                      else if (/职位|position|title/.test(k)) ex[k] = '软件工程师'
                      else if (/电话|phone|tel/.test(k)) ex[k] = '13888888888'
                      else if (/邮箱|email|mail/.test(k)) ex[k] = 'zhangsan@example.com'
                      else if (/工作|work|job/.test(k)) ex[k] = '负责前端开发，参与需求与设计'
                      else ex[k] = '示例数据'
                    })
                    setFormData(ex)
                    setJsonInput(JSON.stringify(ex, null, 2))
                    toast.success('已填入示例数据')
                  }}>
                    <Wand2 className="w-4 h-4 mr-1" /> 填入示例
                  </Button>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="form">表单填写</TabsTrigger>
                  <TabsTrigger value="json">JSON编辑</TabsTrigger>
                  <TabsTrigger value="text">文本提取</TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="mt-4">
                  {placeholderKeys.length === 0 ? (
                    <div className="p-4 rounded-lg border border-border-subtle text-sm text-text-secondary">未检测到占位符</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {placeholderKeys.map((key) => (
                        <div key={key} className="space-y-2">
                          <div className="text-sm text-text-secondary flex items-center gap-2">
                            <span className="text-text-primary font-medium">{key}</span>
                            <Badge variant="outline" className="text-xs">占位符</Badge>
                          </div>
                          <Input
                            value={formData[key] || ''}
                            placeholder={`请输入 ${key} 的值`}
                            onChange={(e) => {
                              const v = e.target.value
                              const next = { ...formData, [key]: v }
                              setFormData(next)
                              setJsonInput(JSON.stringify(next, null, 2))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="json" className="mt-4">
                  <div className="space-y-2">
                    <div className="text-sm text-text-secondary">JSON 数据</div>
                    <Textarea
                      value={jsonInput}
                      onChange={(e) => {
                        setJsonInput(e.target.value)
                        try { setFormData(JSON.parse(e.target.value)) } catch {}
                      }}
                      className="font-mono text-sm min-h-[220px]"
                    />
                    <div className="text-xs text-text-tertiary">格式示例：{'{"姓名":"张三","日期":"2024-01-01"}'}</div>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="mt-4">
                  <div className="space-y-3">
                    <Textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={'请输入包含信息的文本，例如:\n我叫张三，在技术部工作，职位是软件工程师。手机号13888888888，邮箱zhangsan@example.com。'}
                      className="min-h-[150px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={handleAIExtract} disabled={isLoading || !textInput.trim()}>
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />} AI 提取数据
                      </Button>
                      {textInput && (
                        <Button variant="outline" onClick={() => setTextInput('')}>
                          <X className="w-4 h-4 mr-1" /> 清空
                        </Button>
                      )}
                    </div>
                    <div className="p-3 rounded-lg border border-border-subtle text-sm text-text-secondary">
                      提示：支持识别姓名、职位、部门、联系方式等信息，并自动匹配至占位符。
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button onClick={handleFill} disabled={isLoading || placeholderKeys.length === 0}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />} 填充文档
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-success-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> 文档填充完成！
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" /> 文件信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><span className="text-text-secondary">原始文件名</span><span className="font-medium">{uploadedFile?.name || 'document.docx'}</span></div>
                      <div className="flex items-center justify-between"><span className="text-text-secondary">处理状态</span><Badge variant="default">已完成</Badge></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><span className="text-text-secondary">文档类型</span><span className="font-medium">Microsoft Word (.docx)</span></div>
                      <div className="flex items-center justify-between"><span className="text-text-secondary">编码格式</span><span className="font-medium">UTF-8</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                <Button onClick={handleDownload} className="w-full">
                  <DownloadIcon className="w-4 h-4 mr-2" /> 下载文档
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowPreview(true)}>
                  <FileText className="w-4 h-4 mr-2" /> 在线预览
                </Button>
              </div>

              <div className="text-center text-sm text-text-secondary">如需处理更多文档，请点击“处理新文档”。</div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => {
                  setStep(1)
                  setUploadedFile(null)
                  setPlaceholders({})
                  setFormData({})
                  setJsonInput('')
                  setTextInput('')
                  setFilledFile('')
                }}><RotateCw className="w-4 h-4 mr-2" /> 处理新文档</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览 Modal（静态示意） */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="文档预览"
        description="演示预览（示意布局）"
        size="xl"
      >
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 25))}><ZoomOut className="w-4 h-4" /></Button>
          <span className="text-sm w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(200, z + 25))}><ZoomIn className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(100)}><RotateCw className="w-4 h-4 mr-1" />重置</Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}><DownloadIcon className="w-4 h-4 mr-1" />下载</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="overflow-auto bg-components-card-bg border border-components-card-border rounded-lg" style={{ maxHeight: '70vh' }}>
          <div className="mx-auto bg-white" style={{
            transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: '210mm', minHeight: '297mm', padding: '25mm 20mm', lineHeight: 1.5
          }}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">员工信息登记表</h2>
              <p className="text-gray-600 text-sm">Employee Information Registration Form</p>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">基本信息</h3>
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium w-1/4">姓名</td>
                    <td className="border border-gray-400 px-3 py-2 w-1/4">{formData['姓名'] || '{{姓名}}'}</td>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium w-1/4">日期</td>
                    <td className="border border-gray-400 px-3 py-2 w-1/4">{formData['日期'] || '{{日期}}'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium">部门</td>
                    <td className="border border-gray-400 px-3 py-2">{formData['部门'] || '{{部门}}'}</td>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium">职位</td>
                    <td className="border border-gray-400 px-3 py-2">{formData['职位'] || '{{职位}}'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">联系信息</h3>
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium w-1/3">联系电话</td>
                    <td className="border border-gray-400 px-3 py-2 w-2/3">{formData['联系电话'] || '{{联系电话}}'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium">邮箱地址</td>
                    <td className="border border-gray-400 px-3 py-2">{formData['邮箱地址'] || '{{邮箱地址}}'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">工作信息</h3>
              <table className="w-full border-collapse border border-gray-400">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium w-1/4">工作内容</td>
                    <td className="border border-gray-400 px-3 py-2 w-3/4"><div className="min-h-[60px] flex items-start py-1">{formData['工作内容'] || '{{工作内容}}'}</div></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 bg-gray-50 px-3 py-2 font-medium">备注</td>
                    <td className="border border-gray-400 px-3 py-2"><div className="min-h-[60px] flex items-start py-1">{formData['备注'] || '{{备注}}'}</div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AutoFillWorkbenchContent


