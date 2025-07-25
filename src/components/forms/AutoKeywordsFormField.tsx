import React from 'react';
import { Input } from '@/components/ui/input';

interface AutoKeywordsFormFieldProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

interface AutoQuestionsFormFieldProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

export const AutoKeywordsFormField: React.FC<AutoKeywordsFormFieldProps> = ({
  value = false,
  onChange,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          自动提取关键词
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1">
        自动从文档内容中提取关键词用于检索
      </p>
    </div>
  );
};

export const AutoQuestionsFormField: React.FC<AutoQuestionsFormFieldProps> = ({
  value = false,
  onChange,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange?.(e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          自动生成问题
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1">
        基于文档内容自动生成相关问题
      </p>
    </div>
  );
};