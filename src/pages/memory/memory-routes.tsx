import type { RouteObject } from 'react-router-dom'
import { routeMeta } from '@/components/layout/route-meta'
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
    handle: routeMeta('knowledge', 'memory'),
    element: withLoading(MemoryListPage),
  },
  {
    path: '/memory/:id/operations',
    handle: routeMeta('knowledge', 'memoryOperations'),
    element: withLoading(MemoryOperationsPage),
  },
  {
    path: '/memory/:id',
    handle: routeMeta('knowledge', 'memory'),
    element: withLoading(MemoryDetailLayout),
    children: [
      {
        index: true,
        handle: routeMeta(undefined, 'memoryMessages'),
        element: withLoading(MemoryMessagesPage),
      },
      {
        path: 'settings',
        handle: routeMeta(undefined, 'memorySettings'),
        element: withLoading(MemorySettingsPage),
      },
      {
        path: 'maintenance/batches',
        handle: routeMeta(undefined, 'memoryBatches'),
        element: withLoading(MemoryIncrementalPage),
      },
      {
        path: 'startup',
        handle: routeMeta(undefined, 'memoryStartup'),
        element: withLoading(MemoryStartupPage),
      },
      {
        path: 'compaction',
        handle: routeMeta(undefined, 'memoryCompaction'),
        element: withLoading(MemoryCompactionPage),
      },
      {
        path: 'verification',
        handle: routeMeta(undefined, 'memoryVerification'),
        element: withLoading(MemoryVerificationPage),
      },
      {
        path: 'maintenance',
        handle: routeMeta(undefined, 'memoryMaintenance'),
        element: withLoading(MemoryMaintenancePage),
      },
    ],
  },
]
