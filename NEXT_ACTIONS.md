## Now

- [x] Complete the v1.0.5 implementation, regression tests, Electron upgrade, security checks, UI review, and packaging verification.
- [x] Prepare final installer/portable artifacts, checksums, release notes, upload aliases, and the release checklist.
- [x] Verify the real 3ds Max workflow and accept release of the current unsigned Windows artifacts.
- [x] Review, commit, and push the confirmed changes on `release/v1.0.5`.
- [x] Merge into `master`, create tag `1.0.5`, publish the GitHub Release, and verify both uploaded asset digests.
- [x] Add installer-only background auto-download progress and preserve the registered install directory plus existing data.
- [ ] Complete final packaging, replace all v1.0.5 GitHub auto-update assets, and verify remote digests.

## Handoff Notes

- Start here: Finish the `fix/v1.0.5-auto-update` release replacement and upload `latest.yml`, the NSIS installer, its blockmap, and the portable executable.
- Do not redo: Auto-update implementation, unit tests, packaged updater configuration, non-modal UI review, and registered install-location review are complete.
- Verify next: Rebuild after the final NSIS data-preservation change, then compare local and GitHub asset digests.
- Do not claim: The current Windows binaries are code-signed; they remain intentionally unsigned for this release.
