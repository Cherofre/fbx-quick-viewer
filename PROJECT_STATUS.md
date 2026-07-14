## Current Snapshot

- Last Updated: 2026-07-14
- Branch: `release/v1.0.5`
- Worktree: Dirty with uncommitted v1.0.5 release changes and new release-ledger files.
- Superpowers Phase: Not active for this release.
- Superpowers Plan: None; existing plans describe earlier releases and features.
- Goal: Ship v1.0.5 with reliable native FBX drag-out to 3ds Max from list and grid views.
- Phase: Release authorized; preparing commit, merge, tag, and GitHub Release.
- Result: Native single-FBX drag-out is implemented for list and grid views with a 32×32 icon, trusted-sender validation, and file validation. File context menus and the selected-model path bar can copy a related same-name `.mesh` path. Discoverability includes a `?` / `F1` Chinese quick reference, first-run preferences, hover affordances, UV drag/reset cues, one-time hints, and toast feedback. The grid favorite/action layout, search placement, and search focus behavior are refined. Max navigation can switch between middle-button pan and Alt+middle rotate during an active drag. Update checks display GitHub Release notes safely as text.
- Dependencies: Electron 43.1.0 and electron-builder 26.15.3; `npm audit` reports zero vulnerabilities.
- External verification: The user confirmed the packaged v1.0.5 drag-out behavior in a real 3ds Max workflow on 2026-07-14.

## Verification Evidence

- `npm test`: passed on Electron 43.1.0.
- `npm run pack`: passed with electron-builder 26.15.3.
- `npm run dist`: produced the v1.0.5 NSIS installer and portable executable.
- Packaged `app.asar`: version, drag IPC, preload API, and inline script syntax verified.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Final verification rerun on 2026-07-14: all `npm test` suites passed and the dependency audit again reported zero vulnerabilities.
- Real project path check: `0mmf/fbx/test_liexi_002.fbx` resolves to `0mmf/test_liexi_002.mesh`.
- Electron smoke verifies UV tiling `0`, undo back to `0`, and redo to `1.25` against the initialized material.
- Electron smoke verifies an initial 3D frame rendered and the continuous animation callback was scheduled; the smoke now uses an isolated Chromium user-data directory and waits for graceful process exit.
- Packaged-app manual check: a production FBX displayed immediately, and a viewport mouse drag rotated both the model and ViewCube.
- Final portable artifact smoke: `dist/fbx-quick-viewer.1.0.5.exe` exited with code `0` after `12.91` seconds and left no viewer process running.
- Real 3ds Max verification: passed according to the user's production-machine test; release of the current unsigned artifacts was explicitly authorized.
- Browser UI review at 1280×800 verified the help dialog, F1 shortcut, list/grid hover affordances, shared “⋯” menu, one-time hint persistence, UV hint, selected-model `.mesh` button, and toast feedback without overlap.
- Browser interaction simulation verified middle-button pan changes the controls target while preserving the camera offset, then pressing Alt during the same drag preserves the target and changes the camera offset for rotation.
- Browser UI review verified first-run choices persist (`.mesh`, navigation mode, list/grid view, help), preferences reopen from a dedicated gear button, operation mode uses stable segmented controls, search is below sorting, the compact `M` button aligns with other path actions, and update release notes render in a bounded dialog.
- Browser UI review verified changed UV values expose a compact `↶` reset action beside the persistent `↔` drag cue. The U field and row remain exactly `18px` before and after the reset action becomes visible, while the reserved button remains `16px`. Search focus uses a muted amber `rgb(169,143,73)` border, returns to `rgb(85,85,85)`, and moves focus to `BODY` after a canvas click.
- Installer SHA-256: `D454D4F98DECB04C9A39CB1A79DE2584645BC7DF7580EFF01F04AC52FB826D21`.
- Portable SHA-256: `39F7CCD18726FA04CA4FCC3891DEBCD3D57AE2C22C465A695D527B69651E2731`.
- Release upload aliases: `dist/fbx-quick-viewer.Setup.1.0.5.exe` and `dist/fbx-quick-viewer.1.0.5.exe`, matching the v1.0.4 asset naming convention.

## Risks

- 3ds Max controls whether dropping an FBX opens an import dialog.
- Windows blocks drag-and-drop from a lower-integrity process into an elevated 3ds Max process.
- Three.js r128 and the vendored loaders remain old and should be upgraded only with model-rendering regression coverage.
- Several non-drag IPC handlers do not yet apply `isTrustedSender` consistently; current navigation and preload restrictions reduce exposure, but a future hardening pass is recommended.
- Thumbnail and settings paths still use synchronous main-process file IO, which may cause brief stalls on slow disks.
- The installer, portable executable, and unpacked application executable are unsigned; Windows may show an unknown-publisher or SmartScreen warning.
