const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const { pathToFileURL } = require('url');
const { findRelatedMeshPath } = require('./mesh-path');

let mainWindow;
let cachedDataDir = null;
let cachedThumbnailDataDir = null;
let thumbnailCachePromptedThisSession = false;
let activeScan = null;
let dragIcon = null;
const LOCAL_FILE_SCHEME = 'fbx-local';
const THUMBNAIL_CACHE_CONFIG_NAME = 'thumbnail-cache-dir.json';
const ALLOWED_LOCAL_FILE_EXTENSIONS = new Set(['.fbx', '.png', '.jpg', '.jpeg', '.bmp', '.gif', '.dds', '.tga']);
const localFileTokens = new Map();
const localFilePathToToken = new Map();

protocol.registerSchemesAsPrivileged([
    {
        scheme: LOCAL_FILE_SCHEME,
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

// --- 新增：获取窗口配置文件路径 ---
function getWindowStatePath() {
    // 🟢 改为存到 Data 目录
    return path.join(getDataDir(), 'window-state.json');
}


// --- 新增：保存窗口状态 ---
function saveWindowState() {
    if (!mainWindow) return;
    try {
        const isMaximized = mainWindow.isMaximized();
        // 如果最大化了，获取的是最大化前的 bounds，还是需要保存 maximized 标记
        const bounds = mainWindow.getBounds(); 
        
        const state = {
            width: bounds.width,
            height: bounds.height,
            x: bounds.x,
            y: bounds.y,
            isMaximized: isMaximized
        };
        
        fs.writeFileSync(getWindowStatePath(), JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save window state:", e);
    }
}

// --- 新增：读取窗口状态 ---
function loadWindowState() {
    try {
        const statePath = getWindowStatePath();
        if (fs.existsSync(statePath)) {
            const data = fs.readFileSync(statePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to load window state:", e);
    }
    // 默认值
    return { width: 1440, height: 900, isMaximized: false };
}

function createWindow() {
    // 1. 加载保存的状态
    const state = loadWindowState();
    const shouldShowWindow = process.env.FBX_QUICK_VIEWER_SMOKE !== '1';

    // 2. 使用保存的宽、高、位置创建窗口
    mainWindow = new BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x, // 如果 undefined，Electron 会自动居中
        y: state.y,
        title: "FBX 快速预览器",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            backgroundThrottling: process.env.FBX_QUICK_VIEWER_SMOKE !== '1'
        },
        show: false // 先隐藏，设置好最大化状态后再显示，避免闪烁
    });

    // 3. 恢复最大化状态
    if (state.isMaximized) {
        mainWindow.maximize();
    }
    
    // 准备好后再显示窗口
    if (shouldShowWindow) mainWindow.show();

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isAllowedExternalUrl(url)) {
            shell.openExternal(url).catch(error => console.error('打开外部链接失败:', error));
        }
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        const targetUrl = String(url || '');
        if (targetUrl && targetUrl !== mainWindow.webContents.getURL()) {
            event.preventDefault();
        }
    });
    
    // 打开开发者工具（可选）
    // mainWindow.webContents.openDevTools();

    // --- 新增：监听关闭事件，保存状态 ---
    mainWindow.on('close', () => {
        saveWindowState();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        initCacheDirectory().catch(error => console.error('初始化缩略图缓存目录失败:', error));
        runSmokeAssertions();
    });
}

function runSmokeAssertions() {
    if (process.env.FBX_QUICK_VIEWER_SMOKE !== '1' || !mainWindow) return;

    const smokeFilePath = JSON.stringify(process.env.FBX_QUICK_VIEWER_SMOKE_FILE || '');
    mainWindow.webContents.executeJavaScript(`
        (async () => {
            if (!window.electronAPI || !window.electronAPI.invoke || !window.pathAPI || !window.pathAPI.join) {
                return { ok: false, reason: 'preload APIs are not available in renderer' };
            }

            const smokeFile = ${smokeFilePath};
            if (smokeFile) {
                const localUrl = await window.electronAPI.invoke('create-local-file-url', smokeFile);
                if (!localUrl || !localUrl.startsWith('${LOCAL_FILE_SCHEME}://')) {
                    return { ok: false, reason: 'local file URL was not created' };
                }

                const response = await fetch(localUrl);
                const body = await response.text();
                if (!response.ok || !body.includes('SMOKE_LOCAL_FILE')) {
                    return { ok: false, reason: 'local file protocol did not return smoke content' };
                }
            }

            if (typeof getUVControlState !== 'function' || typeof undoUVChange !== 'function' || typeof redoUVChange !== 'function') {
                return { ok: false, reason: 'UV history controls are not available' };
            }

            const tileUInput = document.getElementById('tileU');
            if (!tileUInput || !matUV || !matUV.map) {
                return { ok: false, reason: 'UV preview controls are not initialized' };
            }

            if (renderer.info.render.frame < 1) {
                return { ok: false, reason: 'initial 3D frame was not rendered' };
            }
            if (!Number.isInteger(animationFrameRequestId) || animationFrameRequestId <= 0) {
                return { ok: false, reason: 'animation frame callback was not scheduled' };
            }

            const originalUVState = getUVControlState();
            clearUVHistory();
            tileUInput.value = '1.25';
            updateUVMax();
            const tileUResetButton = document.querySelector('.uv-reset-btn[data-reset-input="tileU"]');
            if (!tileUResetButton || !tileUResetButton.classList.contains('visible')) {
                return { ok: false, reason: 'changed UV value did not expose its reset action' };
            }
            resetUVControl('tileU');
            if (Number(tileUInput.value) !== 1 || tileUResetButton.classList.contains('visible')) {
                return { ok: false, reason: 'individual UV reset did not restore and hide correctly' };
            }
            clearUVHistory();
            tileUInput.value = '0';
            updateUVMax();
            if (matUV.map.repeat.x !== 0) {
                return { ok: false, reason: 'UV tiling zero value was not applied' };
            }

            const zeroUVState = getUVControlState();
            tileUInput.value = '1.25';
            updateUVMax();
            pushUVUndoState(zeroUVState);
            if (!undoUVChange() || Number(tileUInput.value) !== 0) {
                return { ok: false, reason: 'UV undo did not restore zero' };
            }
            if (!redoUVChange() || Number(tileUInput.value) !== 1.25) {
                return { ok: false, reason: 'UV redo did not restore the edited value' };
            }
            applyUVControlState(originalUVState);
            clearUVHistory();

            return { ok: true };
        })()
    `).then(result => {
        if (!result || !result.ok) {
            console.error('Smoke check failed:', result && result.reason ? result.reason : result);
            app.exit(1);
            return;
        }
        console.log('Smoke check passed: preload APIs and local file protocol are available');
        app.exit(0);
    }).catch(error => {
        console.error('Smoke check failed:', error);
        app.exit(1);
    });
}

function registerLocalFileProtocol() {
    protocol.handle(LOCAL_FILE_SCHEME, async (request) => {
        try {
            const parsed = new URL(request.url);
            if (parsed.hostname !== 'file') return new Response('Not found', { status: 404 });

            const parts = parsed.pathname.split('/').filter(Boolean).map(part => decodeURIComponent(part));
            const token = parts.shift();
            const record = token ? localFileTokens.get(token) : null;
            if (!record) {
                return new Response('Not found', { status: 404 });
            }

            let targetPath = record.filePath;
            const relativeResourcePath = parts.join(path.sep);
            if (relativeResourcePath && relativeResourcePath !== path.basename(record.filePath)) {
                const baseDir = path.dirname(record.filePath);
                const candidatePath = path.resolve(baseDir, relativeResourcePath);
                if (!isPathInsideDirectory(candidatePath, baseDir)) {
                    return new Response('Forbidden', { status: 403 });
                }
                targetPath = candidatePath;
            }

            if (!isAllowedLocalFilePath(targetPath)) {
                return new Response('Not found', { status: 404 });
            }

            return net.fetch(pathToFileURL(targetPath).toString());
        } catch (error) {
            console.error('本地文件协议读取失败:', error);
            return new Response('Local file error', { status: 500 });
        }
    });
}

app.whenReady().then(() => {
    registerLocalFileProtocol();
    createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// 获取真实 EXE 所在目录 (保持原样)
function getRealExeDir() {
    if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
    if (process.execPath) return path.dirname(process.execPath);
    return process.cwd();
}

function canWriteDirectory(dir) {
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const testFile = path.join(dir, '.permission_test');
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        return true;
    } catch (e) {
        return false;
    }
}

function getPortableDataDir() {
    return path.join(getRealExeDir(), 'FBX_Data');
}

function isAllowedLocalFilePath(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') return false;
        const resolvedPath = path.resolve(filePath);
        const ext = path.extname(resolvedPath).toLowerCase();
        if (!ALLOWED_LOCAL_FILE_EXTENSIONS.has(ext)) return false;
        const stat = fs.statSync(resolvedPath);
        return stat.isFile();
    } catch (error) {
        return false;
    }
}

function getDraggableFbxPath(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string' || !path.isAbsolute(filePath)) return '';
        const resolvedPath = path.resolve(filePath);
        if (path.extname(resolvedPath).toLowerCase() !== '.fbx') return '';
        return fs.statSync(resolvedPath).isFile() ? resolvedPath : '';
    } catch (error) {
        return '';
    }
}

function getDragIcon() {
    if (dragIcon) return dragIcon;

    const iconPath = path.join(__dirname, 'icon.png');
    const sourceIcon = nativeImage.createFromPath(iconPath);
    dragIcon = sourceIcon.isEmpty()
        ? iconPath
        : sourceIcon.resize({ width: 32, height: 32, quality: 'best' });
    return dragIcon;
}

function createLocalFileUrl(filePath) {
    if (!isAllowedLocalFilePath(filePath)) return '';

    const resolvedPath = path.resolve(filePath);
    const pathKey = resolvedPath.toLowerCase();
    let token = localFilePathToToken.get(pathKey);

    if (!token) {
        token = crypto.randomUUID();
        localFilePathToToken.set(pathKey, token);
    }

    localFileTokens.set(token, {
        filePath: resolvedPath,
        updatedAt: Date.now()
    });

    const displayName = encodeURIComponent(path.basename(resolvedPath));
    return `${LOCAL_FILE_SCHEME}://file/${token}/${displayName}`;
}

function isTrustedSender(event) {
    return !!mainWindow && event && event.sender === mainWindow.webContents;
}

function isPathInsideDirectory(candidatePath, parentDir) {
    const relativePath = path.relative(parentDir, candidatePath);
    return relativePath === '' || (!!relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function isSameDirectory(a, b) {
    try {
        return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
    } catch (error) {
        return false;
    }
}

function copyFileIfMissing(sourceFile, targetFile) {
    if (!fs.existsSync(sourceFile) || fs.existsSync(targetFile)) return false;
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(sourceFile, targetFile);
    return true;
}

function migrateLegacyDataDir(targetDir) {
    if (!targetDir) return;

    const legacyDirs = [
        getPortableDataDir(),
        path.join(process.cwd(), 'FBX_Data')
    ];
    const migratedFiles = ['favorites.json', 'uv-metadata.json', 'window-state.json'];

    for (const sourceDir of legacyDirs) {
        if (!sourceDir || isSameDirectory(sourceDir, targetDir) || !fs.existsSync(sourceDir)) continue;

        try {
            let migratedCount = 0;
            fs.mkdirSync(targetDir, { recursive: true });
            for (const fileName of migratedFiles) {
                if (copyFileIfMissing(path.join(sourceDir, fileName), path.join(targetDir, fileName))) {
                    migratedCount++;
                }
            }
            if (migratedCount > 0) {
                console.log(`Migrated ${migratedCount} data file(s) from ${sourceDir} to ${targetDir}`);
            }
        } catch (error) {
            console.error('迁移旧数据目录失败:', error);
        }
    }
}

// 🟢 新增：获取统一的数据存储目录 (Data 文件夹)
function getDataDir() {
    if (cachedDataDir) return cachedDataDir;

    const portablePath = getPortableDataDir();
    const userDataPath = path.join(app.getPath('userData'), 'FBX_Data');
    const preferredPaths = [];

    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        preferredPaths.push(portablePath, userDataPath);
    } else if (!app.isPackaged) {
        preferredPaths.push(path.join(process.cwd(), 'FBX_Data'), userDataPath, portablePath);
    } else {
        preferredPaths.push(userDataPath, portablePath);
    }

    for (const dataPath of preferredPaths) {
        if (canWriteDirectory(dataPath)) {
            cachedDataDir = dataPath;
            migrateLegacyDataDir(cachedDataDir);
            return cachedDataDir;
        }
    }

    cachedDataDir = userDataPath;
    try {
        fs.mkdirSync(cachedDataDir, { recursive: true });
    } catch (e) {
        console.error("创建数据文件夹失败:", e);
    }
    migrateLegacyDataDir(cachedDataDir);
    return cachedDataDir;
}

function getDefaultThumbnailDataDir() {
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        return getPortableDataDir();
    }

    if (!app.isPackaged) {
        return path.join(process.cwd(), 'FBX_Data');
    }

    return getPortableDataDir();
}

function getThumbnailCacheConfigPath() {
    return path.join(getDataDir(), THUMBNAIL_CACHE_CONFIG_NAME);
}

function loadConfiguredThumbnailDataDir() {
    try {
        const configPath = getThumbnailCacheConfigPath();
        if (!fs.existsSync(configPath)) return null;

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const dataDir = config && typeof config.dataDir === 'string' ? config.dataDir : '';
        return dataDir && canWriteDirectory(dataDir) ? dataDir : null;
    } catch (error) {
        console.error('读取缩略图缓存目录配置失败:', error);
        return null;
    }
}

function saveConfiguredThumbnailDataDir(dataDir) {
    try {
        const configPath = getThumbnailCacheConfigPath();
        fs.writeFileSync(configPath, JSON.stringify({ dataDir }, null, 2), 'utf8');
    } catch (error) {
        console.error('保存缩略图缓存目录配置失败:', error);
    }
}

async function promptForThumbnailDataDir() {
    if (thumbnailCachePromptedThisSession || !mainWindow) return null;
    thumbnailCachePromptedThisSession = true;

    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择缩略图缓存目录',
        message: '软件目录无法写入缩略图缓存，请选择一个用于存放 FBX_Data 的目录。',
        buttonLabel: '使用此文件夹',
        properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || !result.filePaths || !result.filePaths[0]) return null;

    const selectedRoot = result.filePaths[0];
    const selectedDataDir = path.basename(selectedRoot).toLowerCase() === 'fbx_data'
        ? selectedRoot
        : path.join(selectedRoot, 'FBX_Data');
    if (!canWriteDirectory(selectedDataDir)) return null;
    saveConfiguredThumbnailDataDir(selectedDataDir);
    return selectedDataDir;
}

async function getThumbnailDataDir() {
    if (cachedThumbnailDataDir) return cachedThumbnailDataDir;

    const defaultDataDir = getDefaultThumbnailDataDir();
    if (canWriteDirectory(defaultDataDir)) {
        cachedThumbnailDataDir = defaultDataDir;
        return cachedThumbnailDataDir;
    }

    const configuredDataDir = loadConfiguredThumbnailDataDir();
    if (configuredDataDir) {
        cachedThumbnailDataDir = configuredDataDir;
        return cachedThumbnailDataDir;
    }

    const selectedDataDir = await promptForThumbnailDataDir();
    if (selectedDataDir) {
        cachedThumbnailDataDir = selectedDataDir;
        return cachedThumbnailDataDir;
    }

    console.warn('缩略图缓存目录不可用，本次运行将跳过缩略图磁盘缓存。');
    return null;
}

// 初始化缓存目录
async function initCacheDirectory() {
    const thumbnailDataDir = await getThumbnailDataDir();
    if (!thumbnailDataDir) return;

    const cacheDir = path.join(thumbnailDataDir, 'fbx_cache');
    try {
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        // ...剩下的代码保持不变...
        const testFile = path.join(cacheDir, '.permission_test');
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        console.log("Cache directory ready:", cacheDir);
    } catch (e) {
        // dialog.showErrorBox... (保持原样)
    }
}

// 统一的路径 Hash 算法
async function getCachePath(filePath, mtime) {
    const thumbnailDataDir = await getThumbnailDataDir();
    if (!thumbnailDataDir) return null;

    const cacheDir = path.join(thumbnailDataDir, 'fbx_cache');
    
    const safePath = path.resolve(filePath).toLowerCase(); 
    const safeTime = Math.floor(mtime);
    const hash = crypto.createHash('md5').update(safePath + safeTime).digest('hex');
    
    return {
        dir: cacheDir,
        file: path.join(cacheDir, hash + ".png")
    };
}

function getUVMetadataCachePath() {
    return path.join(getDataDir(), 'uv-metadata.json');
}

function normalizeUVChannel(channel) {
    if (!channel || typeof channel !== 'object') return null;
    const name = String(channel.name || '').trim();
    if (!name) return null;

    return {
        name,
        label: String(channel.label || name).trim() || name,
        meshCount: Number.isFinite(Number(channel.meshCount)) ? Number(channel.meshCount) : 0,
        partial: !!channel.partial
    };
}

function normalizeUVMetadataCache(raw) {
    const source = raw && raw.entries && typeof raw.entries === 'object' ? raw.entries : raw;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

    const normalized = {};
    Object.entries(source).forEach(([key, entry]) => {
        if (!key || !entry || typeof entry !== 'object') return;
        const mtime = Number(entry.mtime);
        if (!Number.isFinite(mtime)) return;

        normalized[key] = {
            mtime,
            channels: Array.isArray(entry.channels) ? entry.channels.map(normalizeUVChannel).filter(Boolean) : [],
            updatedAt: entry.updatedAt || new Date(0).toISOString()
        };
    });
    return normalized;
}

function normalizeVersion(version) {
    return String(version || '').trim().replace(/^v/i, '');
}

function compareVersions(a, b) {
    const partsA = normalizeVersion(a).split('.').map(n => parseInt(n, 10) || 0);
    const partsB = normalizeVersion(b).split('.').map(n => parseInt(n, 10) || 0);
    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
        const diff = (partsA[i] || 0) - (partsB[i] || 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
}

function fetchLatestRelease() {
    const url = 'https://api.github.com/repos/Cherofre/fbx-quick-viewer/releases/latest';

    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'fbx-quick-viewer'
            },
            timeout: 10000
        }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`GitHub release check failed: ${res.statusCode}`));
                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('GitHub release check timed out'));
        });
        req.on('error', reject);
    });
}

ipcMain.handle('load-favorites', async () => {
    try {
        // 🟢 改为 Data 目录
        const favPath = path.join(getDataDir(), 'favorites.json');
        
        if (fs.existsSync(favPath)) {
            const data = fs.readFileSync(favPath, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (err) {
        console.error('读取收藏失败:', err);
        return [];
    }
});
ipcMain.handle('save-favorites', async (event, favoritesArray) => {
    try {
        // 🟢 改为 Data 目录
        const favPath = path.join(getDataDir(), 'favorites.json');
        fs.writeFileSync(favPath, JSON.stringify(favoritesArray, null, 2), 'utf-8');
    } catch (err) {
        console.error('保存收藏失败:', err);
    }
});

ipcMain.handle('load-uv-metadata', async () => {
    try {
        const cachePath = getUVMetadataCachePath();
        if (!fs.existsSync(cachePath)) return {};

        const data = fs.readFileSync(cachePath, 'utf-8');
        return normalizeUVMetadataCache(JSON.parse(data));
    } catch (err) {
        console.error('读取 UV 元数据缓存失败:', err);
        return {};
    }
});

ipcMain.handle('save-uv-metadata', async (event, cacheData) => {
    try {
        const cachePath = getUVMetadataCachePath();
        const normalized = normalizeUVMetadataCache(cacheData);
        fs.writeFileSync(cachePath, JSON.stringify({ version: 1, entries: normalized }, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('保存 UV 元数据缓存失败:', err);
        return false;
    }
});

const SKIPPED_SCAN_ENTRIES = new Set(['node_modules', 'fbx_cache']);
const SCAN_PROGRESS_INTERVAL_MS = 120;
const SCAN_YIELD_INTERVAL = 100;

function shouldSkipScanEntry(name) {
    return SKIPPED_SCAN_ENTRIES.has(name) || String(name || '').startsWith('.');
}

async function yieldToEventLoop() {
    return new Promise(resolve => setImmediate(resolve));
}

function sendScanProgress(event, scanState, currentDir, force = false) {
    if (!event || !event.sender || event.sender.isDestroyed()) return;

    const now = Date.now();
    if (!force && now - scanState.lastProgressAt < SCAN_PROGRESS_INTERVAL_MS) return;

    scanState.lastProgressAt = now;
    event.sender.send('scan-progress', {
        requestId: scanState.requestId,
        processedCount: scanState.processedCount,
        foundCount: scanState.foundCount,
        currentDir,
        canceled: scanState.canceled
    });
}

async function getAllFbxFilesAsync(dir, rootDir, scanState, event) {
    const results = [];
    const pendingDirs = [dir];

    while (pendingDirs.length > 0 && !scanState.canceled) {
        const currentDir = pendingDirs.pop();
        let entries;

        try {
            entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
        } catch (error) {
            continue;
        }

        for (const entry of entries) {
            if (scanState.canceled) break;
            if (shouldSkipScanEntry(entry.name)) continue;

            const filePath = path.join(currentDir, entry.name);
            scanState.processedCount++;

            if (entry.isDirectory()) {
                pendingDirs.push(filePath);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) {
                try {
                    const stat = await fs.promises.stat(filePath);
                    if (stat && stat.isFile()) {
                        const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                        results.push({
                            relativePath: relPath,
                            fullPath: filePath,
                            mtime: stat.mtimeMs,
                            name: entry.name
                        });
                        scanState.foundCount++;
                    }
                } catch (error) {
                    // 忽略单个文件的权限或读取错误，继续扫描其它文件。
                }
            }

            if (scanState.processedCount % SCAN_YIELD_INTERVAL === 0) {
                sendScanProgress(event, scanState, currentDir);
                await yieldToEventLoop();
            }
        }

        sendScanProgress(event, scanState, currentDir);
        await yieldToEventLoop();
    }

    sendScanProgress(event, scanState, rootDir, true);
    return results;
}

ipcMain.handle('cancel-scan', async () => {
    if (!activeScan) return false;
    activeScan.canceled = true;
    return true;
});

ipcMain.handle('scan-folder', async (event, customPath, requestId) => {
    let scanState = null;
    try {
        // 🔴 修复：如果是首次启动(没有路径)，直接返回空，防止 fs.readdirSync 报错炸掉程序
        if (!customPath) return { path: "", files: [] };

        if (activeScan) activeScan.canceled = true;
        scanState = {
            requestId,
            canceled: false,
            processedCount: 0,
            foundCount: 0,
            lastProgressAt: 0
        };
        activeScan = scanState;

        const files = await getAllFbxFilesAsync(customPath, customPath, scanState, event);
        return { path: customPath, files, canceled: scanState.canceled, requestId };
    } catch (error) { 
        console.error("Scan error:", error); // 最好打印一下错误
        return { path: "", files: [], error: error.message }; 
    } finally {
        if (activeScan === scanState) activeScan = null;
    }
});

ipcMain.handle('get-file-info', async (event, filePath) => {
    try {
        if (!filePath || path.extname(filePath).toLowerCase() !== '.fbx') return null;
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) return null;

        return {
            name: path.basename(filePath),
            fullPath: filePath,
            mtime: stat.mtimeMs,
            type: 'fbx'
        };
    } catch (error) {
        console.error("File info error:", error);
        return null;
    }
});

ipcMain.handle('create-local-file-url', async (event, filePath) => {
    if (!isTrustedSender(event)) return '';
    return createLocalFileUrl(filePath);
});

ipcMain.handle('check-thumbnail', async (event, filePath, mtime) => {
    try {
        const cachePath = await getCachePath(filePath, mtime);
        if (!cachePath) return null;

        const { file } = cachePath;
        if (fs.existsSync(file)) {
            const bitmap = fs.readFileSync(file);
            if (bitmap.length > 0) {
                return `data:image/png;base64,${Buffer.from(bitmap).toString('base64')}`;
            }
        }
    } catch (e) {}
    return null;
});

ipcMain.handle('save-thumbnail', async (event, filePath, mtime, dataUrl) => {
    try {
        if (!filePath || !dataUrl) return false;
        
        const cachePath = await getCachePath(filePath, mtime);
        if (!cachePath) return false;

        const { dir, file } = cachePath;
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        fs.writeFileSync(file, buffer);
        return true;
    } catch (e) { 
        console.error("Write Failed:", e); 
        return false;
    }
});

ipcMain.handle('check-for-updates', async () => {
    const currentVersion = app.getVersion();

    try {
        const release = await fetchLatestRelease();
        const latestVersion = normalizeVersion(release.tag_name || release.name);

        return {
            ok: true,
            currentVersion,
            latestVersion,
            updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
            releaseName: release.name || release.tag_name || latestVersion,
            releaseUrl: release.html_url || '',
            publishedAt: release.published_at || '',
            releaseNotes: String(release.body || '').slice(0, 12000)
        };
    } catch (error) {
        return {
            ok: false,
            currentVersion,
            latestVersion: '',
            updateAvailable: false,
            releaseName: '',
            releaseUrl: '',
            releaseNotes: '',
            error: error.message || String(error)
        };
    }
});

function isAllowedExternalUrl(url) {
    try {
        const parsed = new URL(String(url || ''));
        return parsed.protocol === 'https:'
            && parsed.hostname === 'github.com'
            && parsed.pathname.startsWith('/Cherofre/fbx-quick-viewer/releases');
    } catch (error) {
        return false;
    }
}

ipcMain.handle('open-external-url', async (event, url) => {
    try {
        if (!isAllowedExternalUrl(url)) return false;
        await shell.openExternal(url);
        return true;
    } catch (error) {
        console.error('打开外部链接失败:', error);
        return false;
    }
});

ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('reveal-in-explorer', (event, fullPath) => {
    if (fullPath) shell.showItemInFolder(fullPath);
});

ipcMain.handle('find-related-mesh-path', async (event, fullPath) => {
    if (!isTrustedSender(event)) return '';
    return findRelatedMeshPath(fullPath);
});

ipcMain.on('start-fbx-drag', (event, fullPath) => {
    if (!isTrustedSender(event)) return;
    const draggablePath = getDraggableFbxPath(fullPath);
    if (!draggablePath) return;

    event.sender.startDrag({
        file: draggablePath,
        icon: getDragIcon()
    });
});
