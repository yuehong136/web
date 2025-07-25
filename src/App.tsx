import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { XProvider } from '@ant-design/x'
import { queryClient } from './lib/query-client'
import { router } from './lib/router'
import { initializeStores } from './stores'

function App() {
  // 初始化stores
  React.useEffect(() => {
    initializeStores()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <XProvider
        theme={{
          token: {
            colorPrimary: '#3b82f6', // 使用项目的主色调
            borderRadius: 8,
          },
        }}
        direction="ltr"
      >
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </XProvider>
    </QueryClientProvider>
  )
}

export default App