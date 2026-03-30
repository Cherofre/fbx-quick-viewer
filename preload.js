const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

const allowedInvokeChannels = new Set([
    'load-favorites',
    'save-favorites',
    'scan-folder',
    'check-thumbnail',
    'save-thumbnail',
    'open-folder-dialog',
    'reveal-in-explorer'
]);

contextBridge.exposeInMainWorld('desktopBridge', {
    isElectron: true,
    path: {
        join: (...segments) => path.join(...segments),
        sep: path.sep
    },
    invoke(channel, ...args) {
        if (!allowedInvokeChannels.has(channel)) {
            throw new Error(`Blocked IPC channel: ${channel}`);
        }

        return ipcRenderer.invoke(channel, ...args);
    }
});
