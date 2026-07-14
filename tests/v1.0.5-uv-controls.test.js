const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function assertContains(text, label) {
    assert(indexHtml.includes(text), `renderer should contain ${label}: ${JSON.stringify(text)}`);
}

function assertNotContains(text, label) {
    assert(!indexHtml.includes(text), `renderer should not contain ${label}: ${JSON.stringify(text)}`);
}

assertContains('function readUVNumber(inputId, fallback)', 'zero-safe UV number parsing');
assertContains('return Number.isFinite(value) ? value : fallback;', 'finite-value fallback');
assertNotContains("parseFloat(document.getElementById('tileU').value) || 1", 'the old zero-breaking tile fallback');

assertContains('const UV_HISTORY_LIMIT = 50;', 'bounded UV history');
assertContains('const controlConfig = [', 'startup-safe UV control configuration');
assertContains('controlConfig.forEach(setupDrag);', 'UV control initialization');
assertNotContains('const UV_CONTROL_CONFIG = [', 'late global UV configuration');
assertContains('function undoUVChange()', 'UV undo');
assertContains('function redoUVChange()', 'UV redo');
assertContains("const wantsUndo = hasCommandModifier && key === 'z' && !e.shiftKey;", 'Ctrl+Z handling');
assertContains("const wantsRedo = hasCommandModifier && (key === 'y' || (key === 'z' && e.shiftKey));", 'redo shortcuts');
assertContains('if (wantsUndo) undoUVChange();', 'undo shortcut routing');

assertContains("dragStep: 0.002", 'fine offset dragging');
assertContains('const multiplier = e.shiftKey ? 0.1 : (e.ctrlKey ? 10 : 1);', 'fine and coarse modifiers');
assertContains("span.addEventListener('dblclick'", 'single-parameter reset');
assertContains('const UV_CONTROL_DEFAULTS = {', 'individual UV reset defaults');
assertContains('function updateUVResetButtons()', 'conditional UV reset affordances');
assertContains('function resetUVControl(inputId)', 'visible single-control reset action');
assertContains('data-reset-input="tileU"', 'tiling reset button');
assertContains('class="scrub-label"', 'visible horizontal drag affordance');
assertContains('visibility: hidden;', 'layout-stable hidden reset action');
assertContains('.uv-reset-btn.visible { visibility: visible; opacity: 1; pointer-events: auto; }', 'layout-stable visible reset action');
assertContains('requestAnimationFrame(() => input.select());', 'easy direct value replacement');

assertContains('resetUVMax({ recordHistory: false });', 'current UV reset path');
assertContains('clearUVHistory();', 'history reset for a new texture');
assertNotContains("document.getElementById('tilingRange')", 'removed legacy UV controls');
assertNotContains("document.getElementById('flowSpeed')", 'removed legacy flow controls');
assertContains('initApp().catch(error => {', 'visible initialization failure handling');
assertContains('animationFrameRequestId = requestAnimationFrame(animate);', 'continuous render scheduling');
assert(
    indexHtml.lastIndexOf('initApp().catch(error => {') > indexHtml.indexOf("window.addEventListener('keyup'"),
    'application startup should happen after all control state and event handlers are declared'
);

console.log('v1.0.5 UV control checks passed');
