# Provider logo sources

The following SVG files were copied unchanged from `infiniflow/ragflow`,
revision `554fb1133ac3861732235ad9c377eb5e0a770665`, under
`web/src/assets/svg/llm/` (Apache-2.0):

`aimlapi.svg`, `astraflow.svg`, `fastembed.svg`, `funasr.svg`, `futurmix.svg`,
`greenpt.svg`, `grok.svg`, `huaweicloud.svg`, `mws.svg`, `new-api.svg`,
`orcarouter.svg`, `qiniu.svg`, `somark.svg`, `tokenhub.svg`, `xiaomi.svg`.

[Source directory](https://github.com/infiniflow/ragflow/tree/554fb1133ac3861732235ad9c377eb5e0a770665/web/src/assets/svg/llm)

Provider names and display aliases follow the same revision's
`web/src/constants/llm.ts`. These display mappings do not register providers
or change backend model availability.

## OpenDataLoader

`src/assets/images/opendataloader.webp` is copied unchanged from the
[official website's logo](https://opendataloader.org/logo-icon.webp), the same
resource used by the navigation logo on [opendataloader.org](https://opendataloader.org/).
Retrieved 2026-10-28; SHA-256:
`50b7dc9964a73bad4e3eae26f03ee58cccca1b1a5ae087fee0bb624b3b9e40e5`.
The official raster is retained without tracing or recolouring. Its opaque
black and white artwork works on both themes. The logo identifies its owner;
the RAGFlow Apache-2.0 attribution above does not describe this website asset.

## RAGFlow logo audit (2026-10-28)

Compared the active provider mappings, standalone SVGs, theme switching and
sprite symbols with RAGFlow main at
[`f7de7669ad2bba8eff8225a7ea08a6beea2a5bef`](https://github.com/infiniflow/ragflow/tree/f7de7669ad2bba8eff8225a7ea08a6beea2a5bef/web/src/assets/svg/llm).

- **Jiekou.AI**: replaced the old purple mark with the upstream black/white
  mark and blue accent. `jiekouai-bright.svg` and `jiekouai-dark.svg` wrap
  `icon-jiekouai-bright` / `icon-jiekouai-dark` from the upstream
  [sprite](https://github.com/infiniflow/ragflow/blob/f7de7669ad2bba8eff8225a7ea08a6beea2a5bef/web/public/iconfont.js)
  in standalone SVG elements; path data, viewBox and colours are unchanged.
  The theme variants were introduced in
  [`f194e8b4c` (#15476)](https://github.com/infiniflow/ragflow/commit/f194e8b4c43b6db3c94b78249196f3d1f5ea0791).
- All 105 sprite symbols shared by Web and that revision have identical
  contents. The new symbols include Jiekou.AI and Perplexity theme variants;
  Web already uses the same Perplexity path geometry as standalone SVGs.
- No shared standalone SVG changed between the previous `554fb1133` source
  and the audited main revision. Existing Web differences for Youdao, Nomic,
  BAAI and Sentence Transformers are different artwork; N1n is styled
  differently; PaddleOCR and the old Jiekou SVG differ in formatting. These
  differences alone do not establish newer branding, so they are retained.
- Main adds providers and their logos beyond our backend catalog. No backend
  provider was added by this display-only audit. OpenDataLoader still has no
  mapping or logo in that RAGFlow revision, so its official website is used.
