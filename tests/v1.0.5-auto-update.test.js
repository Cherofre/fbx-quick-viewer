const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const mainJs = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(root, 'preload.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const installerNsh = fs.readFileSync(path.join(root, 'build', 'installer.nsh'), 'utf8');
const {
    clampPercent,
    createAutoUpdateController,
    isInstalledAutoUpdateBuild
} = require(path.join(root, 'auto-update'));

class FakeUpdater extends EventEmitter {
    constructor() {
        super();
        this.checkCount = 0;
        this.installArgs = null;
    }

    async checkForUpdates() {
        this.checkCount++;
        this.emit('checking-for-update');
        this.emit('update-available', { version: '1.0.6' });
        this.emit('download-progress', {
            percent: 37.5,
            transferred: 375,
            total: 1000,
            bytesPerSecond: 125
        });
        this.emit('update-downloaded', { version: '1.0.6' });
        return { downloadPromise: Promise.resolve(['update.exe']) };
    }

    quitAndInstall(...args) {
        this.installArgs = args;
    }
}

async function run() {
    assert.strictEqual(isInstalledAutoUpdateBuild({ isPackaged: true }, {}, 'win32'), true);
    assert.strictEqual(isInstalledAutoUpdateBuild({ isPackaged: true }, { PORTABLE_EXECUTABLE_DIR: 'D:\\app' }, 'win32'), false);
    assert.strictEqual(isInstalledAutoUpdateBuild({ isPackaged: false }, {}, 'win32'), false);
    assert.strictEqual(clampPercent(-4), 0);
    assert.strictEqual(clampPercent(40.5), 40.5);
    assert.strictEqual(clampPercent(140), 100);

    const updater = new FakeUpdater();
    const statuses = [];
    const scheduled = [];
    let savedBeforeInstall = 0;
    const controller = createAutoUpdateController({
        app: { isPackaged: true },
        autoUpdater: updater,
        env: {},
        platform: 'win32',
        onStatus: status => statuses.push(status),
        saveBeforeInstall: () => { savedBeforeInstall++; },
        schedule: (callback, delay) => scheduled.push({ callback, delay }),
        logger: null
    });

    controller.setup();
    assert.strictEqual(updater.autoDownload, true);
    assert.strictEqual(updater.autoInstallOnAppQuit, false);
    assert.strictEqual(updater.disableWebInstaller, true);

    const result = await controller.checkForUpdates();
    assert.strictEqual(updater.checkCount, 1);
    assert.strictEqual(result.state.status, 'downloaded');
    assert.strictEqual(result.state.version, '1.0.6');
    assert.strictEqual(result.state.percent, 100);
    assert(statuses.some(status => status.status === 'downloading' && status.percent === 37.5));

    assert.strictEqual(controller.installDownloadedUpdate(), true);
    assert.strictEqual(savedBeforeInstall, 1);
    assert.strictEqual(scheduled.length, 1);
    assert.strictEqual(scheduled[0].delay, 150);
    scheduled[0].callback();
    assert.deepStrictEqual(updater.installArgs, [true, true]);

    const portableUpdater = new FakeUpdater();
    const portableController = createAutoUpdateController({
        app: { isPackaged: true },
        autoUpdater: portableUpdater,
        env: { PORTABLE_EXECUTABLE_DIR: 'D:\\portable' },
        platform: 'win32'
    });
    assert.strictEqual(portableController.setup().status, 'unsupported');
    await portableController.checkForUpdates();
    assert.strictEqual(portableUpdater.checkCount, 0);

    assert.strictEqual(packageJson.dependencies['electron-updater'], '^6.8.9');
    assert.deepStrictEqual(packageJson.build.publish[0], {
        provider: 'github',
        owner: 'Cherofre',
        repo: 'fbx-quick-viewer'
    });
    assert.strictEqual(packageJson.build.appId, 'com.viewer.fbx');
    assert.strictEqual(packageJson.build.nsis.oneClick, false);
    assert.strictEqual(packageJson.build.nsis.allowToChangeInstallationDirectory, true);
    assert.strictEqual(packageJson.build.nsis.deleteAppDataOnUninstall, false);
    assert.strictEqual(packageJson.build.nsis.include, 'build/installer.nsh');
    assert.strictEqual(packageJson.build.nsis.artifactName, 'fbx-quick-viewer.Setup.${version}.${ext}');
    assert.strictEqual(packageJson.build.portable.artifactName, 'fbx-quick-viewer.${version}.${ext}');
    assert(packageJson.build.files.includes('auto-update.js'));

    assert(mainJs.includes("require('electron-updater')"));
    assert(mainJs.includes("ipcMain.handle('install-downloaded-update'"));
    assert(preloadJs.includes('onUpdateStatus(callback)'));
    assert(indexHtml.includes('id="update-download-status"'));
    assert(indexHtml.includes('正在后台下载'));
    assert(indexHtml.includes("dialog.show();"));
    assert(!indexHtml.includes("document.getElementById('update-dialog').showModal()"));
    assert(installerNsh.includes('${if} ${isUpdated}'));
    assert(installerNsh.includes('Rename "$INSTDIR\\FBX_Data" "$INSTDIR.FBX_Data-update-backup"'));
    assert(installerNsh.includes('Rename "$INSTDIR.FBX_Data-update-backup" "$INSTDIR\\FBX_Data"'));

    console.log('v1.0.5 auto-update checks passed');
}

run().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
