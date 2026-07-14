## Now

- [x] Complete the v1.0.5 implementation, regression tests, Electron upgrade, security checks, UI review, and packaging verification.
- [x] Prepare final installer/portable artifacts, checksums, release notes, upload aliases, and the release checklist.
- [x] Verify the real 3ds Max workflow and accept release of the current unsigned Windows artifacts.
- [ ] Review and commit the confirmed changes on `release/v1.0.5`.
- [ ] Merge into `master`, create tag `1.0.5`, and prepare then verify the GitHub Draft Release.

## Handoff Notes

- Start here: Follow `RELEASE_CHECKLIST_v1.0.5_CN.md`, beginning with the real 3ds Max drag test and signature-risk decision.
- Do not redo: Implementation, automated tests, dependency audit, discoverability browser review, and v1.0.5 installer/portable packaging are complete.
- Verify next: Confirm Max drag behavior, try “复制 .mesh 路径”, check UV drag/undo feel, and decide whether unsigned binaries are acceptable for this release.
- Do not claim: Real 3ds Max import behavior is not verified on this machine, and the current Windows binaries are not code-signed.
