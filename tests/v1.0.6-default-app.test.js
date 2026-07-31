const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const installerNsh = fs.readFileSync(path.join(root, 'build', 'installer.nsh'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const { findOpenFbxPath } = require('../open-fbx');

function assertContains(source, text, label) {
    assert(source.includes(text), `${label} should contain ${JSON.stringify(text)}`);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fbx-default-app-'));
const fbxPath = path.join(tempDir, 'model with spaces.FBX');
const otherPath = path.join(tempDir, 'model.txt');
fs.writeFileSync(fbxPath, 'fbx', 'utf8');
fs.writeFileSync(otherPath, 'text', 'utf8');

assert.strictEqual(findOpenFbxPath(['app.exe', fbxPath]), path.resolve(fbxPath), 'should accept an existing FBX argument');
assert.strictEqual(findOpenFbxPath(['app.exe', `"${fbxPath}"`]), path.resolve(fbxPath), 'should accept a quoted FBX argument');
assert.strictEqual(findOpenFbxPath(['app.exe', '--flag', otherPath]), '', 'should reject non-FBX arguments');
assert.strictEqual(findOpenFbxPath(['app.exe', path.join(tempDir, 'missing.fbx')]), '', 'should reject missing FBX files');

fs.rmSync(tempDir, { recursive: true, force: true });

assertContains(mainJs, 'app.requestSingleInstanceLock()', 'single-instance lock');
assertContains(mainJs, "app.on('second-instance'", 'running-app file forwarding');
assertContains(mainJs, 'const focusResult = focusMainWindow()', 'focus existing window before loading associated file');
assertContains(mainJs, "const delayMs = focusResult?.wasRevealed ? 160 : 0", 'defer model loading during window restore animation');
assertContains(mainJs, 'else if (wasHidden) targetWindow.show()', 'avoid showing an already visible window');
assertContains(mainJs, "backgroundColor: '#404040'", 'native window background matches the viewport');
assertContains(mainJs, "targetWindow.webContents.send('open-fbx-file', filePath);", 'active-window file delivery');
assertContains(mainJs, 'const appWindows = new Set()', 'multi-window registry');
assertContains(mainJs, 'const activeScans = new Map()', 'per-window scan registry');
assertContains(mainJs, 'const previousScan = activeScans.get(senderId)', 'scan cancellation isolation');
assertContains(mainJs, "ipcMain.handle('consume-open-fbx-path'", 'cold-start file consumption');
assertContains(mainJs, "ipcMain.on('renderer-open-file-ready'", 'renderer readiness handshake');
assertContains(mainJs, "ipcMain.handle('open-fbx-in-new-window'", 'new-window IPC');
assertContains(mainJs, 'createWindow({ initialFbxPath: info.fullPath })', 'new-window creation');
assertContains(preloadJs, "'consume-open-fbx-path'", 'allowed cold-start IPC');
assertContains(preloadJs, "'open-fbx-in-new-window'", 'allowed new-window IPC');
assertContains(preloadJs, 'onOpenFbxFile(callback)', 'open-file event bridge');
assertContains(preloadJs, "ipcRenderer.send('renderer-open-file-ready');", 'renderer readiness bridge');
assertContains(mainJs, 'directory: path.dirname(resolvedPath)', 'associated file parent directory');
assertContains(indexHtml, "externalOpenMode: 'fbx_external_open_mode'", 'external-open preference storage');
assertContains(indexHtml, 'name="setup-external-open-mode" value="current" checked', 'current-window default choice');
assertContains(indexHtml, 'name="setup-external-open-mode" value="new-window"', 'new-window preference choice');
assertContains(indexHtml, 'async function handleAssociatedFbxPath(filePath, allowNewWindow)', 'associated FBX dispatcher');
assertContains(indexHtml, "getExternalOpenMode() === 'new-window'", 'new-window preference dispatch');
assertContains(indexHtml, "ipcRenderer.invoke('open-fbx-in-new-window', filePath)", 'renderer new-window request');
assertContains(indexHtml, 'async function openFbxInCurrentWindow(filePath)', 'current-window associated loader');
assertContains(indexHtml, 'const existingItem = allFilesData.find', 'reuse existing directory item');
assertContains(indexHtml, 'return loadTemporaryFbxInfo(info)', 'current-window temporary fallback');
assertContains(indexHtml, 'async function loadTemporaryFbxPath(filePath)', 'temporary drag-in loader');
assertContains(indexHtml, "loadTemporaryFbxPath(filePath)", 'drag-in keeps temporary loading semantics');
assertContains(indexHtml, "handleAssociatedFbxPath(initialFbxPath, false)", 'cold-start uses first window');
assertContains(indexHtml, "handleAssociatedFbxPath(filePath, true).then", 'running-app applies external-open preference');
assertContains(indexHtml, "temporaryBadge.className = 'grid-temporary-badge'", 'temporary thumbnail badge');
assertContains(indexHtml, "await ipcRenderer.invoke('consume-open-fbx-path')", 'startup FBX loading');
assertContains(indexHtml, 'window.electronAPI.notifyOpenFbxReady()', 'renderer readiness notification');
assertContains(indexHtml, "ipcRenderer.invoke('cancel-scan')", 'external FBX priority over an active directory scan');

assertContains(installerNsh, 'WriteRegStr HKCU "Software\\Classes\\.fbx\\OpenWithProgids"', 'per-user Open With registration');
assertContains(installerNsh, 'WriteRegStr HKCU "Software\\RegisteredApplications"', 'Windows default-app candidate registration');
assertContains(installerNsh, '$\\"$INSTDIR\\${APP_FILENAME}.exe$\\" $\\"%1$\\"', 'quoted FBX open command');
assertContains(installerNsh, 'DeleteRegValue HKCU "Software\\Classes\\.fbx\\OpenWithProgids"', 'uninstall association cleanup');
assert(!installerNsh.includes('UserChoice'), 'installer should not bypass Windows default-app consent');
assert.notStrictEqual(packageJson.build.nsis.perMachine, true, 'file association should preserve per-user installation');
assert(packageJson.build.files.includes('open-fbx.js'), 'argument parser should be packaged');

console.log('v1.0.6 default app checks passed');
