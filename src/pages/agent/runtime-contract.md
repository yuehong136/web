# Agent execution requests and feedback

The editor, Explore and share/widget share domain request construction and response validation. Each surface retains its existing request owner, cancellation, selection and iframe lifecycle.

## Execution source

- The editor explicitly requests draft debug.
- New Explore sessions choose `draft` or `published`. The `runMode` URL parameter preserves that intent; session creation converts it to boolean `release`. Published mode loads the released Begin form preview. An unavailable release or failed preview blocks creation without falling back to draft.
- Existing sessions retain the backend's original snapshot. Completion sends `session_id` without `release`; the UI displays “Original session snapshot” without interpreting `version_title` as authorization evidence. Begin inputs prefer the server-returned session DSL.
- Form previews are not authorization evidence. The backend selects the exact revision during creation; concurrent publication can change the revision after preview. The browser never issues grants or supplies a Principal, revision or digest as authority.
- Share/widget retains `/api/v1/agentbots/{id}/completions` and the beta token boundary. Shared request construction and feedback do not add Web MCP dynamic authorization to that SDK endpoint.

## Requests and failures

`src/api/agent-execution.ts` constructs an allowlist of protocol fields. Both Web completion methods use one request function; external share keeps separate authentication and routing.

JSON requests and SSE preflight throw the shared `APIError`, preserving HTTP status and stable server `error_code`. `assertResponse` checks HTTP/JSON business results; `assertSSEResponse` additionally requires a readable stream. Pipeline's successful JSON task acknowledgements use ordinary response validation.

`runtime-errors.ts` owns failure copy: execution source, grants, read-only tools, assurance, configuration and issuance faults use fixed bilingual translations. Unknown errors use generic feedback. Raw messages, credentials, response bodies and provider details are never rendered. Failure preserves user input and existing model output; a preflight refusal displays an error without fabricating an assistant answer.

An HTTP 200 JSON refusal cannot become a successful empty stream. Tool calls are never silently retried. Request owners continue to reject obsolete responses, frames after stop and foreign sessions. Draft and published grants remain separately configured on the backend.

## Verification boundary

Formal regressions cover request fields, creation modes, session sources, JSON/SSE refusals, feedback on all three surfaces, bilingual copy, cancellation and obsolete responses. Browser checks use actual Explore components with isolated simulated responses to verify themes, keyboard mode selection, creation refusal, published-session creation and resume refusal. These checks do not replace deployment acceptance of real MCP grants, database migrations, issuers or secure endpoints.
