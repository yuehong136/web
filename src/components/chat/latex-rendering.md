# Shared formula rendering

Home chat, Explore, Agent runtime chat, Search summaries and Studio assistant
previews use `StreamingXMarkdown` with `markdownConfig`. The config wraps the
XMarkdown Latex tokenizers in [latex-extension.ts](latex-extension.ts), keeping
their KaTeX renderer and the existing XMarkdown DOMPurify boundary.

- Single backslash and dollar delimiters continue through the original tokenizer.
  Their commands and TeX matrix row breaks are not unescaped.
- Paired double backslash delimiters are recognized as one formula token. Doubled
  backslashes before alphabetic commands inside that token are reduced once. The
  token retains its original `raw` length so later formulas remain separate.
- `&lt;`, `&gt;` and `&amp;` are decoded once in the formula token's `text`, immediately
  before KaTeX rendering. They never re-enter Markdown or raw HTML parsing.
- Marked owns inline, fenced and indented code and ordinary text. There is no
  whole-message entity decoder or second delimiter preprocessing pass.

The [rendering regression](./__tests__/latex-rendering.test.tsx) uses the real
XMarkdown, Latex, KaTeX and DOMPurify implementations. It covers multiple formulas,
commands, entities, correct matrix row breaks, successive streaming frames, code
and encoded/raw HTML boundaries. Unrelated highlighting, Mermaid and artifact
components are mocked in this suite.

XMarkdown's existing streaming recognizer can hold a trailing bracket formula as
a potential Markdown link. A following newline or final frame releases it. The
adapter does not change that recognizer or enable KaTeX trusted HTML commands.
It handles paired double delimiters, not arbitrary repeated JSON escaping or
unmatched/mixed delimiter pairs; transport JSON should be decoded by the transport.
