## Active Decisions

### Add automatic downloads to the v1.0.5 installer

- Status: active
- Date: 2026-07-14
- Decision: Replace the undownloaded v1.0.5 installer asset with a build that uses `electron-updater` for non-blocking background downloads. Portable builds remain manual-download only.
- Reason: The user expects the installed application to download updates directly instead of only opening GitHub. Existing v1.0.5 release assets had zero downloads, so correcting the same release avoids leaving an obsolete installer in circulation.

### Preserve the previous install location and data during updates

- Status: active
- Date: 2026-07-14
- Decision: Keep the existing app identity and NSIS install mode so upgrades reuse the registered `InstallLocation`. Preserve AppData and move an install-adjacent `FBX_Data` to a same-volume backup before the old files are removed, then restore it after installation.
- Reason: Users may install outside the default directory and may keep runtime cache beside the executable. Updates must not ask them to locate the old folder or discard existing data.

### Release the verified unsigned v1.0.5 artifacts

- Status: active
- Date: 2026-07-14
- Decision: Publish the current installer and portable executable after the user's real 3ds Max verification, without adding code signing in this release.
- Reason: The user explicitly authorized merging and publishing v1.0.5 after validating the Max workflow. Code signing remains a future release improvement; the unsigned status is documented in the release checklist and project risks.

### v1.0.5 is a focused patch release

- Status: active
- Date: 2026-07-13
- Decision: Complete and harden the existing Electron native file drag implementation without adding a 3ds Max plugin or silent-import bridge.
- Reason: The requested behavior is equivalent to dragging a real FBX from Explorer. Electron `webContents.startDrag()` already provides that Windows-native file payload.

### Real-file drag remains single-file

- Status: active
- Date: 2026-07-13
- Decision: Drag one model item at a time in v1.0.5.
- Reason: The current viewer has no multi-selection model, and adding one would expand the release beyond the requested scope.

### Upgrade the Electron release toolchain

- Status: active
- Date: 2026-07-13
- Decision: Upgrade Electron from 28 to 43.1.0 and electron-builder from 24 to 26.15.3 in v1.0.5.
- Reason: The release audit reported 11 high-severity dependency findings, including the direct Electron runtime. The upgraded dependency tree passes existing smoke and packaging checks and reports zero known vulnerabilities.

### Defer Three.js upgrade

- Status: active
- Date: 2026-07-13
- Decision: Keep the vendored Three.js r128 stack unchanged in v1.0.5.
- Reason: Loader and rendering changes can alter FBX parsing, materials, UVs, animation, and thumbnail output. That upgrade needs a dedicated model fixture matrix rather than being bundled into the drag-out patch.

### Resolve `.mesh` files by walking parent directories

- Status: active
- Date: 2026-07-13
- Decision: For a selected FBX, check for a same-name `.mesh` in the FBX directory first, then walk upward one directory at a time until the drive root.
- Reason: The production tree contains both same-directory pairs and layouts such as `xxx/fbx/model.fbx` with `xxx/model.mesh`. Direct ancestor checks are deterministic and avoid an expensive recursive search across the full asset tree.

### Keep UV history at interaction granularity

- Status: active
- Date: 2026-07-13
- Decision: Record one undo entry per drag, direct-input edit, checkbox change, individual reset, or full reset, with a 50-entry limit.
- Reason: Recording every mousemove would make `Ctrl+Z` noisy and memory-heavy. Interaction-level history lets one shortcut undo the complete adjustment the user just made.

### Start the app after all renderer declarations

- Status: active
- Date: 2026-07-13
- Decision: Invoke `initApp()` at the end of the renderer script, after configuration constants, state, functions, and event handlers are initialized.
- Reason: Starting midway through the script allowed synchronous initialization to access a later `const` in its temporal dead zone, stopping before `animate()` and disabling continuous rendering and mouse camera updates.

### Teach hidden actions contextually

- Status: active
- Date: 2026-07-14
- Decision: Keep expert shortcuts and right-click actions, while adding visible hover affordances, a compact `?` / `F1` quick reference, and dismissible one-time hints.
- Reason: The tool is shared with first-time users, but permanent tutorials or large onboarding modals would reduce model-list and viewport space for daily users.

### Make headless smoke independent of hidden-window frame throttling

- Status: active
- Date: 2026-07-14
- Decision: In Electron smoke, verify the initial rendered frame and scheduled animation callback instead of requiring hidden-window frame advancement after a fixed delay.
- Reason: Chromium may suspend `requestAnimationFrame` for a hidden BrowserWindow. The new assertion still catches initialization failures without treating platform background throttling as a product regression.

### Keep first-run setup short and editable

- Status: active
- Date: 2026-07-14
- Decision: Ask for `.mesh` visibility, navigation mode, resource view, and whether to open help in one compact first-run dialog; expose the same choices again from a dedicated gear button in the directory bar.
- Reason: New users need a clear starting configuration, while experienced users should not face repeated onboarding or be locked into their first choices.

### Switch Max middle-button behavior inside OrbitControls

- Status: active
- Date: 2026-07-14
- Decision: Extend the vendored OrbitControls mouse state so a held middle-button drag can switch between pan and rotate when Alt changes.
- Reason: Remapping `mouseButtons.MIDDLE` on keydown only affects future presses because OrbitControls stores the active drag state privately at pointer-down time.

### Display release notes as untrusted text

- Status: active
- Date: 2026-07-14
- Decision: Return a bounded GitHub Release body through IPC and display it with `textContent` in the update dialog.
- Reason: Users need the update summary before opening the release page, and treating remote release content as plain text avoids executing HTML or script from the network response.

### Reveal UV gestures without permanent instructions

- Status: active
- Date: 2026-07-14
- Decision: Keep a subtle `↔` on each U/V scrub label and show a compact `↶` reset action only when that value differs from its default.
- Reason: The controls need to teach horizontal dragging and individual reset at the point of use without adding a permanent instruction block to the already dense UV panel.
