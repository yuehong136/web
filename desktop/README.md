# MultiRAG Desktop Secure Shell (CLP-DESK0)

This directory contains the non-release Electron secure-shell baseline around the existing React/Vite renderer. The Web application remains the only production product and continues to build independently.

## Implemented in DESK0

- Electron main process with global sandboxing, a locked-down `BrowserWindow`, deny-by-default permissions/downloads, and blocked popups, webviews, and untrusted navigation.
- Sandboxed preload exposing only bridge version `1` and static `capabilities()`; only `desktop` is supported. There is no generic IPC surface.
- `app://bundle/` secure custom protocol with strict URL/path resolution, navigation-only SPA fallback, CSP, `nosniff`, and no-referrer headers.
- Independent Rolldown outputs: one main ESM file and one preload CJS file.
- Explicit staging allowlist, SHA-256 build manifest, electron-builder configuration, ASAR integrity/fuse verification, and packaging contract tests.

## Explicit non-goals

DESK0 does not implement authentication/OIDC/credential storage, `PlatformPort` desktop adapters, Shared `RunClient`, durable Run recovery, updater, notifications, controlled downloads, deep links, a Rust Host, PTY, Git, local MCP, signing/notarization, installer E2E, or performance/soak acceptance. It does not construct or interpret Principal, API-key, Channel workload, active-tenant, or team-role semantics; those remain owned by EIM/backend contracts.

## Commands

```bash
npm run lint:desktop
npm run desktop:typecheck
npm run test:desktop
npm run build
npm run desktop:build
npm run desktop:stage
npm run desktop:verify:stage
```

Native unpacked-package verification must run on the target OS:

```bash
npm run desktop:package:dir
npm run desktop:verify:package
```

On macOS, `desktop:package:dir` intentionally uses an ad-hoc identity and disables hardened runtime for the local unpacked smoke artifact because fuse rewriting invalidates Electron's upstream signature. This is test-only. The release configuration keeps hardened runtime enabled and expects automatic Developer ID discovery; Developer ID signing and notarization have not been verified.

## Current native evidence

On 2026-08-13, a local macOS arm64 unpacked build using Node `24.4.1` / npm `11.5.1` completed the packaged smoke switch (`MULTIRAG_DESKTOP_SMOKE_OK`). Smoke mode alone uses a unique temporary profile and Chromium's mock keychain so that the test neither reads a real desktop profile nor blocks on macOS Keychain access; normal launches retain the production profile and cookie-encryption fuse path. This smoke therefore does not validate the real Keychain/cookie-encryption startup path. Verification reported 1,170 ASAR entries and 1,059 build-manifest files, no packaged `node_modules`, source maps, fallback `resources/app`, or `app.asar.unpacked`, exact manifest hashes, valid ASAR integrity metadata and hardened fuse states, and a passing `codesign --verify` for the local ad-hoc artifact. The local toolchain is not yet the release target recorded in `VERSION_BASELINE.md`; this is not evidence for release-toolchain alignment, Developer ID signing, notarization, Windows, installers, or production readiness.

The same smoke exposed one expected strict-CSP gap: the renderer's external Google Inter stylesheet is blocked, so the desktop shell uses the fallback font. A later renderer asset task should package the font locally; do not broaden the production CSP to trust a third-party font origin as a shortcut.

Authoritative architecture, roadmap, testing, and version status live in the [client-platform documentation](../docs/client-platform/README.md).
