# Drag FBX Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1.0.3 with direct FBX drag-and-drop preview and guardrails for very large model folders.

**Architecture:** Keep the existing single-page Electron renderer. Add a focused drop handler that routes `.fbx` files to model loading before the UV texture path, and add a temporary dragged item at the top of the existing sidebar without replacing the scanned folder. Add a thumbnail auto-generation threshold so huge folders do not start thousands of model loads automatically.

**Tech Stack:** Electron, Three.js, vanilla JavaScript, Node.js test scripts.

---

### Task 1: Regression Tests

**Files:**
- Create: `tests/drag-drop-behavior.test.js`
- Modify: `package.json`

- [x] Write a Node.js test that reads `index.html`, `main.js`, and `package.json`.
- [x] Assert that the renderer contains `THUMBNAIL_AUTO_GENERATE_LIMIT`, `temporaryDroppedFbxItem`, `loadDroppedFbx`, `isFbxFile`, and a `loadModel` absolute-path option.
- [x] Assert that the drop handler checks for FBX before the UV texture guard.
- [x] Assert that `main.js` exposes `get-file-info` for dropped absolute file paths.
- [x] Assert that `package.json` version is `1.0.3`.
- [x] Run `npm test` and confirm it fails before implementation.

### Task 2: Dragged FBX Preview

**Files:**
- Modify: `index.html`
- Modify: `main.js`

- [x] Add `ipcMain.handle('get-file-info')` to return name, fullPath, mtime, and type for an existing `.fbx` file.
- [x] Add `temporaryDroppedFbxItem` state to the renderer.
- [x] Add `isFbxFile(file)` and `loadDroppedFbx(file)` helpers.
- [x] Update `setupDragAndDrop()` so `.fbx` drops load as models before UV texture handling.
- [x] Update `renderFileList()` so the temporary item appears at the top while preserving the existing folder list.
- [x] Update `loadModel()` to accept `{ absolutePath }` for dropped FBX files.

### Task 3: Large Folder Guardrail And Lazy Thumbnails

**Files:**
- Modify: `index.html`

- [x] Add `THUMBNAIL_AUTO_GENERATE_LIMIT = 300`.
- [x] In grid rendering, keep automatic full-list thumbnail generation only when the filtered list length is within the limit.
- [x] For larger lists, use `IntersectionObserver` to queue thumbnails only when grid items approach the visible scroll area.
- [x] Show a concise progress message explaining that scroll lazy loading is active.
- [x] Leave manual thumbnail commands available, including explicit large-batch generation after confirmation.

### Task 4: Version and Verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [x] Bump version to `1.0.3`.
- [x] Document drag-and-drop FBX preview and large-folder thumbnail protection.
- [x] Run `npm test`.
- [x] Run `npm ls --depth=0`.
- [x] Report changed files, branch name, and verification output.
