const { contextBridge, ipcRenderer, webUtils } = require('electron');

const pathSeparator = '\\';

function joinPath(...parts) {
    const filtered = parts
        .map(part => String(part || '').trim())
        .filter(Boolean);
    if (filtered.length === 0) return '';

    return filtered
        .join(pathSeparator)
        .replace(/[\\/]+/g, pathSeparator)
        .replace(/^([A-Za-z]:)\\?/, '$1\\');
}

const allowedInvokeChannels = new Set([
    'load-favorites',
    'save-favorites',
    'load-uv-metadata',
    'save-uv-metadata',
    'scan-folder',
    'cancel-scan',
    'get-file-info',
    'create-local-file-url',
    'check-thumbnail',
    'save-thumbnail',
    'check-for-updates',
    'open-external-url',
    'open-folder-dialog',
    'reveal-in-explorer',
    'find-related-mesh-path'
]);

contextBridge.exposeInMainWorld('electronAPI', {
    invoke(channel, ...args) {
        if (!allowedInvokeChannels.has(channel)) {
            return Promise.reject(new Error(`Blocked IPC invoke channel: ${channel}`));
        }
        return ipcRenderer.invoke(channel, ...args);
    },

    startFbxDrag(filePath) {
        if (!filePath || typeof filePath !== 'string') return false;
        ipcRenderer.send('start-fbx-drag', filePath);
        return true;
    },

    onScanProgress(callback) {
        if (typeof callback !== 'function') return () => {};
        const listener = (_event, payload) => callback(payload || {});
        ipcRenderer.on('scan-progress', listener);
        return () => ipcRenderer.removeListener('scan-progress', listener);
    },

    getPathForFile(file) {
        let resolvedPath = '';
        try {
            if (webUtils && typeof webUtils.getPathForFile === 'function') {
                resolvedPath = webUtils.getPathForFile(file);
            }
        } catch (error) {
            resolvedPath = '';
        }
        return resolvedPath || (file && typeof file.path === 'string' ? file.path : '');
    }
});

contextBridge.exposeInMainWorld('pathAPI', {
    sep: pathSeparator,
    join(...parts) {
        return joinPath(...parts);
    }
});
