## Now

- [x] Create `release/v1.0.6` and update the package, lockfile, README, changelog, release notes, checklist, decisions, and project status.
- [x] Pass all automated tests, the multi-window Electron smoke, dependency audit, packaging, asar inspection, update metadata validation, and artifact digest checks.
- [x] Commit the local release candidate on `release/v1.0.6` as `13acc29`.
- [x] Fast-forward `master`, retain `release/v1.0.6`, create annotated tag `1.0.6`, and push all refs.
- [x] Publish the v1.0.6 GitHub Release with the installer, portable executable, `latest.yml`, and blockmap.
- [x] Verify GitHub's latest-release API and all four remote artifact digests.
- [ ] Install the final 1.0.6 NSIS package and verify Explorer opens in both current-window and new-window modes.
- [ ] Verify the final window-restore black-frame mitigation and confirm existing data plus the previous install directory are preserved.
- [ ] From an installed 1.0.5, validate background download, progress UI, restart installation, preserved data, and successful launch into 1.0.6.

## Handoff Notes

- Start here: From an installed 1.0.5, exercise the now-live background update to 1.0.6, including restart installation and data/install-directory preservation.
- Do not redo: Version bump, dependency security remediation, automated tests, Electron multi-window smoke, final packaging, asar inspection, digest validation, Git merge/tag/push, and GitHub publishing are complete.
- Verify next: Exercise the real installed 1.0.5 automatic-update path, then optionally repeat Explorer current-window/new-window opens with the final installer and observe the restored-window visual transition.
- Do not claim that the final installer behavior, black-frame mitigation, or 1.0.5-to-1.0.6 update has been manually verified; those checks are still pending. The Windows binaries also remain unsigned.
