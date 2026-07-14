const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function assertContains(source, text, label) {
    assert(
        source.includes(text),
        `${label} should contain ${JSON.stringify(text)}`
    );
}

assert.strictEqual(packageJson.version, '1.0.5', 'package version should be bumped for the new release');
assert.strictEqual(packageJson.scripts.test, 'node tests/v1.0.5-auto-update.test.js && node tests/mesh-path-resolution.test.js && node tests/v1.0.5-uv-controls.test.js && node tests/v1.0.5-max-navigation.test.js && node tests/v1.0.5-discoverability.test.js && node tests/drag-drop-behavior.test.js && node tests/v1.0.4-features.test.js && node tests/electron-smoke.test.js', 'npm test should run the regression suites');
assert(packageJson.build.files.includes('mesh-path.js'), 'mesh path resolver should be included in packaged builds');

assertContains(mainJs, "ipcMain.handle('get-file-info'", 'main process');
assertContains(mainJs, 'function getDraggableFbxPath(filePath)', 'main process drag-out validation');
assertContains(mainJs, "ipcMain.on('start-fbx-drag'", 'main process drag-out IPC');
assertContains(mainJs, 'if (!isTrustedSender(event)) return;', 'main process drag-out IPC');
assertContains(mainJs, "path.extname(resolvedPath).toLowerCase() !== '.fbx'", 'main process drag-out validation');
assertContains(mainJs, 'event.sender.startDrag({', 'main process native drag');
assertContains(mainJs, "sourceIcon.resize({ width: 32, height: 32, quality: 'best' })", 'main process drag icon sizing');
assertContains(mainJs, "ipcMain.handle('find-related-mesh-path'", 'main process mesh path IPC');
assertContains(preloadJs, 'startFbxDrag(filePath)', 'preload drag-out API');
assertContains(preloadJs, "ipcRenderer.send('start-fbx-drag', filePath)", 'preload drag-out IPC');
assertContains(preloadJs, "'find-related-mesh-path'", 'preload mesh path IPC');

assertContains(indexHtml, 'const THUMBNAIL_AUTO_GENERATE_LIMIT = 300;', 'renderer');
assertContains(indexHtml, 'function attachFbxDrag(element, item)', 'renderer drag-out helper');
assertContains(indexHtml, 'ipcRenderer.startFbxDrag(item.fullPath);', 'renderer drag-out helper');
assertContains(indexHtml, 'async function copyItemMeshPath()', 'renderer mesh path copy action');
assertContains(indexHtml, "ipcRenderer.invoke('find-related-mesh-path', fbxPath)", 'renderer shared mesh path lookup');
assertContains(indexHtml, 'div.oncontextmenu = (event) => showFileContextMenu(event, index, false);', 'list item context menu');
assertContains(indexHtml, '复制 .mesh 路径', 'file context menu');
assert.strictEqual(
    [...indexHtml.matchAll(/attachFbxDrag\((?:div|gi), item\);/g)].length,
    2,
    'list and grid items should both support native drag-out'
);
assertContains(indexHtml, 'let temporaryDroppedFbxItem = null;', 'renderer');
assertContains(indexHtml, 'function isFbxFile(file)', 'renderer');
assertContains(indexHtml, 'async function loadDroppedFbx(file)', 'renderer');
assertContains(indexHtml, 'function shouldAutoGenerateThumbnails(totalCount)', 'renderer');
assertContains(indexHtml, 'function getThumbnailBatchLimit(totalCount)', 'renderer');
assertContains(indexHtml, 'function renderThumbnailPauseControls(totalCount)', 'renderer');
assertContains(indexHtml, 'function generatePausedThumbnails(loadAll, skipConfirm)', 'renderer');
assertContains(indexHtml, 'let thumbnailObserver = null;', 'renderer');
assertContains(indexHtml, 'function setupLazyThumbnailObserver()', 'renderer');
assertContains(indexHtml, 'function observeThumbnailItem(gridItem, item, index)', 'renderer');
assertContains(indexHtml, 'function selectModelItem(item)', 'renderer');
assertContains(indexHtml, 'function queueThumbnailItem(item, id)', 'renderer');
assertContains(indexHtml, 'function isThumbnailTargetCurrent(id, item)', 'renderer');
assertContains(indexHtml, 'function checkThumbnailCacheBeforeQueue(item, id)', 'renderer');
assertContains(indexHtml, '缩略图正在生成中，请等待当前队列完成后再批量生成。', 'renderer');
assertContains(indexHtml, 'new IntersectionObserver', 'renderer');
assertContains(indexHtml, '生成前 300', 'renderer');
assertContains(indexHtml, '生成全部', 'renderer');
assertContains(indexHtml, 'async function loadModel(identifier, options = {})', 'renderer');
assertContains(indexHtml, 'options.absolutePath', 'renderer');
assertContains(indexHtml, "ipcRenderer.invoke('create-local-file-url'", 'renderer');

const dropHandlerStart = indexHtml.indexOf("container.addEventListener('drop'");
assert(dropHandlerStart !== -1, 'drop handler should exist');

const dropHandlerEnd = indexHtml.indexOf('});', dropHandlerStart);
const dropHandler = indexHtml.slice(dropHandlerStart, dropHandlerEnd);
const fbxBranchIndex = dropHandler.indexOf('isFbxFile');
const uvGuardIndex = dropHandler.indexOf('!isUVMode');

assert(fbxBranchIndex !== -1, 'drop handler should check for FBX files');
assert(uvGuardIndex !== -1, 'drop handler should keep the UV texture guard');
assert(fbxBranchIndex < uvGuardIndex, 'FBX files should be handled before the UV texture guard');

const regenerateStart = indexHtml.indexOf('function regenerateAllThumbnails()');
assert(regenerateStart !== -1, 'manual thumbnail regeneration should exist');
const regenerateBlock = indexHtml.slice(regenerateStart, indexHtml.indexOf('let autoFixQueue', regenerateStart));
assert(regenerateBlock.includes('generatePausedThumbnails(true, true)'), 'manual thumbnail regeneration should use the explicit large-batch path without double confirmation');

const selectByIndexStart = indexHtml.indexOf('function selectFileByIndex(index)');
assert(selectByIndexStart !== -1, 'selectFileByIndex should exist');
const selectByIndexBlock = indexHtml.slice(selectByIndexStart, indexHtml.indexOf('function initMaterials', selectByIndexStart));
assert(selectByIndexBlock.includes('selectModelItem(item)'), 'index-based selection should use the same absolute-path-aware loader as clicks');

const processThumbStart = indexHtml.indexOf('function processThumbQueue()');
assert(processThumbStart !== -1, 'thumbnail queue processor should exist');
const processThumbBlock = indexHtml.slice(processThumbStart, indexHtml.indexOf('function handleWebFiles', processThumbStart));
assert(processThumbBlock.includes('isThumbnailTargetCurrent(id, item)'), 'thumbnail writes should verify the DOM target still belongs to the queued item');

console.log('drag-drop behavior checks passed');
