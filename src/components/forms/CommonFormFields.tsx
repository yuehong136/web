import React from 'react';
import { Input } from '@/components/ui/input';

// Layout Recognition Form Field
interface LayoutRecognizeFormFieldProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

export const LayoutRecognizeFormField: React.FC<LayoutRecognizeFormFieldProps> = ({
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
          启用布局识别
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1">
        识别文档的布局结构，提高解析精度
      </p>
    </div>
  );
};

// Delimiter Form Field
interface DelimiterFormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const DelimiterFormField: React.FC<DelimiterFormFieldProps> = ({
  value = '',
  onChange,
  className = ""
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        分隔符
      </label>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="输入自定义分隔符"
      />
      <p className="text-xs text-gray-500 mt-1">
        用于分割文档内容的分隔符
      </p>
    </div>
  );
};

// Max Token Number Form Field
interface MaxTokenNumberFormFieldProps {
  value?: number;
  onChange?: (value: number) => void;
  initialValue?: number;
  max?: number;
  className?: string;
}

export const MaxTokenNumberFormField: React.FC<MaxTokenNumberFormFieldProps> = ({
  value,
  onChange,
  initialValue = 512,
  max = 8192,
  className = ""
}) => {
  const currentValue = value !== undefined ? value : initialValue;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        最大Token数量
      </label>
      <Input
        type="number"
        min="1"
        max={max}
        value={currentValue}
        onChange={(e) => onChange?.(Number(e.target.value))}
        placeholder={initialValue.toString()}
      />
      <p className="text-xs text-gray-500 mt-1">
        每个文档片段的最大Token数量 (1-{max})
      </p>
    </div>
  );
};

// Excel to HTML Form Field
interface ExcelToHtmlFormFieldProps {
  value?: boolean;
  onChange?: (value: boolean) => void;
  className?: string;
}

export const ExcelToHtmlFormField: React.FC<ExcelToHtmlFormFieldProps> = ({
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
          Excel转HTML
        </span>
      </label>
      <p className="text-xs text-gray-500 mt-1">
        将Excel表格转换为HTML格式进行解析
      </p>
    </div>
  );
};

// Entity Types Form Field  
interface EntityTypesFormFieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  className?: string;
}

export const EntityTypesFormField: React.FC<EntityTypesFormFieldProps> = ({
  value = [],
  onChange,
  className = ""
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const addEntityType = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange?.([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeEntityType = (entityType: string) => {
    onChange?.(value.filter(type => type !== entityType));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        实体类型
      </label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="添加实体类型"
            className="flex-1"
          />
          <button
            type="button"
            onClick={addEntityType}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            添加
          </button>
        </div>
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((entityType, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {entityType}
                <button
                  type="button"
                  onClick={() => removeEntityType(entityType)}
                  className="ml-1.5 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        指定要识别的实体类型
      </p>
    </div>
  );
};