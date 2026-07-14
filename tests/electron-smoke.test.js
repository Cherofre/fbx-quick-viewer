const assert = require('assert');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const electronPath = require('electron');
const root = path.resolve(__dirname, '..');
const smokeMs = 30000;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function forceKill(pid) {
    return new Promise(resolve => {
        if (!pid || process.platform !== 'win32') {
            resolve();
            return;
        }
        execFile('taskkill', ['/pid', String(pid), '/T', '/F'], () => resolve());
    });
}

function releaseChildHandles(child) {
    if (child.stdout) child.stdout.destroy();
    if (child.stderr) child.stderr.destroy();
    child.removeAllListeners();
    child.unref();
}

async function runSmoke() {
    const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fbx-quick-viewer-smoke-'));
    const smokeFile = path.join(smokeDir, 'smoke.fbx');
    fs.writeFileSync(smokeFile, 'SMOKE_LOCAL_FILE\n', 'utf8');

    const smokeUserDataDir = path.join(smokeDir, 'user-data');
    const child = spawn(electronPath, [`--user-data-dir=${smokeUserDataDir}`, '.'], {
        cwd: root,
        env: {
            ...process.env,
            FBX_QUICK_VIEWER_SMOKE: '1',
            FBX_QUICK_VIEWER_SMOKE_FILE: smokeFile
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
    });

    let output = '';
    let exitInfo = null;

    child.stdout.on('data', chunk => { output += chunk.toString(); });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('exit', (code, signal) => {
        exitInfo = { code, signal };
    });

    const startedAt = Date.now();
    while (!exitInfo && !output.includes('Smoke check passed:') && Date.now() - startedAt < smokeMs) {
        await wait(100);
    }

    const smokePassed = output.includes('Smoke check passed:');
    if (!exitInfo && !smokePassed) {
        child.kill();
        await forceKill(child.pid);
        assert.fail(`Electron did not finish smoke checks within ${smokeMs}ms\n${output}`);
    }

    if (smokePassed && !exitInfo) {
        const gracefulExitDeadline = Date.now() + 5000;
        while (!exitInfo && Date.now() < gracefulExitDeadline) {
            await wait(100);
        }
    }

    if (!exitInfo) {
        child.kill();
        await forceKill(child.pid);
    } else {
        assert.strictEqual(
            exitInfo.code,
            0,
            `Electron smoke exited with ${JSON.stringify(exitInfo)}\n${output}`
        );
    }

    assert(smokePassed, `Electron smoke did not report success:\n${output}`);

    assert(
        !/(ReferenceError|SyntaxError|Uncaught|Cannot find module)/i.test(output),
        `Electron startup output contains a crash-like error:\n${output}`
    );

    releaseChildHandles(child);
    await wait(500);
    try {
        fs.rmSync(smokeDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (error) {
        console.warn(`Smoke temp cleanup deferred: ${error.message}`);
    }
    console.log('electron smoke checks passed');
}

runSmoke().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
