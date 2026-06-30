const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function assertContains(source, text, label) {
    assert(source.includes(text), `${label} should contain ${JSON.stringify(text)}`);
}

assert.strictEqual(packageJson.version, '1.0.4', 'package version should be bumped for v1.0.4');
assert.strictEqual(packageJson.scripts.test, 'node tests/drag-drop-behavior.test.js && node tests/v1.0.4-features.test.js', 'npm test should run both regression suites');

assertContains(mainJs, 'function compareVersions', 'main process');
assertContains(mainJs, 'function fetchLatestRelease', 'main process');
assertContains(mainJs, "ipcMain.handle('check-for-updates'", 'main process');
assertContains(mainJs, "ipcMain.handle('open-external-url'", 'main process');
assertContains(mainJs, 'api.github.com/repos/Cherofre/fbx-quick-viewer/releases/latest', 'main process');

assertContains(indexHtml, 'id="check-update-btn"', 'renderer');
assertContains(indexHtml, 'async function checkForUpdates(manual)', 'renderer');
assertContains(indexHtml, 'function scheduleSilentUpdateCheck()', 'renderer');

assertContains(indexHtml, 'id="uv-channel-select"', 'renderer');
assertContains(indexHtml, 'let activeUVChannelName =', 'renderer');
assertContains(indexHtml, 'let currentUVChannels = []', 'renderer');
assertContains(indexHtml, 'let modelUVMetadata = new Map()', 'renderer');
assertContains(indexHtml, 'function collectModelUVChannels(model)', 'renderer');
assertContains(indexHtml, 'function updateUVChannelOptions(model)', 'renderer');
assertContains(indexHtml, 'function getGeometryUVAttribute(geometry, channelName)', 'renderer');
assertContains(indexHtml, 'function applyPreviewUVChannel(channelName)', 'renderer');
assertContains(indexHtml, 'function restorePreviewUVChannel()', 'renderer');
assertContains(indexHtml, 'function renderUVBadge(item)', 'renderer');
assertContains(indexHtml, 'function updateFileUVMetadata(item, channels)', 'renderer');

console.log('v1.0.4 feature checks passed');
