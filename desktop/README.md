# MultiRAG Desktop Foundation (CLP-DESK0 + CLP-DX1)

This directory contains the non-release Electron foundation around the existing React/Vite renderer. CLP-DESK0 established the secure shell; CLP-DX1 adds the validated Desktop composition, Workbench, native command menu, and Renderer Bridge v2. The Web application remains the only production product and continues to build independently.

## Implemented foundation

- Electron main process with global sandboxing, a locked-down `BrowserWindow`, deny-by-default permissions/downloads, and blocked popups, webviews, and untrusted navigation.
- Sandboxed preload exposing Renderer Bridge version `2`, immutable capabilities, and only the allowlisted main → Renderer command subscription. `desktop` and `nativeMenu` are supported; updater, notifications, local Agent, PTY, and local MCP remain unsupported. There is no generic IPC surface.
- `app://bundle/` secure custom protocol with strict URL/path resolution, navigation-only SPA fallback, CSP, `nosniff`, and no-referrer headers.
- Separate Web/Desktop composition roots sharing one Application, Router, page set, and business components. Desktop uses a compact auth frame and a task-oriented Activity Rail + context panel + Workspace layout.
- One product command registry drives the command palette, Renderer shortcuts, Desktop toolbar, and the macOS/Windows native application menu. Product commands use a fixed enum; preload strips Electron events and filters unknown IDs.
- A versioned network policy generated from the same production-mode `VITE_API_BASE_URL`, `VITE_ADMIN_API_BASE_URL`, and `VITE_WS_BASE_URL` inputs as the Renderer. Remote connections require exact HTTPS/WSS origins; insecure HTTP/WS is accepted only for exact loopback origins used during local development.
- Independent Rolldown outputs: one main ESM file and one preload CJS file.
- Explicit staging allowlist, SHA-256 build manifest, electron-builder configuration, ASAR integrity/fuse verification, and packaging contract tests.

## Explicit non-goals

DX1 reuses the existing Web password-login flow for local integration, but does not implement desktop-native OIDC, `safeStorage`, refresh-token hardening, or a desktop auth adapter. The shared Renderer still persists credentials in `localStorage`, so this artifact is not suitable for production distribution. DX1 also does not implement Shared `RunClient`, durable Run recovery, updater, notifications, controlled downloads, deep links, a Rust Host, PTY, Git, local MCP, signing/notarization, installer E2E, or performance/soak acceptance. It does not construct or interpret Principal, API-key, Channel workload, active-tenant, or team-role semantics; those remain owned by EIM/backend contracts.

## Local use

Configure the public backend origins in the ignored `.env.local` file before building. For the current local MultiRAG ports:

```env
VITE_API_BASE_URL=http://127.0.0.1:8123
VITE_ADMIN_API_BASE_URL=http://127.0.0.1:8130
VITE_WS_BASE_URL=ws://localhost:8123
```

Then build the Renderer and shell from the same environment, stage, package, and open the artifact:

```bash
npm run build:desktop
npm run desktop:verify:stage
npm run desktop:package:dir

# macOS arm64 local artifact
open desktop/.out/artifacts/mac-arm64/MultiRAG.app
```

Changing any endpoint requires rebuilding and restaging; the package deliberately does not read `.env.local` at runtime. A Vite build receipt makes staging fail if `dist/` was built with different network inputs. The selected public origins are compiled into the Renderer and recorded in `build-manifest.json`, while both the receipt and `.env.local` are excluded from the package. Start the API service before logging in. On Windows, run the native package command on Windows and launch the generated `MultiRAG.exe` under `desktop/.out/artifacts/win-*-unpacked/`.

## Commands

```bash
npm run lint:desktop
npm run desktop:typecheck
npm run test:client-platform
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

On 2026-08-13, the DESK0 baseline produced a local macOS arm64 unpacked build using Node `24.4.1` / npm `11.5.1` and completed the packaged smoke switch (`MULTIRAG_DESKTOP_SMOKE_OK`). Smoke mode alone uses a unique temporary profile and Chromium's mock keychain so that the test neither reads a real desktop profile nor blocks on macOS Keychain access; normal launches retain the production profile and cookie-encryption fuse path. This historical smoke waited for DOM readiness and therefore is not DX1 evidence for `data-client-runtime="desktop"`. Verification reported 1,170 ASAR entries and 1,059 build-manifest files, no packaged `node_modules`, source maps, fallback `resources/app`, or `app.asar.unpacked`, exact manifest hashes, valid ASAR integrity metadata and hardened fuse states, and a passing `codesign --verify` for the local ad-hoc artifact. A separate no-credential probe from that packaged Renderer to the configured login origin observed an `OPTIONS 200` preflight followed by `POST 200`, proving that the exact-origin CSP reaches the local API without granting broad HTTP access. This is a transport-boundary check, not a complete LoginPage/auth/session E2E. The local toolchain is not yet the release target recorded in `VERSION_BASELINE.md`; this is not evidence for release-toolchain alignment, Developer ID signing, notarization, Windows, installers, or production readiness.

DX1's final `3535fae` macOS arm64 directory app passed the fixed `data-client-runtime="desktop"` readiness probe, package verification and a synthetic network reachability check; same-revision visual evidence covers Web/Desktop auth, 1440/960 Workbench, light/dark themes and English UI. Exact hashes, commands and unverified boundaries are recorded in [`DX1_EXIT_REPORT.md`](../docs/client-platform/DX1_EXIT_REPORT.md). This remains internal evidence, not release signing, notarization, Windows, real-auth, or desktop-MVP evidence.

The same smoke exposed one expected strict-CSP gap: the renderer's external Google Inter stylesheet is blocked, so the desktop shell uses the fallback font. A later renderer asset task should package the font locally; do not broaden the production CSP to trust a third-party font origin as a shortcut.

Authoritative architecture, roadmap, testing, and version status live in the [client-platform documentation](../docs/client-platform/README.md).
