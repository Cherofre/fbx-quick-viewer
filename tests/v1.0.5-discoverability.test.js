const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function assertContains(text, label) {
    assert(indexHtml.includes(text), `renderer should contain ${label}: ${JSON.stringify(text)}`);
}

assertContains('id="help-btn"', 'visible help button');
assertContains('id="help-dialog"', 'compact help dialog');
assertContains('function showHelp()', 'help dialog controller');
assertContains("if (e.key === 'F1')", 'F1 help shortcut');
assertContains('随时按 F1 再次打开此页。', 'persistent help reminder');

assertContains('class="item-drag-affordance"', 'list drag affordance');
assertContains("dragAffordance.textContent = '拖到 Max';", 'grid drag affordance');
assertContains('class="item-actions-button"', 'list item actions button');
assertContains('.grid-fav-icon { right: 5px; }', 'grid favorite restored to the top-right corner');
assertContains('left: 5px;\n            bottom: 29px;', 'grid actions moved away from the favorite');
assertContains("actionBtn.onclick = (event) => openItemActions(event, index, false);", 'list action routing');
assertContains("actionBtn.onclick = (event) => openItemActions(event, index, true);", 'grid action routing');
assertContains('function showFileContextMenuAt(index, isGridMode, pageX, pageY)', 'shared actions menu positioning');

assertContains('id="copy-mesh-path-btn"', 'current model mesh path button');
assertContains('aria-label="复制关联 .mesh 路径">M</button>', 'compact mesh path button');
assertContains('async function copyCurrentMeshPath()', 'current model mesh copy action');
assertContains('async function copyRelatedMeshPath(fbxPath, itemName)', 'shared mesh copy behavior');
assertContains("ipcRenderer.invoke('find-related-mesh-path', fbxPath)", 'mesh lookup IPC reuse');

assertContains("folderActions: 'fbx_hint_folder_actions_v1'", 'one-time folder hint key');
assertContains("uvControls: 'fbx_hint_uv_controls_v1'", 'one-time UV hint key');
assertContains("localStorage.getItem(storageKey) === '1'", 'one-time hint read');
assertContains("localStorage.setItem(activeCoachmark.storageKey, '1')", 'dismissed hint storage');
assertContains('if (files.length > 0) showFolderActionsHint();', 'folder hint trigger');
assertContains("if (currentBaseType === 'uv') showUVControlsHint();", 'UV hint trigger');

assertContains('function showToast(message, type =', 'toast feedback');
assertContains("showToast('FBX 路径已复制');", 'FBX copy success feedback');
assertContains("showToast('.mesh 路径已复制');", 'mesh copy success feedback');
assertContains("showToast(`未找到同名 .mesh：${itemName || '当前模型'}`, 'error');", 'mesh lookup failure feedback');

assert(
    indexHtml.indexOf('id="search-container"') < indexHtml.indexOf('id="file-list"'),
    'search should appear directly above the model list'
);
assertContains('id="update-dialog"', 'release notes dialog');
assertContains("document.getElementById('update-release-notes').textContent", 'safe text-only release notes rendering');
assertContains('id="first-run-dialog"', 'first-run preferences dialog');
assertContains("firstRunComplete: 'fbx_first_run_setup_v1'", 'first-run completion storage');
assertContains("meshActionsEnabled: 'fbx_mesh_actions_enabled'", 'mesh action preference storage');
assertContains('function showFirstRunSetupIfNeeded()', 'first-run setup gate');
assertContains('await showFirstRunSetupIfNeeded();', 'startup waits for first-run choices');
assertContains('function applyMeshActionPreference()', 'mesh action visibility preference');
assertContains('controls.enableMaxStyleMiddleButton = true;', 'saved Max navigation preference');
assertContains("input[name=\"setup-view-mode\"]", 'list/grid first-run choice');
assertContains('id="settings-btn"', 'visible preferences button');
assertContains('onclick="showPreferencesDialog(true)"', 'reopenable preferences');
assertContains('name="setup-nav-mode" value="default"', 'default navigation segment');
assertContains('name="setup-nav-mode" value="max"', 'Max navigation segment');
assert(!indexHtml.includes('<select id="setup-nav-mode"'), 'first-run navigation should avoid the flickering native dropdown');
assert(!indexHtml.includes('help-footer-actions'), 'help footer should not look like a second preferences step');
assertContains('#search-input:focus { background: #404040; border-color: #a98f49; }', 'subtle amber search focus style');
assertContains("document.activeElement === searchInput && !event.target.closest('#search-container')", 'search blur outside its container');

console.log('v1.0.5 discoverability checks passed');
