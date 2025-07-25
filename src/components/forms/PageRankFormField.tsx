import React from 'react';
import { Input } from '@/components/ui/input';

interface PageRankFormFieldProps {
  value?: number;
  onChange?: (value: number) => void;
  className?: string;
}

const PageRankFormField: React.FC<PageRankFormFieldProps> = ({ 
  value = 0, 
  onChange,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        PageRank权重
      </label>
      <Input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        placeholder="0"
      />
      <p className="text-xs text-gray-500 mt-1">
        用于调整文档片段的重要性权重 (0-100)
      </p>
    </div>
  );
};

export default PageRankFormField;