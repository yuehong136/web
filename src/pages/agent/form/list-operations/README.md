# Versioned list operations

## Contract and compatibility

New nodes carry integer `operations_version: 2`, `operations: nth`, `n: 0` and
`strict: false`. Imported or persisted forms without a version are version 1,
including an empty graph form or missing component parameters. Version selection
happens before shared defaults merge. Loading, editing unrelated fields,
duplicating, saving and publishing a historical node keep version 1.

| Operation         | Version 1                                                      | Version 2                                                                   |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Missing operation | `topN`                                                         | `nth`                                                                       |
| `nth`             | Not offered in the historical editor                           | One-item array; positive one-based index, negative index from the end       |
| `head`            | One item at positive position N from the start                 | First N items in original order                                             |
| `tail`            | One item at positive position N from the end                   | Last N items in original order                                              |
| `topN`            | First N items                                                  | Backend compatibility alias for `head`                                      |
| Nonpositive N     | Empty list                                                     | Empty list in lenient mode, except valid negative `nth`                     |
| Oversized N       | Historical head/tail return empty; topN returns the whole list | Lenient nth returns empty; head/tail return the whole list                  |
| Strict mode       | Retained if present; ignored by the backend                    | Nth requires a nonzero index in range; slices require 1 through list length |

Empty results have null `first` and `last` at the runtime boundary. Sort, filter
and stable duplicate removal keep their existing behavior.

Raw historical N values and redundant strict values survive round trips. The
backend owns Python integer conversion (including numeric strings, truncating
floats and booleans). The editor only converts N when the user explicitly enters
a safe integer. Invalid version markers such as the string `"2"`, booleans and
null remain invalid and show a localized read-only alert. Aliases are normalized
for display; no bulk version upgrade or execution implementation lives here.

The count input accepts zero and negative integers. Persistence must save a
return to the initial zero even after React Hook Form clears `isDirty`. Form
instances are keyed by node ID and binding path so changing selected nodes cannot
copy one node's version or values into another node.

## Upstream mapping

Source: `82313020c71b8b91873232c2334c2c1c382f1c49` (six-file diff and
committed tree audited), with `origin/main` refreshed to
`519e7d98a5651564d4e35d6648f006cba4baaf4f`.

| Upstream file                                                              | Local handling                                                                                      |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `agent/component/list_operations.py`                                       | Consume the local backend's versioned contract; do not duplicate the algorithm in JavaScript        |
| `test/testcases/test_web_api/test_canvas_app/test_list_operations_unit.py` | Backend contract reference; use this repository's formal Node/Vitest lanes for frontend regressions |
| `web/src/locales/en.ts`, `web/src/locales/zh.ts`                           | Feature messages in the existing flow namespace, both languages together                            |
| `web/src/pages/agent/constant/index.tsx`                                   | Explicit new-node defaults, types, registry/default merge and normalizers                           |
| `web/src/pages/agent/form/list-operations-form/index.tsx`                  | Existing local form, count input, strict control and version-aware node summary                     |

Relevant later fixes were checked: `f58fae5fb71bad1970da747dfecc8b241875a44f`
normalizes topN whitespace/case, and `38c40e64a98c4657b3ac49de217aa3993bd757ef`
normalizes missing input to an empty list. Both are already consumed through the
current backend. Later sort-by expansion and Python component removal are outside
this dispatch. No relevant revert/re-land changes the selected behavior.

The local backend core adaptation is commit
`0f9de26cc2384c34dd110935eb64c35a747c9acb`; isolated acceptance used backend HEAD
`0550829cd6cea9d2611fa3fa6e3b2f6ddfd5b660` with its existing concurrent working
tree changes preserved. The current beta completions endpoint defaults to SSE;
strict failures use code 100 in SSE and code 102 in the non-streaming envelope.
The normal authenticated endpoint also returns business code 102 under HTTP 200.

## Failure presentation

Explore and public share consume the current endpoint and show fixed localized
failure text. A terminal error without a message ID still contributes a failed
trace entry. A saved executed DSL `_ERROR` takes precedence over the mere presence
of a prologue/user message; reloading such a session keeps failure status and a
localized failed assistant presentation. Lenient empty results remain successful.
The stored server DSL and messages are not rewritten by presentation adapters.

## Verification

Final local gates, all exit 0:

- `npm run test:ci`: 116 inventory files; 527 source Node, 158 Vitest, 81 desktop
  Node and 7 tooling tests (773 total).
- `npm run lint`: 0 errors, 1494 warnings; `npm run lint:typed`: 0 errors, 84 warnings.
- `npm run typecheck:agent-strict`, `npm run test:agent-t1` (74 tests).
- `npm run build`, `npm run check:bundle-size`.
- `npm run lint:i18n-agent`, `npm run lint:file-size`.

Formal regressions cover new defaults, graph/component imports, absent forms,
pre-merge version selection, raw values, invalid markers, clone/save/adapter
reload, actual bound forms, switching v1/v2 nodes, integer input, bilingual
labels, strict SSE/HTTP failure feedback and saved-error status. The two selection
regressions failed before the form-instance fix and passed afterward.

Real isolated acceptance used the actual canvas editor, Explore, public share,
authenticated HTTP and beta SSE/non-streaming endpoints against dedicated
PostgreSQL and Redis. It exercised Begin → ListOperations → Message, with no
Canvas, business/DB or model stub. No model is needed for that workflow.

Independent SQL readback verified 39 sessions (7 failed), including 11 historical
cases after an unrelated rename, negative/zero N, slices, strict errors, sort,
filter, duplicate removal, preserved raw values and old-session isolation after
draft changes. New and duplicated node definitions and a mixed-version form
switch were saved and read independently. UI publishing retained the released
head-2 snapshot while a new draft used tail-1 and later nth-0.

With every browser tab closed, three further real requests preserved all 18
canvas definitions, 50 version records and 18 Redis payload strings exactly.
An earlier mixed UI/runtime checkpoint also preserved all definitions; one
replica metadata timestamp refreshed, so it is not claimed as byte-identical.

61 screenshots were reviewed as eight contact sheets labeled with filename,
route and the actual 1280×720 viewport. Evidence, final gate logs and cleanup
records are in:

`/Users/xldu/.codex/visualizations/2026/09/27/01a0e29f-d9be-73e2-ab9b-7e11f071915c/823-acceptance/`

Cleanup independently checked all 71 dedicated database tables at zero rows,
Redis DBs 1/2 empty, revoked JWT and beta token returning 401, both containers and
anonymous volumes removed, all four listeners closed, all three browser tabs
cleared/closed, and temporary entry/credential files removed.

This is local isolated acceptance. It does not establish production deployment,
external model execution, retrieval/storage acceptance, desktop packaging or a
broader audit of product-language persistence/isolation. Shared locale services
and protocol/API routes are unchanged. One initial external-harness assertion on
escaped JSON was corrected and rerun; the preceding positive request is included
in SQL readback but is not counted as a separate accepted scripted case.
