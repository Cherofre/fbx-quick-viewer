## Now

- [x] Complete the v1.0.5 implementation, regression tests, Electron upgrade, security checks, UI review, and packaging verification.
- [x] Prepare final installer/portable artifacts, checksums, release notes, upload aliases, and the release checklist.
- [x] Verify the real 3ds Max workflow and accept release of the current unsigned Windows artifacts.
- [x] Review, commit, and push the confirmed changes on `release/v1.0.5`.
- [x] Merge into `master`, create tag `1.0.5`, publish the GitHub Release, and verify both uploaded asset digests.
- [ ] Monitor release feedback and plan code signing plus deferred IPC/Three.js hardening for a future version.

## Handoff Notes

- Start here: Review user feedback from the published v1.0.5 Release before planning the next version.
- Do not redo: Implementation, testing, packaging, Max verification, merge, tag, upload, and remote digest checks are complete.
- Verify next: On a separate older installation, optionally confirm the in-app update dialog resolves v1.0.5 and opens the published page.
- Do not claim: The current Windows binaries are code-signed; they remain intentionally unsigned for this release.
