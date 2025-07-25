import React from 'react';
import { Input } from '@/components/ui/input';

interface RaptorFormFieldsProps {
  className?: string;
}

const RaptorFormFields: React.FC<RaptorFormFieldsProps> = ({ className = "" }) => {
  const [raptorSettings, setRaptorSettings] = React.useState({
    enableRaptor: false,
    clusteringThreshold: 0.5,
    maxClusters: 10,
    summaryLength: 200
  });

  return (
    <div className={className}>
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">RAPTOR 配置</h4>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={raptorSettings.enableRaptor}
              onChange={(e) => setRaptorSettings(prev => ({ 
                ...prev, 
                enableRaptor: e.target.checked 
              }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              启用RAPTOR递归摘要
            </span>
          </label>

          {raptorSettings.enableRaptor && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  聚类阈值
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={raptorSettings.clusteringThreshold}
                  onChange={(e) => setRaptorSettings(prev => ({ 
                    ...prev, 
                    clusteringThreshold: Number(e.target.value) 
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大聚类数
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={raptorSettings.maxClusters}
                  onChange={(e) => setRaptorSettings(prev => ({ 
                    ...prev, 
                    maxClusters: Number(e.target.value) 
                  }))}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  摘要长度
                </label>
                <Input
                  type="number"
                  min="50"
                  max="1000"
                  value={raptorSettings.summaryLength}
                  onChange={(e) => setRaptorSettings(prev => ({ 
                    ...prev, 
                    summaryLength: Number(e.target.value) 
                  }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaptorFormFields;