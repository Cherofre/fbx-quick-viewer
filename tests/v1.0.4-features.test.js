const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preloadJsPath = path.join(root, 'preload.js');
const agentsMd = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function assertContains(source, text, label) {
    assert(source.includes(text), `${label} should contain ${JSON.stringify(text)}`);
}

function assertNotContains(source, text, label) {
    assert(!source.includes(text), `${label} should not contain ${JSON.stringify(text)}`);
}

assert.strictEqual(packageJson.version, '1.0.5', 'package version should match the current release');
assert.strictEqual(packageJson.author, 'Cherofre', 'package author should not use template metadata');
assert.strictEqual(packageJson.scripts.test, 'node tests/mesh-path-resolution.test.js && node tests/v1.0.5-uv-controls.test.js && node tests/v1.0.5-max-navigation.test.js && node tests/v1.0.5-discoverability.test.js && node tests/drag-drop-behavior.test.js && node tests/v1.0.4-features.test.js && node tests/electron-smoke.test.js', 'npm test should run regression and smoke suites');
assert(fs.existsSync(preloadJsPath), 'preload.js should exist for context-isolated renderer IPC');
const preloadJs = fs.readFileSync(preloadJsPath, 'utf8');

assertContains(mainJs, 'function compareVersions', 'main process');
assertContains(mainJs, 'function fetchLatestRelease', 'main process');
assertContains(mainJs, 'function canWriteDirectory', 'main process');
assertContains(mainJs, 'function getPortableDataDir', 'main process');
assertContains(mainJs, "app.getPath('userData')", 'main process');
assertContains(mainJs, 'function getDefaultThumbnailDataDir', 'main process');
assertContains(mainJs, 'async function getThumbnailDataDir', 'main process');
assertContains(mainJs, 'function getThumbnailCacheConfigPath', 'main process');
assertContains(mainJs, 'thumbnail-cache-dir.json', 'main process');
assertContains(mainJs, "dialog.showOpenDialog(mainWindow", 'main process');
assertContains(mainJs, 'function migrateLegacyDataDir', 'main process');
assertContains(mainJs, "scheme: LOCAL_FILE_SCHEME", 'main process');
assertContains(mainJs, "protocol.handle(LOCAL_FILE_SCHEME", 'main process');
assertContains(mainJs, "ipcMain.handle('create-local-file-url'", 'main process');
assertContains(mainJs, 'function createLocalFileUrl', 'main process');
assertContains(mainJs, 'function getUVMetadataCachePath', 'main process');
assertContains(mainJs, 'function normalizeUVMetadataCache', 'main process');
assertContains(mainJs, 'function isAllowedExternalUrl', 'main process');
assertContains(mainJs, 'async function yieldToEventLoop()', 'main process');
assertContains(mainJs, 'async function getAllFbxFilesAsync', 'main process');
assertContains(mainJs, "ipcMain.handle('cancel-scan'", 'main process');
assertContains(mainJs, "event.sender.send('scan-progress'", 'main process');
assertContains(mainJs, 'requestId: scanState.requestId', 'main process');
assertContains(mainJs, "preload: path.join(__dirname, 'preload.js')", 'main process');
assertContains(mainJs, 'nodeIntegration: false', 'main process');
assertContains(mainJs, 'contextIsolation: true', 'main process');
assertContains(mainJs, 'webSecurity: true', 'main process');
assertContains(mainJs, "backgroundThrottling: process.env.FBX_QUICK_VIEWER_SMOKE !== '1'", 'main process smoke rendering');
assertContains(mainJs, "ipcMain.handle('check-for-updates'", 'main process');
assertContains(mainJs, "releaseNotes: String(release.body || '').slice(0, 12000)", 'main process release notes');
assertContains(mainJs, "ipcMain.handle('open-external-url'", 'main process');
assertContains(mainJs, "ipcMain.handle('load-uv-metadata'", 'main process');
assertContains(mainJs, "ipcMain.handle('save-uv-metadata'", 'main process');
assertContains(mainJs, 'api.github.com/repos/Cherofre/fbx-quick-viewer/releases/latest', 'main process');
assertNotContains(mainJs, 'getAllFbxFiles(customPath, customPath)', 'main process');
assertNotContains(mainJs, "const cacheDir = path.join(getDataDir(), 'fbx_cache')", 'main process thumbnail cache');

assertContains(preloadJs, "contextBridge.exposeInMainWorld('electronAPI'", 'preload');
assertContains(preloadJs, "contextBridge.exposeInMainWorld('pathAPI'", 'preload');
assertContains(preloadJs, 'invoke(channel, ...args)', 'preload');
assertContains(preloadJs, 'startFbxDrag(filePath)', 'preload');
assertContains(preloadJs, "onScanProgress(callback)", 'preload');
assertContains(preloadJs, "'create-local-file-url'", 'preload');

assertContains(indexHtml, 'id="check-update-btn"', 'renderer');
assertContains(indexHtml, 'async function checkForUpdates(manual)', 'renderer');
assertContains(indexHtml, 'function scheduleSilentUpdateCheck()', 'renderer');
assert.strictEqual([...indexHtml.matchAll(/async function initApp\(\)/g)].length, 1, 'renderer should only define initApp once');
assertNotContains(indexHtml, 'onclick="selectHistoryItem(', 'renderer history menu');
assertContains(indexHtml, "itemEl.addEventListener('click', () => selectHistoryItem(p));", 'renderer history menu');
assertContains(indexHtml, "checkForUpdates(false).then(result => {", 'renderer update scheduler');
assertContains(indexHtml, "if (result && result.ok) localStorage.setItem(key, String(Date.now()));", 'renderer update scheduler');
assertContains(indexHtml, 'ipcRenderer = window.electronAPI;', 'renderer secure IPC');
assertContains(indexHtml, 'path = window.pathAPI;', 'renderer secure path API');
assertContains(indexHtml, 'function updateScanProgress(processedCount, foundCount)', 'renderer');
assertContains(indexHtml, 'window.electronAPI.onScanProgress', 'renderer');
assertContains(indexHtml, 'let activeScanRequestId = 0', 'renderer');
assertContains(indexHtml, 'async function getLocalFileLoadUrl(filePath)', 'renderer');
assertContains(indexHtml, 'function cancelCurrentScan()', 'renderer');
assertContains(indexHtml, "ipcRenderer.invoke('cancel-scan')", 'renderer');
assertContains(indexHtml, "ipcRenderer.invoke('scan-folder', customPath, scanRequestId)", 'renderer');
assertContains(indexHtml, 'if (scanRequestId !== activeScanRequestId) return;', 'renderer');
assertContains(indexHtml, 'async function loadModel(identifier, options = {})', 'renderer');
assertNotContains(indexHtml, "require('electron')", 'renderer');
assertNotContains(indexHtml, "require('path')", 'renderer');

assertContains(indexHtml, 'id="uv-channel-select"', 'renderer');
assertContains(indexHtml, 'let activeUVChannelName =', 'renderer');
assertContains(indexHtml, 'let currentUVChannels = []', 'renderer');
assertContains(indexHtml, 'let modelUVMetadata = new Map()', 'renderer');
assertContains(indexHtml, 'id="uv-channel-row"', 'renderer');
assertContains(indexHtml, 'async function loadUVMetadataCache()', 'renderer');
assertContains(indexHtml, 'function hydrateItemUVMetadata(item)', 'renderer');
assertContains(indexHtml, 'function writeUVMetadataCacheEntry(item, channels)', 'renderer');
assertContains(indexHtml, 'function getItemUVChannels(item)', 'renderer');
assertContains(indexHtml, 'function updateUVChannelRowVisibility()', 'renderer');
assertContains(indexHtml, 'function collectModelUVChannels(model)', 'renderer');
assertContains(indexHtml, 'function updateUVChannelOptions(model)', 'renderer');
assertContains(indexHtml, 'function getGeometryUVAttribute(geometry, channelName)', 'renderer');
assertContains(indexHtml, 'function applyPreviewUVChannel(channelName)', 'renderer');
assertContains(indexHtml, 'if (previewUVGeometries.has(child.geometry)) return;', 'renderer');
assertContains(indexHtml, 'function restorePreviewUVChannel()', 'renderer');
assertContains(indexHtml, 'function renderUVBadge(item, mode)', 'renderer');
assertContains(indexHtml, '.grid-uv-badge', 'renderer');
assertContains(indexHtml, "renderUVBadge(item, 'grid')", 'renderer');
assertContains(indexHtml, 'function updateFileUVMetadata(item, channels)', 'renderer');
assertContains(indexHtml, "ipcRenderer.invoke('load-uv-metadata')", 'renderer');
assertContains(indexHtml, "ipcRenderer.invoke('save-uv-metadata'", 'renderer');
assertContains(indexHtml, 'await loadUVMetadataCache();', 'renderer');
assertContains(indexHtml, 'hydrateItemUVMetadata(item);', 'renderer');
assertContains(indexHtml, 'function getThumbnailCacheKey(item)', 'renderer');
assertNotContains(indexHtml, 'thumbnailCache.has(item.relativePath)', 'renderer');
assertContains(indexHtml, 'const selectedItem = options.item || currentDisplayList[currentSelectedIndex];', 'renderer');
assertContains(indexHtml, 'updateFileUVMetadata(selectedItem, uvChannels);', 'renderer');
assertNotContains(indexHtml, 'if (!isFavFilterOnly && temporaryDroppedFbxItem', 'renderer');

assertContains(agentsMd, '当前为 `1.0.5`', 'AGENTS.md');
assertContains(agentsMd, '当前已配置 `npm test`', 'AGENTS.md');

console.log('v1.0.4 feature checks passed');
