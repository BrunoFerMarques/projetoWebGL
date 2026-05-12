import { m4 } from './m4.js';
import { drawShape, loadTexture, getGl } from './renderer.js';
import { aircraftState } from './aircraft.js';

let ringTexture;
let thetaRings = 0;

export let ringPositions = [];
export let ringCounter   = 0;

export function initRings() {
  ringTexture = loadTexture('./public/textures/2k_saturn_ring_alpha.png');
}

export function resetRings() {
  ringPositions = [];
  ringCounter   = 0;
  generateRingPositions(20);
}

export function generateRingPositions(count) {
  const sunRadius = 7;
  for (let i = 0; i < count; i++) {
    let rx, ry, rz;
    do {
      rx = (Math.random() - 0.5) * 50;
      ry = (Math.random() - 0.5) * 50;
      rz = (Math.random() - 0.5) * 50;
    } while (Math.sqrt(rx*rx + ry*ry + rz*rz) < sunRadius + 2);
    ringPositions.push([rx, ry, rz]);
  }
}

export function checkAndRemoveRings() {
  for (let i = 0; i < ringPositions.length; i++) {
    if (ringCounter >= 20) break;
    if (_isColliding(ringPositions[i])) {
      ringPositions.splice(i, 1);
      ringCounter++;
      console.log('Anel pego! Total: ' + ringCounter);
      document.getElementById('ring-counter').textContent =
        'Anéis coletados: ' + ringCounter + ' de 20';
      i--;
    }
  }
}

function _isColliding(pos) {
  const p = aircraftState.position;
  return Math.sqrt((p[0]-pos[0])**2 + (p[1]-pos[1])**2 + (p[2]-pos[2])**2) < 2;
}

export function drawRings(viewProj) {
  const gl = getGl();
  checkAndRemoveRings();
  for (const pos of ringPositions) {
    const model = m4.yRotate(
      m4.translate(m4.identity(), pos[0], pos[1], pos[2]),
      thetaRings += 0.001
    );
    drawShape(viewProj, model, ringTexture, gl.TRIANGLE_STRIP, 'ring', 36);
  }
}
