import React from 'react';

interface ConfigurationFormContainerProps {
  children: React.ReactNode;
  title?: string;
}

export function ConfigurationFormContainer({ children, title }: ConfigurationFormContainerProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      {title && (
        <h3 className="text-sm font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}

function EmptyComponent() {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-gray-500">请选择解析器类型</p>
    </div>
  );
}

export { EmptyComponent };