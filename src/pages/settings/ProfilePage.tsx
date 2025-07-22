import React from 'react'
import { User } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center space-x-3 mb-6">
        <User className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">个人资料</h2>
      </div>
      <div className="text-center py-12">
        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">个人资料设置</h3>
        <p className="text-gray-500">此功能正在开发中...</p>
      </div>
    </div>
  )
}