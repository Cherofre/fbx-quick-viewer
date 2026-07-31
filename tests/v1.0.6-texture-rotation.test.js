const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const textureLoadStart = indexHtml.indexOf('const onLoad = (texture) => {');
const textureLoadEnd = indexHtml.indexOf('const onError =', textureLoadStart);
const textureLoadBlock = indexHtml.slice(textureLoadStart, textureLoadEnd);

function assertContains(text, label) {
    assert(indexHtml.includes(text), `renderer should contain ${label}: ${JSON.stringify(text)}`);
}

assertContains('id="rotationAngle"', 'texture angle input');
assertContains('id="rotationSpeed"', 'texture rotation speed input');
assertContains('data-reset-input="rotationAngle"', 'texture angle reset action');
assertContains('data-reset-input="rotationSpeed"', 'texture rotation speed reset action');
assertContains('rotationAngle: readUVNumber(\'rotationAngle\', 0)', 'texture angle history state');
assertContains('rotationSpeed: readUVNumber(\'rotationSpeed\', 0)', 'texture speed history state');
assertContains("setUVInputValue('rotationAngle', state.rotationAngle);", 'texture angle undo restore');
assertContains("setUVInputValue('rotationSpeed', state.rotationSpeed);", 'texture speed undo restore');
assertContains('matUV.map.center.set(0.5, 0.5);', 'centered texture rotation');
assertContains('matUV.map.rotation = angleDegrees * Math.PI / 180;', 'degree-to-radian conversion');
assertContains('function advanceUVRotation(deltaSeconds)', 'time-based texture rotation');
assertContains('let uvRotationPhaseDegrees = 0;', 'independent rotation animation phase');
assertContains('uvRotationPhaseDegrees + rotationSpeed * deltaSeconds', 'frame-rate-independent rotation phase');
assertContains('applyUVTextureRotation(baseAngle + uvRotationPhaseDegrees);', 'fixed angle plus animated phase');
assertContains('function resetUVRotationPhase()', 'rotation phase reset');
assertContains('Math.min(Math.max((frameTimestamp - lastAnimationTimestamp) / 1000, 0), 0.1)', 'resume jump clamp');
assertContains("{ labelId: 'lbl-rotationAngle', inputId: 'rotationAngle', defaultValue: 0, dragStep: 0.25, keyStep: 1 }", 'angle scrubbing');
assertContains("{ labelId: 'lbl-rotationSpeed', inputId: 'rotationSpeed', defaultValue: 0, dragStep: 0.25, keyStep: 1 }", 'speed scrubbing');
assertContains('角度是固定基础角度；速度单位为度/秒，在基础角度上持续旋转', 'rotation help text');
assertContains('updateUVMax();', 'new texture parameter preservation');
assert(textureLoadStart >= 0 && textureLoadEnd > textureLoadStart, 'texture load handler should be discoverable');
assert(textureLoadBlock.includes('updateUVMax();') && textureLoadBlock.includes('updateUVWrap();'), 'new texture should inherit current preview parameters');
assert(!textureLoadBlock.includes('resetUVParams();'), 'new texture should not reset preview parameters');

console.log('v1.0.6 texture rotation checks passed');
