const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const orbitControls = fs.readFileSync(path.join(root, 'libs', 'OrbitControls.js'), 'utf8');

assert(orbitControls.includes('this.enableMaxStyleMiddleButton = false;'), 'OrbitControls should expose Max-style middle-button switching');
assert(orbitControls.includes("? ( event.altKey ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN )"), 'middle-button press should honor Alt immediately');
assert(orbitControls.includes("scope.enableMaxStyleMiddleButton && ( event.buttons & 4 ) !== 0"), 'middle-button drag should detect modifier changes');
assert(orbitControls.includes('const nextState = event.altKey ? STATE.ROTATE : STATE.PAN;'), 'drag state should switch between pan and rotate');
assert(orbitControls.includes('handleMouseDownRotate( event );'), 'switching to rotate should reset the drag origin');
assert(orbitControls.includes('handleMouseDownPan( event );'), 'switching back to pan should reset the drag origin');

assert(indexHtml.includes('controls.enableMaxStyleMiddleButton = true;'), 'Max navigation mode should enable dynamic middle-button switching');
assert(indexHtml.includes('controls.enableMaxStyleMiddleButton = false;'), 'default navigation mode should disable Max switching');
assert(!indexHtml.includes('controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;'), 'Alt handling should not only remap future mouse presses');

console.log('v1.0.5 Max navigation checks passed');
