import { m4 } from './m4.js';
import { applyAxisAngle, unitVector, buildRotationMatrix } from './mathUtils.js';
import { controls } from './controls.js';

const MAX_SPEED    = 0.2;
const ACCELERATION = 0.0002;
const DECELERATION = 0.0005;

export const aircraftState = {
  position: [-8, 7, -4],
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
  pitch: 0,
  roll:  0,
  speed: 0,
};

// Atualiza física — chame UMA VEZ por frame antes de desenhar
export function updatePhysics() {
  const s = aircraftState;

  if (controls['a']) s.roll  -= 0.2;
  if (controls['d']) s.roll  += 0.2;
  if (controls['w']) s.pitch -= 0.2;
  if (controls['s']) s.pitch += 0.2;
  if (controls[' ']) s.speed += ACCELERATION;
  if (controls['x']) s.speed -= DECELERATION;

  s.pitch *= 0.095;
  s.roll  *= 0.095;
  s.speed  = Math.max(0, Math.min(s.speed, MAX_SPEED));

  s.x = applyAxisAngle(s.z, s.roll,  s.x);
  s.y = applyAxisAngle(s.z, s.roll,  s.y);
  s.y = applyAxisAngle(s.x, s.pitch, s.y);
  s.z = applyAxisAngle(s.x, s.pitch, s.z);

  s.x = unitVector(s.x);
  s.y = unitVector(s.y);
  s.z = unitVector(s.z);

  s.position[0] += s.z[0] * s.speed;
  s.position[1] += s.z[1] * s.speed;
  s.position[2] += s.z[2] * s.speed;
}

// Retorna a model matrix da aeronave em world space (translação × rotação)
export function getAircraftMatrix() {
  const s = aircraftState;
  const rot   = buildRotationMatrix(s.x, s.y, s.z);
  const trans = m4.translate(m4.identity(), s.position[0], s.position[1], s.position[2]);
  return m4.multiply(trans, rot);
}

export function resetAircraft() {
  aircraftState.position = [-8, 7, -4];
  aircraftState.x = [1, 0, 0];
  aircraftState.y = [0, 1, 0];
  aircraftState.z = [0, 0, 1];
  aircraftState.pitch = 0;
  aircraftState.roll  = 0;
  aircraftState.speed = 0;
}
