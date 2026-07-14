## Now

- [x] Complete and verify the original v1.0.5 feature set, including the real 3ds Max workflow and unsigned Windows packaging.
- [x] Commit, merge, tag, publish, and verify the original v1.0.5 release artifacts and documentation.
- [x] Add installer-only background auto-download progress and preserve the registered install directory plus existing data.
- [x] Complete final packaging, replace all v1.0.5 GitHub auto-update assets, and verify remote digests.
- [ ] Use the automatic updater when preparing the next version to validate a real 1.0.5-to-new-version background download and restart installation.

## Handoff Notes

- Start here: For the next release, build a version newer than 1.0.5 and exercise the complete installed-app download and restart path against the published GitHub assets.
- Do not redo: Auto-update implementation, unit tests, packaged updater configuration, non-modal UI review, install-location preservation, v1.0.5 asset replacement, and remote digest checks are complete.
- Verify next: Confirm an installed v1.0.5 downloads the next version in the background, preserves its registered path and data, then restarts into the new version.
- Do not claim: The current Windows binaries are code-signed; they remain intentionally unsigned for this release.
