const fs = require('fs');
const path = require('path');

function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (error) {
        return false;
    }
}

function findRelatedMeshPath(fbxPath) {
    if (!fbxPath || typeof fbxPath !== 'string' || !path.isAbsolute(fbxPath)) return '';

    const resolvedFbxPath = path.resolve(fbxPath);
    if (path.extname(resolvedFbxPath).toLowerCase() !== '.fbx' || !isFile(resolvedFbxPath)) return '';

    const meshName = `${path.basename(resolvedFbxPath, path.extname(resolvedFbxPath))}.mesh`;
    let currentDir = path.dirname(resolvedFbxPath);

    while (true) {
        const candidatePath = path.join(currentDir, meshName);
        if (isFile(candidatePath)) return candidatePath;

        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) return '';
        currentDir = parentDir;
    }
}

module.exports = { findRelatedMeshPath };
