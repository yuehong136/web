import { lazy, Suspense } from 'react'
import { useParams, type RouteObject } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageLoadingState } from '@/components/patterns'

const Spaces = lazy(() =>
  import('./skill-spaces-page').then((module) => ({
    default: module.SkillSpacesPage,
  })),
)
const Space = lazy(() =>
  import('./skill-space-page').then((module) => ({
    default: module.SkillSpacePage,
  })),
)
const Detail = lazy(() =>
  import('./skill-detail-page').then((module) => ({
    default: module.SkillDetailPage,
  })),
)
function SkillRoute({ page: Page }: { page: typeof Spaces }) {
  const { t } = useTranslation()
  const params = useParams()
  return (
    <Suspense
      fallback={<PageLoadingState title={t('skills.loading')} description="" />}
    >
      <Page key={`${params.spaceId || ''}/${params.skillId || ''}`} />
    </Suspense>
  )
}
export const skillRoutes: RouteObject[] = [
  { path: '/skills', element: <SkillRoute page={Spaces} /> },
  { path: '/skills/:spaceId', element: <SkillRoute page={Space} /> },
  {
    path: '/skills/:spaceId/skills/:skillId',
    element: <SkillRoute page={Detail} />,
  },
]
