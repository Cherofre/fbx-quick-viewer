## Now

- [x] Create `release/v1.0.6` and update the package, lockfile, README, changelog, release notes, checklist, decisions, and project status.
- [x] Pass all automated tests, the multi-window Electron smoke, dependency audit, packaging, asar inspection, update metadata validation, and artifact digest checks.
- [ ] Install the final 1.0.6 NSIS package and verify Explorer opens in both current-window and new-window modes.
- [ ] Verify the final window-restore black-frame mitigation and confirm existing data plus the previous install directory are preserved.
- [ ] Commit the release candidate, merge it to `master`, create tag `1.0.6`, push, and publish the four release assets.
- [ ] From an installed 1.0.5, validate background download, progress UI, restart installation, preserved data, and successful launch into 1.0.6.

## Handoff Notes

- Start here: Install `dist/fbx-quick-viewer.Setup.1.0.6.exe`, then test Explorer current-window/new-window opens and the restored-window visual transition.
- Do not redo: Version bump, dependency security remediation, automated tests, Electron multi-window smoke, final packaging, asar inspection, SHA-512 validation, and SHA-256 calculation are complete.
- Verify next: After local manual checks, commit `release/v1.0.6`; after publishing, exercise the real installed 1.0.5 automatic-update path.
- Do not claim that the final installer behavior, black-frame mitigation, or 1.0.5-to-1.0.6 update has been manually verified; those checks are still pending. The Windows binaries also remain unsigned.
