const assert = require('assert');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const electronPath = require('electron');
const root = path.resolve(__dirname, '..');
const smokeMs = 10000;

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

async function runSmoke() {
    const smokeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fbx-quick-viewer-smoke-'));
    const smokeFile = path.join(smokeDir, 'smoke.fbx');
    fs.writeFileSync(smokeFile, 'SMOKE_LOCAL_FILE\n', 'utf8');

    const child = spawn(electronPath, ['.'], {
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

    await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        wait(smokeMs)
    ]);

    if (!exitInfo) {
        child.kill();
        await forceKill(child.pid);
        assert.fail(`Electron did not finish smoke checks within ${smokeMs}ms\n${output}`);
    }

    assert.strictEqual(
        exitInfo.code,
        0,
        `Electron smoke exited with ${JSON.stringify(exitInfo)}\n${output}`
    );

    assert(
        !/(ReferenceError|SyntaxError|Uncaught|Cannot find module)/i.test(output),
        `Electron startup output contains a crash-like error:\n${output}`
    );

    fs.rmSync(smokeDir, { recursive: true, force: true });
    console.log('electron smoke checks passed');
}

runSmoke().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
