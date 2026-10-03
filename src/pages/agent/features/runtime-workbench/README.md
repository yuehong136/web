# Task cancellation contract

## Scope

Frontend port of `488c3ef6a306cf11f73dd642c0e7fd0420c4001e` (Task REST API #14393), consuming the current Python and Go backend contract at `beee09f17eb52646986e22f8f2f3872f1959533d`.

The complete upstream diff and subsequent missing/terminal no-op (`5885691c`), dataset authorization (`19ec6245`), cancellation/late-write handling (`2223a514`) and cancellation log (`28a41ed0`) changes were inspected. Their original helper is not copied into this client; the shared APIClient continues to handle REST base paths, authentication and both envelope formats.

## API and feedback

| Operation                          | Contract                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Submit cancellation                | `POST /api/v1/tasks/{encoded task_id}/cancel`, no request body               |
| Accepted / idempotent no-op        | Python `retcode: 0` or Go `code: 0`, with literal `data: true`               |
| Authorization / resource denied    | Business `109`, `data: false`                                                |
| Storage / compensation failure     | Business `100`, `data: false`                                                |
| Invalid authentication / parameter | Actual HTTP 401 / 422; shared typed `APIError`                               |
| Invalid acknowledgement            | False, missing or malformed data throws `APIError` with `INVALID_CANCEL_ACK` |

Both `agentAPI.cancelTask` and `agentAPI.cancelDataflow` use `src/api/agent-cancellation.ts`. There is no legacy `PUT /v1/canvas/cancel/{id}` consumer in these paths and no invented Task GET endpoint.

A successful acknowledgement establishes submission or a no-op. It does not establish that a worker has stopped. Stop first detaches the local output receiver, then requests cancellation when the current attempt has an actual Task ID. Feedback distinguishes output disconnected, cancellation requested/waiting, and request failure. Failures use fixed localized text, and the cancellation mutations use local feedback ownership rather than global or silent error handling.

## IDs and request ownership

- Agent editor / Explore use the current SSE `task_id`. This is distinct from the message ID and session ID.
- Pipeline debug uses the response `data.message_id`, which is the actual enqueued SQL Task ID in the current backend.
- GraphRAG / RAPTOR use the actual generation Task ID returned by start / trace. Search MindMap is not a consumer of this Task cancellation UI.
- A new editor attempt clears the previous Task ID before saving or waiting for the first frame. Stop before any current ID only disconnects locally and never cancels a previous run.
- Editor and Pipeline attempts own their controller, Task ID and delayed cancellation feedback. Reset, a new attempt, canvas change and unmount invalidate previous ownership. Repeated stop on the same detached attempt does not send another cancellation.
- Explore retains its selection owner: new URL promotion, A → B → A and new runs suppress old replies/errors/finally updates. Abort handling preserves the feedback already written by the owned stop request.
- Knowledge pause feedback is scoped to the knowledge base, generation type and Task ID. In-flight duplicate pauses are suppressed; changes of knowledge base, generation or trace ID suppress delayed feedback. The existing “Stop requested … Waiting for the task to respond” success copy remains.

`use-agent-runtime-request.ts` contains the extracted run orchestration; `use-task-run-owner.ts` provides attempt ownership. The workbench hook was reduced below the 600-line limit and its old file-size debt entry was removed by tightening the baseline.

## Formal regression coverage

The formal test inventory runs:

- `src/api/__tests__/task-cancellation.test.ts`: 13 actual shared-client fetch/envelope cases, both Python and Go shapes, URL encoding/no body, 100/109/401/422, network and malformed acknowledgements.
- `explore/__tests__/cancellation.test.tsx`: 4 actual Explore-hook cases covering the SSE ID, safe feedback after abort, no-ID/repeated stop and obsolete ownership.
- `runtime-workbench/__tests__/task-cancellation.test.tsx`: 6 actual editor/Pipeline-hook cases covering new attempt ID clearing, current ID, failure/repeated stop, delayed success/error after new/reset/canvas changes and finish/stop ordering.
- `src/hooks/__tests__/knowledge-cancellation.test.tsx`: 6 actual generation-hook cases covering both types, current IDs, safe feedback, duplicate/missing IDs and obsolete knowledge base/generation/trace replies.

The pre-change API, Explore and editor/Pipeline cases reproduced failures. The knowledge trace-change regression waits for the actual query notification before resolving the old reply; it does not assume synchronous cache delivery.

## Isolated acceptance, 2026-10-02

Actual Web Explore and editor ran through real authenticated HTTP, shared SSE and the production Canvas / Begin / VariableAssigner / Message chain. Separate PostgreSQL and Redis containers held disposable users, API keys, canvases, versions, sessions, Tasks and the dedicated queue. No production storage or remote provider was used.

Actual component waiting and an ASGI response-header scheduling boundary provided cancellable timing windows. The component still executed its original implementation after release. These are controlled timing boundaries, not evidence of a naturally slow provider.

The actual editor cleared the current ID before a delayed first frame; local stop submitted no cancellation for the prior completed Task. Explore cancellation preserved a successful message/history prefix and retained only the current failed-round user input. An independently active sibling completed normally. A separately created `release: true` session ran the original published Message despite a different current draft; cancellation preserved definitions, versions, other sessions and all Redis replica payloads after the other editor was closed.

Pipeline's file-upload UI requires object storage. A disposable entry mounted the same production `usePipelineWorkbench` with the real graph store, save/query/mutation/client and an empty debug input. It queued actual SQL Tasks and trusted bindings. Actual Redis cancellation failure returned 100 with safe UI feedback and no Task/nonce mutation; an actual outsider returned 109 with the same safe failure feedback. Normal cancellation wrote progress -1, one cancellation marker, the trusted binding state and a matching nonce with a 24-hour TTL.

Actual GraphRAG/RAPTOR UI start and pause created SQL Tasks and knowledge-base Task IDs, then wrote the cancellation log and nonce; the completed seed document remained completed. No graph, RAPTOR or dataflow worker was started. Production `Pipeline.callback` independently observed the cancellation and raised `TaskCanceledException`; worker-initialized node logs remained absent. This does not establish full document parsing or generation.

The actual Go task handler/router/service, built from the same backend revision, served HTTP against the shared scratch database/Redis. Three simultaneously held database connections resolved `usr_ai`. A real browser cancellation POST went through Go for a Python-created dataflow Task; SQL/binding/nonce readback and production Python cancellation observation passed. Duplicate Go cancellation preserved the nonce and SQL log. Invalid credentials returned real 401 and the browser entered the login-expired flow. Go has no Canvas execution engine; no Go model run is claimed.

41 independent readback/protocol assertions passed. 31 screenshots were reviewed as six contact sheets with filename, route and actual viewport captions. Diagnostic screenshots and setup failures are separately described in the report. Cleanup checked 71 tables (39 rows → 0), Redis DB1 (45 keys → 0) / DB2 (0), revoked API/JWT/outsider credentials (401), browser storage and pages, two containers/two anonymous volumes, five listeners, owned processes and private/temporary files.

Evidence: [acceptance report](/Users/xldu/.codex/visualizations/2026/09/27/01a0e29f-d9be-73e2-ab9b-7e11f071915c/488-acceptance/report.md), original HTTP/SSE and Go proxy audits, readbacks, verification and cleanup JSON, gate logs and captioned contact sheets. Deployment, remote models, object uploads, full background workers and Desktop packaging were not tested.

Final gates passed on the current checkout: `test:ci` (121 files / 804 cases), `lint` (0 errors / 1494 existing warnings), `lint:typed`, `typecheck:agent-strict`, `lint:i18n-agent`, `lint:file-size`, `build` and `check:bundle-size`. Concurrent dependency upgrades were kept outside this task; the final formal test suite was rerun on the resulting installed versions.

## Web execution authorization

The editor explicitly uses draft mode; existing sessions retain their original server snapshot. HTTP/SSE preflight refusals share typed errors and fixed bilingual feedback with Explore and share/widget. See the [Agent runtime contract](../../runtime-contract.md).
