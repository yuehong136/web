import { memo } from 'react'

interface NodeHeaderProps {
  id: string
  name: string
  label: string
  icon?: React.ReactNode
}

const NodeHeader = ({ name, icon }: NodeHeaderProps) => {
  return (
    <div className="px-3 py-2 border-b border-gray-100">
      <div className="flex items-center space-x-2">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {name}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(NodeHeader)

