import React from 'react';
import { Input } from '@/components/ui/input';

interface GraphRagItemsProps {
  marginBottom?: boolean;
  className?: string;
}

const GraphRagItems: React.FC<GraphRagItemsProps> = ({ 
  marginBottom = false, 
  className = "" 
}) => {
  const [graphSettings, setGraphSettings] = React.useState({
    enableGraphRag: false,
    hopCount: 2,
    entityThreshold: 0.8
  });

  return (
    <div className={`${className} ${marginBottom ? 'mb-6' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Graph RAG 配置</h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={graphSettings.enableGraphRag}
              onChange={(e) => setGraphSettings(prev => ({ 
                ...prev, 
                enableGraphRag: e.target.checked 
              }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              启用Graph RAG
            </span>
          </label>

          {graphSettings.enableGraphRag && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  跳跃次数
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={graphSettings.hopCount}
                  onChange={(e) => setGraphSettings(prev => ({ 
                    ...prev, 
                    hopCount: Number(e.target.value) 
                  }))}
                  className="w-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实体阈值
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={graphSettings.entityThreshold}
                  onChange={(e) => setGraphSettings(prev => ({ 
                    ...prev, 
                    entityThreshold: Number(e.target.value) 
                  }))}
                  className="w-24"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphRagItems;