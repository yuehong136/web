# Memory corrections and source withdrawal

The memory workspace inspector supports managed corrections when the backend advertises the capability. Opening a record, reading its mapping or viewing history does not adopt it.

Before the first adoption, the inspector explains that managed mode applies to the entire memory bank: ordinary append and automatic extraction are temporarily restricted, as is whole-bank deletion. Existing unadopted records remain readable. Coordinated enable, disable and forget actions remain available where the backend supports them; permanent source tombstones cannot be re-enabled.

Corrections target the current revision. Replace its content or supply a single exact text patch, enter a reason (at most 1,024 characters) and preview the result before submitting. Changing the draft invalidates the preview. A conflict requires a refresh and a new preview. Historical content remains read-only, and a manual correction is labelled as a user assertion rather than a verified fact.

A submitted operation may still be pending. The inspector reads publication and index synchronization separately; reading status never advances work. An explicit reconciliation action can resume pending work using its original operation. When a request times out or its commit is unconfirmed, retain that operation ID and inspect it instead of resending the command.

Source withdrawal is separate from forgetting one record. It permanently stops normal supply of the source and its tracked derived memories, redacts their managed history and records physical cleanup separately. It does not promise to erase backups or unrelated copies. Registering an unmanaged source requires an explicit acknowledgement of the same bank-wide activation effect.

A confirmed permanent source state immediately removes its normal-supply bodies from this bank's list, recall, selected-content and known dependent revision caches. Other sources remain. Old in-flight reads are cancelled without restoring their previous snapshots; an offline or failed refetch cannot restore the removed bodies. A pending operation alone, or an unconfirmed error, does not establish withdrawal. An authorized source-state read can provide the confirmation without advancing the server operation.

Legacy numeric IDs that have lost integer precision are never used to select a server write. Local cache eviction may conservatively clear bodies in the same rounded numeric bucket while keeping source metadata; this cannot recover the exact original ID or certify physical erasure. Tracked index cleanup and untracked-copy or backup erasure remain separate statuses.

New managed API physical IDs are decimal strings. Unsafe numeric identifiers received from older endpoints cannot be edited, so the browser never rounds an ID to select a different record. Unsupported storage backends retain their existing controls and do not expose managed correction actions.

## Validation tools

`node scripts/browser/verify-memory-revisions.mjs` starts an owned Vite server and real Chromium browser with controlled API responses. It checks English/light and Chinese/dark adoption, preview, pending operation, explicit reconciliation, source withdrawal and keyboard dismissal. Evidence is written under the ignored `output/playwright/memory-revisions/` directory. These fixtures do not establish real backend, provider or deployment acceptance.

For real backend acceptance, `scripts/consumers/memory-revisions.ts` exports `runMemoryRevisionConsumer`. It uses the same domain API and shared `APIClient` as the UI. Call it only with a caller-owned disposable memory containing an unmanaged derived record and its source. The consumer corrects the derived record and permanently withdraws that source; the calling fixture owns cleanup.

```sh
TSX_TSCONFIG_PATH=tsconfig.app.json node --import tsx \
  scripts/consumers/memory-revisions.ts /private/scratch-config.json
```

The private configuration supplies `baseURL` (server origin), `token`, `memoryId`, `derivedMessageId` and `sourceId` as decimal strings, `correctedContent`, `ownedScratchConfirmed: true` and an optional `resultFile`. Do not commit this file or its credentials. The consumer checks read-only preview, string IDs, revision conflict, history provenance, operation completion, withdrawal and history redaction. It does not create credentials, delete the memory bank or deploy anything. The backend may invoke the configured embedding model; use a controlled embedding fixture when real-provider calls are outside the acceptance scope.
