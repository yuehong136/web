import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface TagItemsProps {
  tags?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagItems({ 
  tags = [], 
  onChange,
  placeholder = "添加标签",
  className = ""
}: TagItemsProps) {
  const [inputValue, setInputValue] = React.useState('');

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      const newTags = [...tags, inputValue.trim()];
      onChange?.(newTags);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange?.(newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        标签
      </label>
      
      <div className="space-y-2">
        {/* 输入框 */}
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addTag}
            size="sm"
            variant="outline"
            disabled={!inputValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 标签显示 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {tags.length === 0 && (
          <p className="text-xs text-gray-500">暂无标签</p>
        )}
      </div>
    </div>
  );
}