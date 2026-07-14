function isInstalledAutoUpdateBuild(app, env = process.env, platform = process.platform) {
    return platform === 'win32' && !!app && app.isPackaged === true && !env.PORTABLE_EXECUTABLE_DIR;
}

function clampPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
}

function createAutoUpdateController(options) {
    const {
        app,
        autoUpdater,
        env = process.env,
        platform = process.platform,
        onStatus = () => {},
        saveBeforeInstall = () => {},
        schedule = setTimeout,
        logger = console
    } = options;

    let initialized = false;
    let checkPromise = null;
    let state = {
        supported: isInstalledAutoUpdateBuild(app, env, platform),
        status: 'idle',
        version: '',
        percent: 0,
        transferred: 0,
        total: 0,
        bytesPerSecond: 0,
        error: ''
    };

    function getState() {
        return { ...state };
    }

    function setState(status, patch = {}) {
        state = {
            ...state,
            ...patch,
            status,
            supported: state.supported
        };
        onStatus(getState());
        return getState();
    }

    function setup() {
        if (initialized) return getState();
        initialized = true;

        if (!state.supported) {
            state.status = 'unsupported';
            return getState();
        }

        autoUpdater.logger = logger;
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = false;
        autoUpdater.autoRunAppAfterInstall = true;
        autoUpdater.allowPrerelease = false;
        autoUpdater.disableWebInstaller = true;

        autoUpdater.on('checking-for-update', () => {
            if (state.status !== 'downloading' && state.status !== 'downloaded') {
                setState('checking', { error: '' });
            }
        });

        autoUpdater.on('update-available', info => {
            setState('downloading', {
                version: String(info && info.version ? info.version : ''),
                percent: 0,
                transferred: 0,
                total: 0,
                bytesPerSecond: 0,
                error: ''
            });
        });

        autoUpdater.on('download-progress', progress => {
            setState('downloading', {
                percent: clampPercent(progress && progress.percent),
                transferred: Number(progress && progress.transferred) || 0,
                total: Number(progress && progress.total) || 0,
                bytesPerSecond: Number(progress && progress.bytesPerSecond) || 0,
                error: ''
            });
        });

        autoUpdater.on('update-downloaded', info => {
            setState('downloaded', {
                version: String(info && info.version ? info.version : state.version),
                percent: 100,
                transferred: state.total || state.transferred,
                error: ''
            });
        });

        autoUpdater.on('update-not-available', info => {
            setState('idle', {
                version: String(info && info.version ? info.version : ''),
                percent: 0,
                transferred: 0,
                total: 0,
                bytesPerSecond: 0,
                error: ''
            });
        });

        autoUpdater.on('error', error => {
            setState('error', {
                error: error && error.message ? error.message : String(error || 'Unknown update error')
            });
        });

        return getState();
    }

    async function checkForUpdates() {
        setup();
        if (!state.supported) return { result: null, state: getState() };
        if (state.status === 'downloading' || state.status === 'downloaded') {
            return { result: null, state: getState() };
        }
        if (checkPromise) return checkPromise;

        setState('checking', { error: '' });
        checkPromise = autoUpdater.checkForUpdates()
            .then(result => {
                if (!result && state.status === 'checking') setState('idle');
                if (result && result.downloadPromise) result.downloadPromise.catch(() => {});
                return { result, state: getState() };
            })
            .finally(() => {
                checkPromise = null;
            });

        return checkPromise;
    }

    function installDownloadedUpdate() {
        setup();
        if (!state.supported || state.status !== 'downloaded') return false;

        saveBeforeInstall();
        schedule(() => autoUpdater.quitAndInstall(true, true), 150);
        return true;
    }

    return {
        setup,
        getState,
        checkForUpdates,
        installDownloadedUpdate
    };
}

module.exports = {
    clampPercent,
    createAutoUpdateController,
    isInstalledAutoUpdateBuild
};
