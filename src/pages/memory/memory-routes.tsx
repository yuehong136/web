import type { RouteObject } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { lazyNamed, withLoading } from '@/lib/route-loading'

const MemoryListPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryListPage',
)
const MemoryDetailLayout = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryDetailLayout',
)
const MemoryMessagesPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryMessagesPage',
)
const MemorySettingsPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemorySettingsPage',
)
const MemoryStartupPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryStartupPage',
)
const MemoryCompactionPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryCompactionPage',
)
const MemoryVerificationPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryVerificationPage',
)
const MemoryMaintenancePage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryMaintenancePage',
)
const MemoryIncrementalPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryIncrementalPage',
)
const MemoryOperationsPage = lazyNamed(
  () => import('@/pages/memory'),
  'MemoryOperationsPage',
)

export const memoryRoutes: RouteObject[] = [
  {
    path: ROUTES.MEMORY,
    element: withLoading(MemoryListPage),
  },
  {
    path: '/memory/:id/operations',
    element: withLoading(MemoryOperationsPage),
  },
  {
    path: '/memory/:id',
    element: withLoading(MemoryDetailLayout),
    children: [
      {
        index: true,
        element: withLoading(MemoryMessagesPage),
      },
      {
        path: 'settings',
        element: withLoading(MemorySettingsPage),
      },
      {
        path: 'maintenance/batches',
        element: withLoading(MemoryIncrementalPage),
      },
      {
        path: 'startup',
        element: withLoading(MemoryStartupPage),
      },
      { path: 'compaction', element: withLoading(MemoryCompactionPage) },
      {
        path: 'verification',
        element: withLoading(MemoryVerificationPage),
      },
      {
        path: 'maintenance',
        element: withLoading(MemoryMaintenancePage),
      },
    ],
  },
]
