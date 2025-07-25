// 为了简化和快速修复，创建一些简单的配置组件

import React from 'react';
import { ConfigurationFormContainer } from '../configuration-form-container';
import { TagItems } from '../tag-item';
import { ChunkMethodItem, EmbeddingModelItem } from './common-item';

// 简化的配置组件，只包含基本的共同字段
const SimpleConfiguration = () => {
  return (
    <ConfigurationFormContainer>
      <ChunkMethodItem />
      <EmbeddingModelItem />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PageRank权重
        </label>
        <input
          type="number"
          min="0"
          max="100"
          defaultValue={0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          用于调整文档片段的重要性权重 (0-100)
        </p>
      </div>
      <TagItems />
    </ConfigurationFormContainer>
  );
};

// 导出各种配置的简单版本
export const LawsConfiguration = SimpleConfiguration;
export const ManualConfiguration = SimpleConfiguration;
export const OneConfiguration = SimpleConfiguration;
export const PaperConfiguration = SimpleConfiguration;
export const PictureConfiguration = SimpleConfiguration;
export const PresentationConfiguration = SimpleConfiguration;
export const ResumeConfiguration = SimpleConfiguration;
export const TableConfiguration = SimpleConfiguration;
export const TagConfiguration = SimpleConfiguration;