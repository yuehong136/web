import React, { useMemo } from 'react';
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser';
import SvgIcon from '@/components/ui/svg-icon';
import { Card } from '@/components/ui/card';

// 图片映射配置
const getImageName = (prefix: string, length: number) =>
  new Array(length)
    .fill(0)
    .map((x, idx) => `chunk-method/${prefix}-0${idx + 1}`);

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
        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">选择解析器类型</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          请在左侧选择一种解析器类型，我们将为您展示相应的配置选项和使用示例
        </p>
      </div>
    );
  }

  const detailedInfo = getParserDetailedDescription(selectedParser as DocumentParserType);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* 头部信息 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {parserInfo.title}
            </h2>
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium text-gray-700">支持格式：</span>
              <span className="text-blue-600">{detailedInfo.supportedFormats}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 分块方法说明 */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-3">分块方法说明</h3>
        <div className="prose prose-sm max-w-none text-gray-600">
          <div className="whitespace-pre-line leading-relaxed">
            {detailedInfo.description}
          </div>
        </div>
      </div>

      {/* 使用示例 */}
      {parserInfo.images.length > 0 && (
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            使用示例
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            为帮助您更好地理解，我们提供了相关截图供您参考。
          </p>
          
          <div className="grid gap-4 grid-cols-1">
            {parserInfo.images.map((imageName, index) => (
              <Card key={index} className="p-3 hover:shadow-md transition-shadow duration-200">
                <div className="aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden mb-2">
                  <SvgIcon
                    name={imageName}
                    width="100%"
                    height="100%"
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  示例 {index + 1}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

// 获取解析器特性
function getParserFeatures(parserType: DocumentParserType): string[] {
  const features: Record<DocumentParserType, string[]> = {
    [DocumentParserType.Naive]: ['智能布局识别', '自动分块', '关键词提取', '多格式支持'],
    [DocumentParserType.Qa]: ['问答对识别', '上下文关联', '语义理解', '快速检索'],
    [DocumentParserType.Resume]: ['个人信息提取', '工作经历分析', '技能识别', '教育背景'],
    [DocumentParserType.Manual]: ['自定义规则', '精确控制', '灵活配置', '专业级处理'],
    [DocumentParserType.Table]: ['表格结构保持', '数据关系识别', '跨表关联', '格式转换'],
    [DocumentParserType.Paper]: ['学术结构识别', '引用分析', '图表处理', '多语言支持'],
    [DocumentParserType.Book]: ['章节自动分割', '目录识别', '页码处理', '长文档优化'],
    [DocumentParserType.Laws]: ['法条识别', '层级结构', '条款关联', '法律术语'],
    [DocumentParserType.Presentation]: ['幻灯片分割', '视觉布局', '动画识别', '多媒体处理'],
    [DocumentParserType.Picture]: ['OCR文字识别', '图像分析', '版面检测', '多语言OCR'],
    [DocumentParserType.One]: ['快速处理', '单页优化', '简洁高效', '即时解析'],
    [DocumentParserType.Audio]: ['语音转文本', '说话人识别', '时间戳', '噪音过滤'],
    [DocumentParserType.Email]: ['邮件头解析', '附件处理', '线程识别', '联系人提取'],
    [DocumentParserType.Tag]: ['智能标签', '分类管理', '相似度计算', '标签推荐'],
    [DocumentParserType.KnowledgeGraph]: ['实体识别', '关系抽取', '图谱构建', '知识推理'],
  };
  
  return features[parserType] || ['高效处理', '智能解析', '准确识别', '稳定可靠'];
}

export default ParserVisualizationPanel;