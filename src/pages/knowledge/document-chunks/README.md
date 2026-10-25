# Dataset tag list

The chunk toolbar's dataset tag popover reads the independent dataset tag
aggregation API. Tag queries include the sorted, deduplicated knowledge-base
IDs in their cache key. A changed dataset scope never uses previous-scope data.
Both the list and aggregation API clients normalize tuple and `{ value, count }`
responses; missing counts become zero, zero counts stay visible, and malformed
counts fail rather than appearing as valid counts. No legacy endpoint alias is
introduced.

Coverage: dataset-management API tests and chunk filter/popover tests. Browser
acceptance includes dataset changes with a delayed old response, zero counts,
keyboard open/dismiss, and both themes. Real API/search evidence is separate
from controlled chunk-content fixtures.
