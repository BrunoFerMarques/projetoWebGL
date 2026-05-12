import { m4 } from './m4.js';
import {
  setCubeVertices, setCubeNormals, setCubeTexCoords,
  setSphereVertices, setSphereNormals_smooth, setSphereTexCoords,
  setRingVertices, setRingNormals, setRingTexCoords,
} from './geometry.js';

let gl, program;
let positionLocation, normalLocation, texCoordLocation;
let matrixLoc, modelMatrixLoc, normalMatrixLoc;

let positionBufferCube, normalBufferCube, texCoordBufferCube;
let positionBufferSphere, normalBufferSphere, texCoordBufferSphere;
let positionBufferRing, normalBufferRing, texCoordBufferRing;
let vertexDataCube, vertexDataSphere, vertexDataRing;

export function initRenderer(glCtx, prog) {
  gl = glCtx;
  program = prog;

  positionLocation = gl.getAttribLocation(program, 'a_Position');
  normalLocation   = gl.getAttribLocation(program, 'a_Normal');
  texCoordLocation = gl.getAttribLocation(program, 'a_TexCoord');

  matrixLoc       = gl.getUniformLocation(program, 'matrix');
  modelMatrixLoc  = gl.getUniformLocation(program, 'u_ModelMatrix');
  normalMatrixLoc = gl.getUniformLocation(program, 'u_NormalMatrix');

  vertexDataCube = setCubeVertices();
  positionBufferCube  = _createBuffer(vertexDataCube,            3);
  normalBufferCube    = _createBuffer(setCubeNormals(),          3);
  texCoordBufferCube  = _createBuffer(setCubeTexCoords(),        2);

  vertexDataSphere = setSphereVertices(1, 80, 80);
  positionBufferSphere  = _createBuffer(vertexDataSphere,              3);
  normalBufferSphere    = _createBuffer(setSphereNormals_smooth(1,80,80), 3);
  texCoordBufferSphere  = _createBuffer(setSphereTexCoords(80, 80),     2);

  vertexDataRing = setRingVertices(1, 0.4, 100, 60);
  positionBufferRing  = _createBuffer(vertexDataRing,                3);
  normalBufferRing    = _createBuffer(setRingNormals(100, 60),       3);
  texCoordBufferRing  = _createBuffer(setRingTexCoords(100, 60),     2);
}

function _createBuffer(data, size) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buf;
}

function _bindBuffer(buf, location, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(location);
}

export function loadTexture(url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255]));
  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (_isPow2(image.width) && _isPow2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;
  return texture;
}

function _isPow2(v) { return (v & (v - 1)) === 0; }

/*
 * drawShape(viewProjMatrix, modelMatrix, texture, mode, type, shininess)
 *
 * viewProjMatrix — Projection × View  (sem model)
 * modelMatrix    — transformações do objeto em world space
 *
 * O shader recebe:
 *   matrix        = viewProjMatrix × modelMatrix  → gl_Position
 *   u_ModelMatrix = modelMatrix                   → vPosition (world space)
 *   u_NormalMatrix = transpose(inverse(model))    → vNormal (world space)
 */
export function drawShape(viewProjMatrix, modelMatrix, texture, mode, type, shininess) {
  const mvp          = m4.multiply(viewProjMatrix, modelMatrix);
  const normalMatrix = m4.transpose(m4.inverse(modelMatrix));

  gl.uniform1f(gl.getUniformLocation(program, 'u_Shininess'), shininess);
  gl.uniformMatrix4fv(matrixLoc,       false, mvp);
  gl.uniformMatrix4fv(modelMatrixLoc,  false, modelMatrix);
  gl.uniformMatrix4fv(normalMatrixLoc, false, normalMatrix);

  let posBuf, normBuf, texBuf, count;
  if (type === 'cube') {
    posBuf = positionBufferCube;  normBuf = normalBufferCube;
    texBuf = texCoordBufferCube;  count   = vertexDataCube.length / 3;
  } else if (type === 'sphere') {
    posBuf = positionBufferSphere; normBuf = normalBufferSphere;
    texBuf = texCoordBufferSphere; count   = vertexDataSphere.length / 3;
  } else if (type === 'ring') {
    posBuf = positionBufferRing;  normBuf = normalBufferRing;
    texBuf = texCoordBufferRing;  count   = vertexDataRing.length / 3;
  }

  _bindBuffer(posBuf,  positionLocation, 3);
  _bindBuffer(normBuf, normalLocation,   3);
  _bindBuffer(texBuf,  texCoordLocation, 2);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, 'u_Texture'), 0);

  gl.drawArrays(mode, 0, count);
}

export function setAmbientLight() {
  gl.uniform3fv(gl.getUniformLocation(program, 'u_AmbientColor'), [1, 1, 1]);
  gl.uniform1f(gl.getUniformLocation(program, 'u_AmbientIntensity'), 0.15);
}

/*
 * Luzes dinâmicas: 1 luz no sol + 7 luzes ao redor da aeronave.
 * Chamada a cada frame com a posição atual da aeronave.
 */
export function updateLights(aircraftPos) {
  const ap = aircraftPos;
  const positions = new Float32Array([
    // Luz do sol
     0,      0,      0,
    // Luzes ao redor da aeronave (iluminação local)
     ap[0]+3, ap[1]+3, ap[2],
     ap[0]-3, ap[1]+3, ap[2],
     ap[0],   ap[1]-3, ap[2]+3,
     ap[0],   ap[1]-3, ap[2]-3,
     ap[0]+3, ap[1],   ap[2]+3,
     ap[0]-3, ap[1],   ap[2]-3,
     ap[0],   ap[1]+3, ap[2]-3,
  ]);

  const colors = new Float32Array([
    1.0, 0.95, 0.8,   // sol — branco-amarelado
    0.8, 0.9,  1.0,   // aeronave — azul-branco
    0.8, 0.9,  1.0,
    0.8, 0.9,  1.0,
    0.8, 0.9,  1.0,
    0.8, 0.9,  1.0,
    0.8, 0.9,  1.0,
    0.8, 0.9,  1.0,
  ]);

  gl.uniform3fv(gl.getUniformLocation(program, 'u_LightPositions'), positions);
  gl.uniform3fv(gl.getUniformLocation(program, 'u_LightColors'),    colors);
  gl.uniform1f(gl.getUniformLocation(program, 'u_LightIntensity'),  1.2);
}

export function getGl()      { return gl; }
export function getProgram() { return program; }
