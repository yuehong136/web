# Agent share and Widget settings

The editor's Share dialog saves its full configuration in
`dsl.globals['sys.widget_settings']` through the existing Agent update API.
This includes embed type, theme, avatar visibility, published-link preference,
locale, external user ID, streaming, mute, text and all five colors.

Saving uses the normal draft contract: it saves the current graph and clears
the canvas's published marker. Existing published versions remain unchanged.
The `published` setting controls generated links; it does not publish the graph.
After PUT succeeds, the editor reloads the canonical detail GET before confirming
success. Reopening the dialog and refreshing the editor restore the saved values.

Widget URLs use `streaming`, `muted`, `widget_title`, `widget_subtitle`,
`widget_footer`, `widget_footer_link`, `widget_accent_color`,
`widget_background_color`, `widget_text_color`, `widget_header_text_color` and
`widget_footer_text_color`. `access.ts` owns URL encoding and parsing. Colors accept
three or six digit hex values and otherwise fall back to the widget defaults.
Footer links accept HTTP(S); a hostname gets an HTTPS prefix. Invalid protocols,
control characters and embedded credentials render the footer as plain text.

`widget-theme.tsx` confines the validated palette to the existing `ScopedTheme`
subtree. Launcher, embedded window and standalone preview share the same settings.
Closing the standalone panel preserves its live conversation. Mute prevents both
opening and response notifications from allocating audio resources. Copy uses the
shared runtime message toolbar, which excludes thinking content.

Regression coverage lives in `__tests__/widget-settings.test.tsx`, with the existing
startup and lifecycle tests covering task inputs, session preservation and aborts.
