/**
 * Real-time Tool Call Result Renderer
 * Displays tool calls with different status states and real-time updates
 */

import React from 'react';
import { Card, Badge, Tag, Typography, Collapse, Spin, Alert } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ApiOutlined
} from '@ant-design/icons';
import type { ToolCallInfo } from './EnhancedSSEParser';

const { Text, Paragraph } = Typography;

interface ToolCallRendererProps {
  toolCalls: ToolCallInfo[];
  isAnalyzing?: boolean;
  className?: string;
  showTimestamp?: boolean;
  collapsible?: boolean;
}

// 状态配置
const STATUS_CONFIG = {
  pending: {
    color: '#faad14',
    icon: <ClockCircleOutlined />,
    text: '等待中',
    description: '工具调用已创建，等待执行'
  },
  running: {
    color: '#1890ff',
    icon: <PlayCircleOutlined />,
    text: '执行中',
    description: '工具正在执行中...'
  },
  success: {
    color: '#52c41a',
    icon: <CheckCircleOutlined />,
    text: '成功',
    description: '工具调用执行成功'
  },
  error: {
    color: '#ff4d4f',
    icon: <ExclamationCircleOutlined />,
    text: '失败',
    description: '工具调用执行失败'
  }
};

// 格式化参数显示
const formatArguments = (args: Record<string, any>): string => {
  if (!args || Object.keys(args).length === 0) {
    return '{}';
  }
  
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
};

// 格式化结果显示
const formatResult = (result: any, status: string): React.ReactNode => {
  if (!result) {
    return status === 'running' ? (
      <div className="flex items-center space-x-2">
        <Spin size="small" />
        <Text type="secondary">执行中...</Text>
      </div>
    ) : (
      <Text type="secondary">暂无结果</Text>
    );
  }
  
  if (typeof result === 'string') {
    // 检查是否是JSON字符串
    try {
      const parsed = JSON.parse(result);
      return (
        <div className="space-y-2">
          <Text strong>结构化结果:</Text>
          <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      );
    } catch {
      // 普通字符串结果
      if (result.length > 200) {
        return (
          <div className="space-y-2">
            <Paragraph 
              ellipsis={{ 
                rows: 3, 
                expandable: true, 
                symbol: '展开' 
              }}
              className="mb-0"
            >
              {result}
            </Paragraph>
          </div>
        );
      } else {
        return <Text>{result}</Text>;
      }
    }
  }
  
  // 对象或其他类型
  return (
    <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
};

// 单个工具调用卡片
const ToolCallCard: React.FC<{
  toolCall: ToolCallInfo;
  showTimestamp: boolean;
  collapsible: boolean;
}> = ({ toolCall, showTimestamp, collapsible }) => {
  const statusConfig = STATUS_CONFIG[toolCall.status];
  
  const cardContent = (
    <div className="space-y-3">
      {/* 工具信息头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ApiOutlined className="text-blue-500" />
          <Text strong className="text-base">{toolCall.name}</Text>
          <Badge 
            color={statusConfig.color}
            text={statusConfig.text}
          />
        </div>
        {showTimestamp && (
          <Text type="secondary" className="text-xs">
            {toolCall.timestamp}
          </Text>
        )}
      </div>

      {/* 参数部分 */}
      {Object.keys(toolCall.arguments).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <CodeOutlined className="text-gray-500" />
            <Text type="secondary" className="text-sm">参数:</Text>
          </div>
          <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto border-l-2 border-blue-300">
            {formatArguments(toolCall.arguments)}
          </pre>
        </div>
      )}

      {/* 结果部分 */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1">
          {statusConfig.icon}
          <Text type="secondary" className="text-sm">结果:</Text>
        </div>
        <div className="border-l-2 border-gray-200 pl-3">
          {toolCall.status === 'error' ? (
            <Alert
              message="执行失败"
              description={formatResult(toolCall.result, toolCall.status)}
              type="error"
              showIcon
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {formatResult(toolCall.result, toolCall.status)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (collapsible && toolCall.status !== 'running') {
    return (
      <Collapse
        ghost
        size="small"
        className="tool-call-collapse"
        items={[
          {
            key: toolCall.id,
            label: (
              <div className="flex items-center space-x-2">
                {statusConfig.icon}
                <Text strong>{toolCall.name}</Text>
                <Badge color={statusConfig.color} text={statusConfig.text} />
                {showTimestamp && (
                  <Text type="secondary" className="text-xs ml-auto">
                    {toolCall.timestamp}
                  </Text>
                )}
              </div>
            ),
            children: (
              <div className="pl-6">
                {cardContent}
              </div>
            )
          }
        ]}
        defaultActiveKey={['running', 'error'].includes(toolCall.status) ? [toolCall.id] : undefined}
      />
    );
  }

  return (
    <Card
      size="small"
      className={`tool-call-card transition-all duration-200 ${
        toolCall.status === 'running' ? 'border-blue-300 shadow-sm' : ''
      } ${toolCall.status === 'error' ? 'border-red-300' : ''}`}
      styles={{
        body: { padding: '12px' }
      }}
    >
      {cardContent}
    </Card>
  );
};

// 主组件
export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolCalls,
  isAnalyzing = false,
  className = '',
  showTimestamp = true,
  collapsible = false
}) => {
  if (!toolCalls || toolCalls.length === 0) {
    if (isAnalyzing) {
      return (
        <div className={`tool-call-renderer ${className}`}>
          <Card size="small" className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2">
              <Spin size="small" />
              <Text type="secondary">正在分析工具需求...</Text>
            </div>
          </Card>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`tool-call-renderer space-y-3 ${className}`}>
      {/* 工具调用统计 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ApiOutlined className="text-blue-500" />
          <Text strong>工具调用 ({toolCalls.length})</Text>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-2">
            <Spin size="small" />
            <Text type="secondary" className="text-sm">分析中...</Text>
          </div>
        )}
      </div>

      {/* 工具调用列表 */}
      <div className="space-y-3">
        {toolCalls.map((toolCall) => (
          <ToolCallCard
            key={toolCall.id}
            toolCall={toolCall}
            showTimestamp={showTimestamp}
            collapsible={collapsible}
          />
        ))}
      </div>

      {/* 状态标签 */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {Object.entries(
          toolCalls.reduce((acc, call) => {
            acc[call.status] = (acc[call.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          return (
            <Tag
              key={status}
              color={config.color}
              icon={config.icon}
            >
              {config.text} ({count})
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default ToolCallRenderer;
