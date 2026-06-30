const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow;

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

    // 2. 使用保存的宽、高、位置创建窗口
    mainWindow = new BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x, // 如果 undefined，Electron 会自动居中
        y: state.y,
        title: "FBX 快速预览器",
        webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false },
        show: false // 先隐藏，设置好最大化状态后再显示，避免闪烁
    });

    // 3. 恢复最大化状态
    if (state.isMaximized) {
        mainWindow.maximize();
    }
    
    // 准备好后再显示窗口
    mainWindow.show();

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    
    // 打开开发者工具（可选）
    // mainWindow.webContents.openDevTools();

    // --- 新增：监听关闭事件，保存状态 ---
    mainWindow.on('close', () => {
        saveWindowState();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        initCacheDirectory();
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// 获取真实 EXE 所在目录 (保持原样)
function getRealExeDir() {
    if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
    if (process.execPath) return path.dirname(process.execPath);
    return process.cwd();
}
// 🟢 新增：获取统一的数据存储目录 (Data 文件夹)
function getDataDir() {
    const dataPath = path.join(getRealExeDir(), 'FBX_Data');
    if (!fs.existsSync(dataPath)) {
        try {
            fs.mkdirSync(dataPath, { recursive: true });
        } catch (e) {
            console.error("创建数据文件夹失败:", e);
        }
    }
    return dataPath;
}

// 初始化缓存目录
function initCacheDirectory() {
    // 🟢 缓存也放进 Data 目录
    const cacheDir = path.join(getDataDir(), 'fbx_cache');
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
function getCachePath(filePath, mtime) {
    // 🟢 这里也要改
    const cacheDir = path.join(getDataDir(), 'fbx_cache');
    
    const safePath = path.resolve(filePath).toLowerCase(); 
    const safeTime = Math.floor(mtime);
    const hash = crypto.createHash('md5').update(safePath + safeTime).digest('hex');
    
    return {
        dir: cacheDir,
        file: path.join(cacheDir, hash + ".png")
    };
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

// 递归扫描函数
function getAllFbxFiles(dir, rootDir) {
    let results = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            // 跳过系统文件夹和缓存目录
            if (file === 'node_modules' || file.startsWith('.') || file === 'fbx_cache') return;
            
            const filePath = path.join(dir, file);
            try {
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    // 递归进入子文件夹
                    results = results.concat(getAllFbxFiles(filePath, rootDir));
                } else {
                    // 检查是否为 FBX 文件
                    if (file.toLowerCase().endsWith('.fbx')) {
                        // 🟢 关键修复：强制把反斜杠 \ 替换为正斜杠 /，解决 JSON 存储路径问题
                        const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
                        
                        results.push({
                            relativePath: relPath,
                            fullPath: filePath, 
                            mtime: stat.mtimeMs,
                            name: file
                        });
                    }
                }
            } catch (err) {
                // 忽略单个文件的权限错误
            }
        });
    } catch (e) {
        // 忽略文件夹读取错误
    }
    return results;
}

ipcMain.handle('scan-folder', async (event, customPath) => {
    try {
        // 🔴 修复：如果是首次启动(没有路径)，直接返回空，防止 fs.readdirSync 报错炸掉程序
        if (!customPath) return { path: "", files: [] };
        
        return { path: customPath, files: getAllFbxFiles(customPath, customPath) };
    } catch (error) { 
        console.error("Scan error:", error); // 最好打印一下错误
        return { path: "", files: [], error: error.message }; 
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

ipcMain.handle('check-thumbnail', async (event, filePath, mtime) => {
    try {
        const { file } = getCachePath(filePath, mtime);
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
        if (!filePath || !dataUrl) return;
        
        const { dir, file } = getCachePath(filePath, mtime);
        
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        fs.writeFileSync(file, buffer);
    } catch (e) { 
        console.error("Write Failed:", e); 
    }
});

ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('reveal-in-explorer', (event, fullPath) => {
    if (fullPath) shell.showItemInFolder(fullPath);
});
