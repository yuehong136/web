# Memory corrections and source withdrawal

The memory workspace inspector supports managed corrections when the backend advertises the capability. Opening a record, reading its mapping or viewing history does not adopt it.

Before the first adoption, the inspector explains that managed mode applies to the entire memory bank. When the server advertises writer capabilities, the workspace shows append, automatic extraction and FIFO support separately. Accepted work can still be waiting for publication. Deployment requires operators to drain legacy writers and verify untracked tasks. Servers without these capability fields retain the older restricted-mode explanation. Existing unadopted records remain readable. Coordinated enable, disable and forget actions remain available where the backend supports them; permanent source tombstones cannot be re-enabled.

Corrections target the current revision. Replace its content or supply a single exact text patch, enter a reason (at most 1,024 characters) and preview the result before submitting. Changing the draft invalidates the preview. A conflict requires a refresh and a new preview. Historical content remains read-only, and a manual correction is labelled as a user assertion rather than a verified fact.

A submitted operation may still be pending. The inspector reads publication and index synchronization separately; reading status never advances work. An explicit reconciliation action can resume pending work using its original operation. When a request times out or its commit is unconfirmed, retain that operation ID and inspect it instead of resending the command.

Ordinary append returns a raw-publication operation with decimal-string message IDs and a separate extraction queue state. An indexed raw conversation with a pending or unknown queue acknowledgement is not shown as wholly ready. A submitted task is not completed extraction, and a raw-only bank reports that no extraction task is required. This operation does not certify extracted facts.

Source withdrawal is separate from forgetting one record. It permanently stops normal supply of the source and its tracked derived memories, redacts their managed history and records physical cleanup separately. It does not promise to erase backups or unrelated copies. Registering an unmanaged source requires an explicit acknowledgement of the same bank-wide activation effect.

A confirmed permanent source state immediately removes its normal-supply bodies from this bank's list, recall, selected-content and known dependent revision caches. Other sources remain. Old in-flight reads are cancelled without restoring their previous snapshots; an offline or failed refetch cannot restore the removed bodies. A pending operation alone, or an unconfirmed error, does not establish withdrawal. An authorized source-state read can provide the confirmation without advancing the server operation.

Legacy numeric IDs that have lost integer precision are never used to select a server write. Local cache eviction may conservatively clear bodies in the same rounded numeric bucket while keeping source metadata; this cannot recover the exact original ID or certify physical erasure. Tracked index cleanup and untracked-copy or backup erasure remain separate statuses.

New managed API physical IDs are decimal strings. Unsafe numeric identifiers received from older endpoints cannot be edited, so the browser never rounds an ID to select a different record. Unsupported storage backends retain their existing controls and do not expose managed correction actions.

## Whole-bank deletion

A managed bank uses the deletion command only when both managed deletion and the deletion capability are enabled. It does not use the legacy immediate-delete API. The dialog keeps the original operation ID while writers drain, reports active and unknown attempts, pending appends, untracked tasks and operator reconciliation requirements, and prevents accidental dismissal of the pending handle. Page reload does not restore this handle; keep the displayed ID for operational recovery.

Receiving 202, stopping supply or reaching an index-ready state is insufficient to report deletion complete. The bank leaves the list only when the deletion operation reports `lifecycle: deleted` and `tracked_cleanup_confirmed: true`. A failed or unknown request never clears the bank or automatically resends the command. Reading status does not advance deletion; reconciliation is explicit. An in-flight attempt can still block reconciliation after its lease expires.

Confirmed deletion cancels stale bank and list reads before removing the bank's cached data and list entry, while preserving unrelated banks and the readable operation receipt. The server retains a separate authorized audit tombstone so operation status can still be read after the bank row has been deleted. Tracked cleanup does not certify erasure of backups or untraceable copies.

## Validation tools

`node scripts/browser/verify-memory-revisions.mjs` starts an owned Vite server and real Chromium browser with controlled API responses. It checks English/light and Chinese/dark adoption, preview, pending operation, explicit reconciliation, source withdrawal and keyboard dismissal. Evidence is written under the ignored `output/playwright/memory-revisions/` directory. These fixtures do not establish real backend, provider or deployment acceptance.

`scripts/browser/verify-memory-deletion.mjs` checks the capability-driven writer notice and deletion drain, busy reconciliation and confirmed completion in English/light and Chinese/dark. Run it through the owning batch's registered validation entry point. Its helper requires the run identity and case-journal directory, reserves exact listener ports, browser profile and output before creating them, uses an owned Vite cache and checks PID/listener cleanup. It connects to an owned Chrome process in the registered process group. Labelled screenshots and results are retained under `output/playwright/managed-memory/<run-id>/`; review a contact sheet before opening individual screenshots.

For real backend acceptance, `scripts/consumers/memory-revisions.ts` exports `runMemoryRevisionConsumer`. It uses the same domain API and shared `APIClient` as the UI. Call it only with a caller-owned disposable memory containing an unmanaged derived record and its source. The consumer corrects the derived record and permanently withdraws that source; the calling fixture owns cleanup.

```sh
TSX_TSCONFIG_PATH=tsconfig.app.json node --import tsx \
  scripts/consumers/memory-revisions.ts /private/scratch-config.json
```

The private configuration supplies `baseURL` (server origin), `token`, `memoryId`, `derivedMessageId` and `sourceId` as decimal strings, `correctedContent`, `ownedScratchConfirmed: true` and an optional `resultFile`. Do not commit this file or its credentials. The consumer checks read-only preview, string IDs, revision conflict, history provenance, operation completion, withdrawal and history redaction. It does not create credentials, delete the memory bank or deploy anything. The backend may invoke the configured embedding model; use a controlled embedding fixture when real-provider calls are outside the acceptance scope.

`scripts/consumers/memory-deletion.ts` separately exports `runMemoryDeletionConsumer`. Supply `baseURL`, `token`, `memoryId`, `ownedScratchConfirmed: true` and optional `resultFile` for a disposable managed bank whose writers are already drained. It verifies the real deletion command, read-only status, explicit reconciliation, tracked cleanup confirmation and authorized operation readback after the bank row is removed. This consumer permanently deletes that scratch bank; the caller must reserve its resources before creation and independently verify cleanup. Invoke consumers through the batch's registered validation runner, without credentials on the command line.

`scripts/consumers/memory-writes.ts` exports `runMemoryWritesConsumer` with the same connection, bank, ownership and result-file configuration. Use a disposable RAW-only bank. It appends a controlled conversation, checks stable same-operation replay, rejects a different body with the same operation ID, reads the operation without advancing it and verifies decimal-string IDs. It also checks that ordinary append does not change managed mode. This consumer creates no extraction task and leaves bank cleanup to its owning fixture.
