const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow;

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
}

function getDataDir() {
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
        return ensureDir(path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'FBX_Data'));
    }

    if (app.isPackaged) {
        return ensureDir(app.getPath('userData'));
    }

    return ensureDir(path.join(__dirname, 'FBX_Data'));
}

function getWindowStatePath() {
    return path.join(getDataDir(), 'window-state.json');
}

function saveWindowState() {
    if (!mainWindow) return;

    try {
        const bounds = mainWindow.getBounds();
        const state = {
            width: bounds.width,
            height: bounds.height,
            x: bounds.x,
            y: bounds.y,
            isMaximized: mainWindow.isMaximized()
        };

        fs.writeFileSync(getWindowStatePath(), JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save window state:', error);
    }
}

function loadWindowState() {
    try {
        const statePath = getWindowStatePath();
        if (fs.existsSync(statePath)) {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        }
    } catch (error) {
        console.error('Failed to load window state:', error);
    }

    return { width: 1440, height: 900, isMaximized: false };
}

function initCacheDirectory() {
    const cacheDir = path.join(getDataDir(), 'fbx_cache');

    try {
        ensureDir(cacheDir);
        const testFile = path.join(cacheDir, '.permission_test');
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
        console.log('Cache directory ready:', cacheDir);
    } catch (error) {
        console.error('Cache directory initialization failed:', error);
    }
}

function getCachePath(filePath, mtime) {
    const cacheDir = path.join(getDataDir(), 'fbx_cache');
    const safePath = path.resolve(filePath).toLowerCase();
    const safeTime = Math.floor(mtime);
    const hash = crypto.createHash('md5').update(safePath + safeTime).digest('hex');

    return {
        dir: cacheDir,
        file: path.join(cacheDir, `${hash}.png`)
    };
}

function createWindow() {
    const state = loadWindowState();

    mainWindow = new BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x,
        y: state.y,
        title: 'FBX 快速预览器',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: false
        }
    });

    if (state.isMaximized) {
        mainWindow.maximize();
    }

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.on('close', saveWindowState);
    mainWindow.webContents.on('did-finish-load', initCacheDirectory);
}

function getAllFbxFiles(dir, rootDir) {
    let results = [];

    try {
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            if (file === 'node_modules' || file.startsWith('.') || file === 'fbx_cache') {
                return;
            }

            const filePath = path.join(dir, file);

            try {
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    results = results.concat(getAllFbxFiles(filePath, rootDir));
                    return;
                }

                if (!file.toLowerCase().endsWith('.fbx')) {
                    return;
                }

                results.push({
                    relativePath: path.relative(rootDir, filePath).replace(/\\/g, '/'),
                    fullPath: filePath,
                    mtime: stat.mtimeMs,
                    name: file
                });
            } catch {
                // Ignore per-file access errors so a single bad file does not stop the scan.
            }
        });
    } catch {
        // Ignore directory access errors for the same reason as above.
    }

    return results;
}

ipcMain.handle('load-favorites', async () => {
    try {
        const favoritesPath = path.join(getDataDir(), 'favorites.json');
        if (!fs.existsSync(favoritesPath)) {
            return [];
        }

        return JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
    } catch (error) {
        console.error('读取收藏失败:', error);
        return [];
    }
});

ipcMain.handle('save-favorites', async (event, favoritesArray) => {
    try {
        const favoritesPath = path.join(getDataDir(), 'favorites.json');
        fs.writeFileSync(favoritesPath, JSON.stringify(favoritesArray, null, 2), 'utf8');
    } catch (error) {
        console.error('保存收藏失败:', error);
    }
});

ipcMain.handle('scan-folder', async (event, customPath) => {
    try {
        if (!customPath) {
            return { path: '', files: [] };
        }

        return {
            path: customPath,
            files: getAllFbxFiles(customPath, customPath)
        };
    } catch (error) {
        console.error('Scan error:', error);
        return { path: '', files: [], error: error.message };
    }
});

ipcMain.handle('check-thumbnail', async (event, filePath, mtime) => {
    try {
        const { file } = getCachePath(filePath, mtime);
        if (fs.existsSync(file)) {
            const bitmap = fs.readFileSync(file);
            if (bitmap.length > 0) {
                return `data:image/png;base64,${Buffer.from(bitmap).toString('base64')}`;
            }
        }
    } catch {
        // Ignore cache read failures and regenerate on demand.
    }

    return null;
});

ipcMain.handle('save-thumbnail', async (event, filePath, mtime, dataUrl) => {
    try {
        if (!filePath || !dataUrl) {
            return;
        }

        const { dir, file } = getCachePath(filePath, mtime);
        ensureDir(dir);

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(file, Buffer.from(base64Data, 'base64'));
    } catch (error) {
        console.error('Write Failed:', error);
    }
});

ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('reveal-in-explorer', (event, fullPath) => {
    if (fullPath) {
        shell.showItemInFolder(fullPath);
    }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
