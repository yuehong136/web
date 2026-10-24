/** Structural identity comparison only; credentials never become a cache/DOM key. */
export interface RequestIdentity {
  token: string | null
  user: { id?: string; tenant_id?: string } | null
  tenant: { id?: string } | null
  isAuthenticated: boolean
}

export const sameRequestIdentity = (
  left: RequestIdentity,
  right: RequestIdentity,
) =>
  left.token === right.token &&
  left.user?.id === right.user?.id &&
  left.user?.tenant_id === right.user?.tenant_id &&
  left.tenant?.id === right.tenant?.id &&
  left.isAuthenticated === right.isAuthenticated
