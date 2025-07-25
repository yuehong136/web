import React from 'react';
import { Input } from '@/components/ui/input';

interface ChunkMethodItemProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ChunkMethodItem({ value = '', onChange, className = '' }: ChunkMethodItemProps) {
  const chunkMethods = [
    { value: 'naive', label: '智能分块' },
    { value: 'manual', label: '手动分块' },
    { value: 'qa', label: '问答分块' },
    { value: 'table', label: '表格分块' },
  ];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        分块方法
      </label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">请选择分块方法</option>
        {chunkMethods.map((method) => (
          <option key={method.value} value={method.value}>
            {method.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        选择文档内容的分块处理方法
      </p>
    </div>
  );
}

interface EmbeddingModelItemProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EmbeddingModelItem({ value = '', onChange, disabled = false, className = '' }: EmbeddingModelItemProps) {
  const embeddingModels = [
    { value: 'text-embedding-ada-002', label: 'OpenAI Ada-002' },
    { value: 'text-embedding-3-small', label: 'OpenAI Text-3-Small' },
    { value: 'text-embedding-3-large', label: 'OpenAI Text-3-Large' },
    { value: 'bge-large-zh', label: 'BGE Large Chinese' },
  ];

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        嵌入模型
      </label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">请选择嵌入模型</option>
        {embeddingModels.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        选择用于文本嵌入的模型
      </p>
    </div>
  );
}
