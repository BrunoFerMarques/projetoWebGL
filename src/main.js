import { vertexShaderSource, fragmentShaderSource } from './shaders.js';
import { initRenderer, setAmbientLight, updateLights } from './renderer.js';
import { m4 } from './m4.js';
import { crossProduct, unitVector } from './mathUtils.js';
import { controls } from './controls.js';
import { aircraftState, updatePhysics, resetAircraft } from './aircraft.js';
import { updateCamera, setCamera } from './camera.js';
import { initSpaceships, drawSpaceship1, drawSpaceship2 } from './spaceships.js';
import { initPlanets, drawPlanets, drawBackground, resetPlanets } from './planets.js';
import { initRings, drawRings, resetRings, ringCounter } from './rings.js';
import {
  checkSunCollision, checkVenusCollision,
  checkMercuryCollision, checkBackgroundCollision,
} from './collisions.js';

// ── WebGL setup ────────────────────────────────────────────────────────────────
const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, Antialias: true });
if (!gl) throw new Error('WebGL not supported');

function _compileShader(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('Shader error:', gl.getShaderInfoLog(s));
  return s;
}

function _linkProgram(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error('Program error:', gl.getProgramInfoLog(p));
  return p;
}

const program = _linkProgram(
  _compileShader(gl.VERTEX_SHADER,   vertexShaderSource),
  _compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource),
);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);
gl.viewport(0, 0, 500, 500);

// Inicializa subsistemas (ordem importa: renderer primeiro)
initRenderer(gl, program);
initSpaceships();
initPlanets();
initRings();
setAmbientLight();

// ── Matrizes de câmera / projeção ──────────────────────────────────────────────
function perspectiveProjection(xMin, xMax, yMin, yMax, zNear, zFar) {
  return [
    -(2*zNear)/(xMax-xMin), 0, 0, 0,
    0, -(2*zNear)/(yMax-yMin), 0, 0,
    (xMax+xMin)/(xMax-xMin), (yMax+yMin)/(yMax-yMin), (zNear+zFar)/(zNear-zFar), -1,
    0, 0, -1, 0,
  ];
}

function set3dViewingMatrix(P0, P_ref, V) {
  const N = [P0[0]-P_ref[0], P0[1]-P_ref[1], P0[2]-P_ref[2]];
  const n = unitVector(N);
  const u = unitVector(crossProduct(V, n));
  const v = crossProduct(n, u);
  const T = [1,0,0,0, 0,1,0,0, 0,0,1,0, -P0[0],-P0[1],-P0[2],1];
  const R = [u[0],v[0],n[0],0, u[1],v[1],n[1],0, u[2],v[2],n[2],0, 0,0,0,1];
  return m4.multiply(R, T);
}

// ── Estado do jogo ─────────────────────────────────────────────────────────────
let isSpaceship1 = false;

function resetGame() {
  resetAircraft();
  resetPlanets();
  resetRings();
}

function handleKeys() {
  if (controls['r']) { resetGame();                   controls['r'] = false; }
  if (controls['c']) { setCamera();                   controls['c'] = false; }
  if (controls['1']) { isSpaceship1 = !isSpaceship1; controls['1'] = false; }
}

// ── Loop principal ─────────────────────────────────────────────────────────────
function main() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  handleKeys();

  // 1. Atualiza física (uma vez por frame, antes de qualquer desenho)
  updatePhysics();

  // 2. Atualiza luzes com posição atual da aeronave
  updateLights(aircraftState.position);

  // 3. Monta viewProj = Projection × View (sem model)
  const proj    = perspectiveProjection(-1, 1, -1, 1, -1, -500);
  const { P0, P_ref, V } = updateCamera();
  const view    = set3dViewingMatrix(P0, P_ref, V);
  const viewProj = m4.multiply(proj, view);

  // 4. Renderiza
  isSpaceship1 ? drawSpaceship1(viewProj) : drawSpaceship2(viewProj);
  drawRings(viewProj);
  drawBackground(viewProj);
  drawPlanets(viewProj);

  // 5. Colisões
  if (checkSunCollision())        { alert('Você queimou!');           resetGame(); }
  if (checkVenusCollision())      { alert('Você bateu em Vênus!');    resetGame(); }
  if (checkMercuryCollision())    { alert('Você bateu em Mercúrio!'); resetGame(); }
  if (checkBackgroundCollision()) { alert('Você saiu do mapa!');      resetGame(); }

  // 6. Vitória
  if (ringCounter >= 20) {
    alert('Parabéns! Você coletou todos os anéis! 🎉');
    resetGame();
  }

  requestAnimationFrame(main);
}

main();
