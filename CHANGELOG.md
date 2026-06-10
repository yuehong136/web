# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Release process: bump `package.json` version → move the Unreleased section
into a version heading below → `git tag -a vX.Y.Z` → push with tags.
(See `docs/engineering-modernization-roadmap.md` HYG-1.)

## [Unreleased]

### Added

- GitHub Actions CI: lint, type-aware lint, agent strict typecheck, both
  formal test suites, production build (`.github/workflows/ci.yml`)
- Security lint rules treating model output as untrusted input:
  `security/no-unsafe-iframe-sandbox`, `security/no-target-blank-without-rel`,
  plus core `no-eval` / `no-new-func` / `no-script-url`
- File-size ratchet gate (`npm run lint:file-size`) — oversized files are
  baselined in `scripts/file-size-baseline.json` and may only shrink
- Bundle size budget gate (`npm run check:bundle-size`) with budgets in
  `scripts/bundle-size-budget.json`
- Apache-2.0 LICENSE, this CHANGELOG, and the engineering modernization
  roadmap (`docs/engineering-modernization-roadmap.md`)

### Changed

- `CLAUDE.md` / `AGENTS.md` aligned with actual repo state; added mandatory
  API-layer, environment-variable, and model-output-security sections

## [0.9.8] - 2026-06-10

Baseline tag. `0.9.8` had been the working version in `package.json` prior to
versioned releases; this entry marks the state of the platform when release
hygiene (LICENSE, changelog, tags) was introduced.

Platform capabilities at this point: intelligent conversation, knowledge
bases, agent/pipeline orchestration with runtime & trace workbenches
(T1–T13), embeddable agent share widget, MCP server integration, explore,
memory, and system administration. See `docs/agent-t*-summary.md` for the
capability-by-capability history.
