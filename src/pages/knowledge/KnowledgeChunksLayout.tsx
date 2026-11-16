import { Outlet } from 'react-router-dom'

/**
 * Route shell for a document's chunks. The page renders its own
 * `DetailTemplate` head (Knowledge / base / document), so this layout adds
 * no second header.
 */
const KnowledgeChunksLayout = () => (
  <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
    <Outlet />
  </div>
)

export { KnowledgeChunksLayout }
