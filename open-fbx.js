const fs = require('fs');
const path = require('path');

function findOpenFbxPath(args) {
    for (const rawArg of Array.isArray(args) ? args : []) {
        if (typeof rawArg !== 'string') continue;
        const candidate = rawArg.trim().replace(/^"(.*)"$/, '$1');
        if (!candidate || candidate.startsWith('-') || path.extname(candidate).toLowerCase() !== '.fbx') continue;

        try {
            const resolvedPath = path.resolve(candidate);
            if (fs.statSync(resolvedPath).isFile()) return resolvedPath;
        } catch (error) {
            // Ignore missing or inaccessible command-line paths.
        }
    }
    return '';
}

module.exports = { findOpenFbxPath };
