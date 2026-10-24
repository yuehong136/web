import type { RunPhase } from '@/lib/streaming'

/** Display contracts only. API payloads and message state remain domain-owned. */
export interface WorkspaceScope {
  readonly identity: string
  readonly threadId: string
}

export interface RunProjection {
  readonly scope: WorkspaceScope
  readonly messageId: string
  readonly runId?: string
  readonly phase?: RunPhase
  readonly subscription: 'connected' | 'detached' | 'closed'
  readonly terminalSource?: 'server' | 'transport' | 'local'
}

export type ContextResourceKind =
  | 'model'
  | 'app'
  | 'knowledgeBase'
  | 'tool'
  | 'file'
export type ResourceAvailability =
  | 'ready'
  | 'preparing'
  | 'failed'
  | 'revoked'
  | 'unknown'
export interface ContextResource {
  readonly kind: ContextResourceKind
  readonly id: string
  readonly label: string
  readonly availability: ResourceAvailability
  readonly origin: 'inherited' | 'turn'
}

/** A selection is never evidence that a model read a resource. */
export interface ContextManifest {
  readonly scope: WorkspaceScope
  readonly messageId: string
  readonly stage: 'selected' | 'submitted'
  readonly resources: readonly ContextResource[]
}

export interface CitationRef {
  readonly id: string
  readonly messageId: string
  readonly sourceId?: string
  readonly chunkId: string
  readonly title: string
  readonly excerpt: string
  readonly availability: 'excerpt' | 'originalAvailable' | 'unavailable'
}

export interface ArtifactRef {
  readonly id: string
  readonly messageId: string
  readonly runId?: string
  readonly name: string
  readonly mediaType?: string
  readonly state: 'ready' | 'preparing' | 'failed' | 'unavailable' | 'forbidden'
  /** Only validated, existing artifact endpoints may be used for a resource. */
  readonly url: string
  readonly capabilities: {
    readonly preview: boolean
    readonly download: boolean
  }
}

/** No save/revision/approval/queue capabilities are inferred on the client. */
export const workspaceCapabilities = Object.freeze({
  citationPreview: true,
  artifactDownload: true,
  contextSubmissionSnapshot: true,
  durableRun: false,
  serverCancel: false,
  queue: false,
  steer: false,
  artifactSave: false,
  artifactRevision: false,
  toolApproval: false,
})

export function createContextManifest(input: ContextManifest): ContextManifest {
  return Object.freeze({
    scope: Object.freeze({ ...input.scope }),
    messageId: input.messageId,
    stage: input.stage,
    resources: Object.freeze(
      input.resources.map((resource) => Object.freeze({ ...resource })),
    ),
  })
}
