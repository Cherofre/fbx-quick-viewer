const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { findRelatedMeshPath } = require('../mesh-path');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fbx-mesh-path-'));

try {
    const assetDir = path.join(tempRoot, 'asset');
    const fbxDir = path.join(assetDir, 'fbx');
    fs.mkdirSync(fbxDir, { recursive: true });

    const fbxPath = path.join(fbxDir, 'example.fbx');
    const parentMeshPath = path.join(assetDir, 'example.mesh');
    const sameDirMeshPath = path.join(fbxDir, 'example.mesh');
    fs.writeFileSync(fbxPath, 'fbx');
    fs.writeFileSync(parentMeshPath, 'mesh');

    assert.strictEqual(findRelatedMeshPath(fbxPath), parentMeshPath, 'should find a same-name mesh in the parent directory');

    fs.writeFileSync(sameDirMeshPath, 'mesh');
    assert.strictEqual(findRelatedMeshPath(fbxPath), sameDirMeshPath, 'same-directory mesh should take priority');

    fs.rmSync(sameDirMeshPath);
    fs.rmSync(parentMeshPath);
    assert.strictEqual(findRelatedMeshPath(fbxPath), '', 'missing mesh should return an empty path');
    assert.strictEqual(findRelatedMeshPath(path.join(fbxDir, 'missing.fbx')), '', 'missing FBX should be rejected');
    assert.strictEqual(findRelatedMeshPath(path.join(fbxDir, 'example.mesh')), '', 'non-FBX source should be rejected');

    console.log('mesh path resolution checks passed');
} finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
}
