## Current Snapshot

- Last Updated: 2026-07-14
- Branch: `fix/v1.0.5-auto-update`
- Worktree: Dirty with the authorized v1.0.5 installer auto-update replacement.
- Superpowers Phase: Not active for this release.
- Superpowers Plan: None; existing plans describe earlier releases and features.
- Goal: Replace the undownloaded v1.0.5 installer with a build that supports non-blocking automatic downloads while preserving the old install directory and data.
- Phase: Rebuilding and verifying the v1.0.5 release replacement.
- Result: The installed build uses `electron-updater` to download future versions in the background with visible progress and a deferred restart action. Portable builds remain manual. NSIS keeps the registered 1.0.4 installation directory, preserves AppData, and protects an install-adjacent `FBX_Data` during replacement.
- Dependencies: Electron 43.1.0, electron-builder 26.15.3, and electron-updater 6.8.9; `npm audit` reports zero vulnerabilities.
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
- Release commit: `5645e38088920d54ccaac2819d22a95e13377a17`.
- Tag: `1.0.5`, pointing to the release commit.
- GitHub Release: `https://github.com/Cherofre/fbx-quick-viewer/releases/tag/1.0.5` (published, not draft or prerelease).
- GitHub latest-release API returns `1.0.5`; both uploaded asset SHA-256 digests match the local installer and portable executable.
- Browser UI review at 1280×800 verified the help dialog, F1 shortcut, list/grid hover affordances, shared “⋯” menu, one-time hint persistence, UV hint, selected-model `.mesh` button, and toast feedback without overlap.
- Browser interaction simulation verified middle-button pan changes the controls target while preserving the camera offset, then pressing Alt during the same drag preserves the target and changes the camera offset for rotation.
- Browser UI review verified first-run choices persist (`.mesh`, navigation mode, list/grid view, help), preferences reopen from a dedicated gear button, operation mode uses stable segmented controls, search is below sorting, the compact `M` button aligns with other path actions, and update release notes render in a bounded dialog.
- Browser UI review verified changed UV values expose a compact `↶` reset action beside the persistent `↔` drag cue. The U field and row remain exactly `18px` before and after the reset action becomes visible, while the reserved button remains `16px`. Search focus uses a muted amber `rgb(169,143,73)` border, returns to `rgb(85,85,85)`, and moves focus to `BODY` after a canvas click.
- Auto-update unit checks verify installed/portable capability gating, background progress state, silent restart installation arguments, stable GitHub publish metadata, and data-preserving NSIS hooks.
- Browser review at 1280×800 verified the bottom-right download progress and downloaded states do not block canvas interaction; update details use a non-modal dialog.
- Packaged `app-update.yml` targets `Cherofre/fbx-quick-viewer`; generated `latest.yml` points to `fbx-quick-viewer.Setup.1.0.5.exe` and the installer blockmap is produced.
- electron-builder's NSIS upgrade path reads HKCU/HKLM `InstallLocation` and assigns the previous directory to `$INSTDIR` before installing.
- Final replacement packaged smoke exited with code `0` after `5.54` seconds.
- Installer SHA-256: `CDBEF4EFF8EB60395CBFBE1BAFB2CAEAC8436B12A0EEB626CF4270C88C93BE01`.
- Portable SHA-256: `FCE9B48B334F2A5DF77DACADEDF380A3D5AE199ADC6A86BF385893FED6B008CE`.
- `latest.yml` SHA-256: `EC60EB3D21BD988A92FBB29E57198955905B37DA76EB4C674D97F4965E7F81DF`.
- Installer blockmap SHA-256: `63258ABE3890CFA6D9ECC333E184C1F35B8BD29734D8057E465915690D268AD8`.

## Risks

- 3ds Max controls whether dropping an FBX opens an import dialog.
- Windows blocks drag-and-drop from a lower-integrity process into an elevated 3ds Max process.
- Three.js r128 and the vendored loaders remain old and should be upgraded only with model-rendering regression coverage.
- Several non-drag IPC handlers do not yet apply `isTrustedSender` consistently; current navigation and preload restrictions reduce exposure, but a future hardening pass is recommended.
- Thumbnail and settings paths still use synchronous main-process file IO, which may cause brief stalls on slow disks.
- The installer, portable executable, and unpacked application executable are unsigned; Windows may show an unknown-publisher or SmartScreen warning.
