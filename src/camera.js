import { aircraftState } from './aircraft.js';

let isPerspective  = true;
let canToggle      = true;
let prevOffset;

export function setCamera() {
  if (!canToggle) return;
  isPerspective = !isPerspective;
  canToggle = false;
  setTimeout(() => { canToggle = true; }, 200);
}

export function updateCamera() {
  const { position, x, y, z } = aircraftState;

  let offsetX, offsetY, offsetZ;
  if (!isPerspective) {
    offsetX = 0; offsetY = 2; offsetZ = -6;   // 3ª pessoa
  } else {
    offsetX = 0; offsetY = 1; offsetZ = -1.4; // 1ª pessoa
  }

  const target = [
    x[0]*offsetX + y[0]*offsetY + z[0]*offsetZ,
    x[1]*offsetX + y[1]*offsetY + z[1]*offsetZ,
    x[2]*offsetX + y[2]*offsetY + z[2]*offsetZ,
  ];

  if (typeof prevOffset === 'undefined') prevOffset = target;

  const smooth = 0.08;
  const offset = prevOffset.map((v, i) => v + smooth * (target[i] - v));
  prevOffset = offset;

  const P0 = [
    position[0] + offset[0],
    position[1] + offset[1],
    position[2] + offset[2],
  ];

  return { P0, P_ref: [...position], V: [...y] };
}
