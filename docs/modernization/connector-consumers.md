# Connector configuration consumers

Settings → Data sources uses `datasourceAPI.connector` for create, read, edit,
status, schedule, rebuild and logs. SharePoint and Slack use the same consumers.
The saved configuration is a complete replacement: form hydration retains
credentials and unknown configuration fields. Password inputs mask secrets.

SharePoint requires the site URL, tenant ID, client ID and client secret. Microsoft
Graph needs `Sites.Read.All` and `Files.Read.All` application permissions with admin
consent. Slack requires a token permitted to read the selected channels and their
thread replies. Both sources are validated by the sync worker; the connection
check control is available only for REST API sources. Deletion synchronization is
not exposed for SharePoint or Slack because permission changes cannot establish
an authoritative deletion inventory.

Slack channel scope is explicit. All accessible channels serializes as `null`, no
channels as `[]`, and selected channels as a list of names or regular expressions.
An empty selected list remains empty. The form never infers all channels from an
empty list. Existing comma-separated names hydrate as tags. UI scope is not sent
to the backend.

Large selector windows and Agent session exports use domain API pagination. Each
HTTP request asks for at most 100 records, retaining filters and the caller's
requested offset and window. Total count controls pagination; incomplete pages
before that count and later request failures reject the complete operation.
Repeated or missing entity IDs, changing totals and account changes reject the
whole aggregation before another page can mix inventories. Normal page requests
and legal zero pagination contracts remain with their domain
endpoint. A pagination response is not a snapshot of concurrently changing rows.

Browser fixtures prove UI rendering, payloads, feedback and local save/reload.
They do not prove real OAuth, vendor permissions, worker processing or persistence.
Those require a separately identified backend and storage acceptance receipt.
