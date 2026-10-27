# Generation settings persistence

Studio and Explore persist the generation style as `llm_setting.parameter` and
send only enabled numeric overrides. Numeric values and enabled fields determine
whether a named preset actually matches. A disabled sampling override or an
additional maximum-token override is Custom. Explicit Custom stays Custom even
when its numbers match a named style. Unknown imported style metadata survives
unrelated saves without applying preset defaults or replacing legal zero values.
Selecting a style or editing its numeric fields updates the style metadata;
unrelated edits preserve it.

Coverage: Studio data/save-lifecycle tests and actual Studio/Explore save and
reopen with API/SQL readback. Verify zero, disabled overrides, unknown styles,
explicit Custom, keyboard use, and both themes.
