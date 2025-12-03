import React, { useMemo } from 'react'
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser'
import SvgIcon from '@/components/ui/svg-icon'
import { Card } from '@/components/ui/card'
import { FileText, Lightbulb, Image } from 'lucide-react'

// 图片映射配置
const getImageName = (prefix: string, length: number) =>
  new Array(length)
    .fill(0)
    .map((_, idx) => `chunk-method/${prefix}-0${idx + 1}`)

export const ImageMap: Record<string, string[]> = {
  book: getImageName('book', 4),
  laws: getImageName('law', 2),
  manual: getImageName('manual', 4),
  picture: getImageName('media', 2),
  naive: getImageName('naive', 2),
  paper: getImageName('paper', 2),
  presentation: getImageName('presentation', 2),
  qa: getImageName('qa', 2),
  resume: getImageName('resume', 2),
  table: getImageName('table', 2),
  one: getImageName('one', 4),
  knowledge_graph: getImageName('knowledge-graph', 2),
  audio: getImageName('media', 2), // 使用媒体图标
  email: getImageName('naive', 2), // 使用通用图标
  tag: getImageName('tag', 2),
};

interface ParserVisualizationPanelProps {
  selectedParser: DocumentParserType | string | null;
}

const ParserVisualizationPanel: React.FC<ParserVisualizationPanelProps> = ({ 
  selectedParser 
}) => {
  const parserInfo = useMemo(() => {
    if (!selectedParser || typeof selectedParser !== 'string') {
      return null;
    }

    const parserType = selectedParser as DocumentParserType;
    return {
      title: DOCUMENT_PARSER_TYPE_LABELS[parserType] || '未知解析器',
      description: DOCUMENT_PARSER_TYPE_DESCRIPTIONS[parserType] || '暂无描述',
      images: ImageMap[selectedParser] || []
    };
  }, [selectedParser]);

  if (!parserInfo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-background-subtle rounded-2xl flex items-center justify-center mb-5">
          <FileText className="w-12 h-12 text-text-tertiary" />
        </div>
        <h3 className="text-base font-medium text-text-primary mb-2">选择解析器类型</h3>
        <p className="text-sm text-text-tertiary max-w-xs">
          请在左侧选择一种解析器类型，我们将展示相应的说明和示例
        </p>
      </div>
    )
  }

  const detailedInfo = getParserDetailedDescription(selectedParser as DocumentParserType)

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* 头部信息 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary mb-1.5">
              {parserInfo.title}
            </h2>
            <div className="text-sm text-text-secondary">
              <span className="font-medium">支持格式：</span>
              <span className="text-primary">{detailedInfo.supportedFormats}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 分块方法说明 */}
      <div className="p-6 border-b border-border">
        <h3 className="text-base font-medium text-text-primary mb-3">分块方法说明</h3>
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {detailedInfo.description}
        </div>
      </div>

      {/* 使用示例 */}
      {parserInfo.images.length > 0 && (
        <div className="p-6">
          <h3 className="text-base font-medium text-text-primary mb-3 flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            使用示例
          </h3>
          <p className="text-sm text-text-tertiary mb-4">
            为帮助您更好地理解，我们提供了相关截图供您参考。
          </p>
          
          <div className="grid gap-4 grid-cols-1">
            {parserInfo.images.map((imageName, index) => (
              <Card key={index} className="p-3 bg-background-subtle border-border/50 hover:border-border transition-colors">
                <div className="aspect-[4/3] bg-background rounded-lg overflow-hidden mb-2">
                  <SvgIcon
                    name={imageName}
                    width="100%"
                    height="100%"
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-text-tertiary text-center">
                  示例 {index + 1}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 获取解析器详细说明信息
function getParserDetailedDescription(parserType: DocumentParserType): { description: string; supportedFormats: string } {
  const descriptions: Record<DocumentParserType, { description: string; supportedFormats: string }> = {
    [DocumentParserType.Naive]: {
      description: `此方法将简单的方法应用于块文件：

系统将使用视觉检测模型将连续文本分割成多个片段。接下来，这些连续的片段被合并成Token数不超过"Token数"的块。`,
      supportedFormats: 'MD、MDX、DOCX、XLSX、XLS、PPT、PDF、TXT、JPEG、JPG、PNG、TIF、GIF、CSV、JSON、EML、HTML'
    },
    [DocumentParserType.Qa]: {
      description: `此块方法支持 excel 和 csv/txt 文件格式。

如果文件是 excel 格式，则应由两个列组成没有标题：一个提出问题，另一个用于答案，答案列之前的问题列。多张纸是只要列正确结构，就可以接受。

如果文件是 csv/txt 格式以 UTF-8 编码且用 TAB 作分开问题和答案的定界符。

未能遵循上述规则的文本行将被忽略，并且每个问答对将被认为是一个独特的部分。`,
      supportedFormats: 'Excel、CSV、TXT'
    },
    [DocumentParserType.Resume]: {
      description: `简历有多种格式，就像一个人的个性一样，但我们经常必须将它们组织成结构化数据，以便于搜索。

我们不是将简历分块，而是将简历解析为结构化数据。作为HR，你可以扔掉所有的简历，您只需与'RAGFlow'交谈即可列出所有符合资格的候选人。`,
      supportedFormats: 'DOCX、PDF、TXT'
    },
    [DocumentParserType.Manual]: {
      description: `我们假设手册具有分层部分结构。我们使用最低的部分标题作为对文档进行切片的枢轴。因此，同一部分中的图和表不会被分割，并且块大小可能会很大。`,
      supportedFormats: 'PDF'
    },
    [DocumentParserType.Table]: {
      description: `以下是一些提示：

• 对于 csv 或 txt 文件，列之间的分隔符为 TAB
• 第一行必须是列标题
• 列标题必须是有意义的术语，以便我们的大语言模型能够理解
• 列举一些同义词时最好使用斜杠'/'来分隔，甚至更好使用方括号枚举值

表中的每一行都将被视为一个块。`,
      supportedFormats: 'XLSX、CSV、TXT'
    },
    [DocumentParserType.Paper]: {
      description: `如果我们的模型运行良好，论文将按其部分进行切片，例如摘要、1.1、1.2等。

这样做的好处是LLM可以更好的概括论文中相关章节的内容，产生更全面的答案，帮助读者更好地理解论文。缺点是它增加了 LLM 对话的背景并增加了计算成本，所以在对话过程中，你可以考虑减少'topN'的设置。`,
      supportedFormats: 'PDF'
    },
    [DocumentParserType.Book]: {
      description: `由于一本书很长，并不是所有部分都有用，如果是 PDF，请为每本书设置页面范围，以消除负面影响并节省分析计算时间。`,
      supportedFormats: 'DOCX、PDF、TXT'
    },
    [DocumentParserType.Laws]: {
      description: `法律文件有非常严格的书写格式。我们使用文本特征来检测分割点。

chunk的粒度与'ARTICLE'一致，所有上层文本都会包含在chunk中。`,
      supportedFormats: 'DOCX、PDF、TXT'
    },
    [DocumentParserType.Presentation]: {
      description: `每个页面都将被视为一个块。并且每个页面的缩略图都会被存储。

您上传的所有PPT文件都会使用此方法自动分块，无需为每个PPT文件进行设置。`,
      supportedFormats: 'PDF、PPTX'
    },
    [DocumentParserType.Picture]: {
      description: `图像文档处理，结合OCR技术提取图片中的文本信息。适合处理包含大量图片和图表的文档。`,
      supportedFormats: 'JPEG、JPG、PNG、TIF、GIF、PDF'
    },
    [DocumentParserType.One]: {
      description: `对于一个文档，它将被视为一个完整的块，根本不会被分割。

如果你要总结的东西需要一篇文章的全部上下文，并且所选LLM的上下文长度覆盖了文档长度，你可以尝试这种方法。`,
      supportedFormats: 'DOCX、EXCEL、PDF、TXT'
    },
    [DocumentParserType.Audio]: {
      description: `音频内容处理，支持语音转文本和语音分析。适合处理录音、播客等音频内容。`,
      supportedFormats: 'MP3、WAV、M4A、FLAC'
    },
    [DocumentParserType.Email]: {
      description: `邮件格式专用，能够识别发件人、收件人、主题等邮件结构。适合处理邮件归档和分析。`,
      supportedFormats: 'EML、MSG、MBOX'
    },
    [DocumentParserType.Tag]: {
      description: `使用"Tag"分块方法的知识库用作标签集。其他知识库可以把标签集当中的标签按照相似度匹配到自己对应的文本块中，对这些知识库的查询也将根据此标签集对自己进行标记。

标签集不会直接参与 RAG 检索过程。

标签集中的每个文本分块是都是相互独立的标签和标签描述的文本对。

如果文件为XLSX格式，则它应该包含两列无标题：一列用于标签描述，另一列用于标签，标签描述列位于标签列之前。

如果文件为 CSV/TXT 格式，则必须使用 UTF-8 编码并以 TAB 作为分隔符来分隔内容和标签。

在标签列中，标签之间使用英文逗号分隔。`,
      supportedFormats: 'XLSX、CSV、TXT'
    },
    [DocumentParserType.KnowledgeGraph]: {
      description: `知识图谱构建，提取实体关系构建结构化知识网络。通过实体识别和关系抽取技术，将文档转换为结构化的知识图谱。`,
      supportedFormats: 'PDF、DOCX、TXT'
    },
  };
  
  return descriptions[parserType] || { description: '请配置相应的解析参数以获得最佳效果。', supportedFormats: '多种格式' };
}

export default ParserVisualizationPanel