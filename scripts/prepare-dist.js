const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageLockPath = path.join(projectRoot, 'package-lock.json');
const readmePath = path.join(projectRoot, 'README.md');
const distPath = path.join(projectRoot, 'dist');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertPackageVersionsMatch() {
    const pkg = readJson(packageJsonPath);
    const lock = readJson(packageLockPath);
    const lockRoot = lock.packages && lock.packages[''];

    if (pkg.version !== lock.version || !lockRoot || lockRoot.version !== pkg.version) {
        throw new Error(
            `Version mismatch detected. package.json=${pkg.version}, package-lock.json=${lock.version}, package-lock root=${lockRoot && lockRoot.version}`
        );
    }

    return pkg.version;
}

function assertReadmeMentionsCurrentVersion(version) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    if (!readme.includes(`当前版本：\`v${version}\``)) {
        throw new Error(`README.md does not mention the current version v${version}.`);
    }
}

function cleanDist() {
    fs.rmSync(distPath, { recursive: true, force: true });
}

function main() {
    const version = assertPackageVersionsMatch();
    assertReadmeMentionsCurrentVersion(version);
    cleanDist();
    console.log(`Prepared dist directory for v${version}.`);
}

main();
