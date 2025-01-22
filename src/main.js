const canvas = document.querySelector("#canvas");
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, Antialias: true });

if (!gl) {
    throw new Error('WebGL not supported');
}

var vertexShaderSource = `
precision mediump float;

attribute vec3 a_position;      
attribute vec3 a_color;        
attribute vec2 a_textureCoord;  

varying vec3 vColor;           
varying vec2 v_textureCoord;   

uniform mat4 matrix;            

void main() {
  vColor = a_color;  
  v_textureCoord = a_textureCoord;  
  gl_Position = matrix * vec4(a_position, 1.0); 
}

`
var fragmentShaderSource = `
  precision mediump float;

  uniform bool useTexture;
  uniform sampler2D u_texture;  
  varying vec2 v_textureCoord; 
  varying vec3 vColor;
      
  void main() {
    if (useTexture) {
      gl_FragColor = texture2D(u_texture, v_textureCoord);
    } else {
      gl_FragColor = vec4(vColor, 1.0);
    }
  }


`

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

var program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

gl.enable(gl.DEPTH_TEST);

const matrixUniformLocation = gl.getUniformLocation(program, `matrix`);

gl.clearColor(1.0, 1.0, 1.0, 1.0);

//configuracoes iniciais da camera
gl.viewport(0,0,500,500);

const xw_min = -1.0;
const xw_max = 1.0;
const yw_min = -1.0;
const yw_max = 1.0;
const z_near = -1.0;
const z_far = -80;

// Obtendo localizações de atributos e uniformes
const positionLocation = gl.getAttribLocation(program, "a_position");
  if (positionLocation === -1) {
  console.error("Attribute 'position' not found in the shader program.");
}
const colorLocation = gl.getAttribLocation(program, "a_color");
  if (colorLocation === -1) {
  console.error("Attribute 'color' not found in the shader program.");
}




let x = [1,0,0]
let y = [0,1,0]
let z = [0,0,1]
let pitch = 0
let roll = 0
let speed = 0;  // Velocidade inicial
let maxSpeed = 0.1; // Velocidade máxima
let acceleration = 0.002; // Taxa de aceleração
let deceleration = 0.005;

let planePosition = [0,0,0]



const controls = {};
window.addEventListener('keydown', (e) => {
  controls[e.key.toLowerCase()] = true;
  console.log(e.key)
});
window.addEventListener('keyup', (e) => {
  controls[e.key.toLowerCase()] = false;
});



// Função principal de atualização
function updateAirplane(matrixAeronave) {
  // Controles
  if (controls['a']) pitch -= 0.2; // Guinada para a esquerda
  if (controls['d']) pitch += 0.2; // Guinada para a direita
  if (controls['w']) roll -= 0.2; // Rolagem para cima
  if (controls['s']) roll += 0.2; // Rolagem para baixo
  if (controls[' ']) speed += acceleration; // Aumentar velocidade
  if (controls['x']) speed -= deceleration; // Diminuir velocidade
  pitch *= 0.095
  roll *= 0.095

  speed = Math.min(speed, maxSpeed);
  speed = Math.max(speed, 0); 

  x = applyAxisAngle(z, pitch, x)
  y = applyAxisAngle(z, pitch, y)
  y = applyAxisAngle(x, roll, y)
  z = applyAxisAngle(x, roll, z)

  x = unitVector(x)
  y = unitVector(y)
  z = unitVector(z)

  planePosition[0] += z[0] * speed
  planePosition[1] += z[1] * speed
  planePosition[2] += z[2] * speed
  let rotMatrix = m4.identity()
  rotMatrix = buildRotationMatrix(x, y, z) 
  let translateMatrix = m4.translate(m4.identity(), planePosition[0], planePosition[1], planePosition[2])  
  matrixAeronave = m4.multiply(matrixAeronave, translateMatrix)
  matrixAeronave = m4.multiply(matrixAeronave, rotMatrix)

  return matrixAeronave;
}



function drawSpaceship2(viewingProjectionMatrix){
  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = m4.scale(matrixAeronave, 0.2, 0.2, 0.2); // Escala da aeronave
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  // Corpo da aeronave
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.3, 0.3, 1); // Escala do corpo
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixCorpo, vertexDataCube.length, gl.TRIANGLES);

  // Asa esquerda
  let matrixAsaEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaEsq = m4.scale(matrixAsaEsq, 0.6, 0.2, 0.3);
  matrixAsaEsq = m4.translate(matrixAsaEsq, -0.75, 0, -0.9); // Translação da asa esquerda
  
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixAsaEsq, vertexDataCube.length, gl.TRIANGLES);

  // Asa direita
  let matrixAsaDir = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaDir = m4.scale(matrixAsaDir, 0.6, 0.2, 0.3)
  matrixAsaDir = m4.translate(matrixAsaDir, 0.75, 0, -0.9); // Translação da asa direita
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixAsaDir, vertexDataCube.length, gl.TRIANGLES);
  let matrixCable = m4.multiply(matrixAeronave, m4.identity());
  matrixCable = m4.scale(matrixAsaDir, 0.1, 0.4, 0.1)
  matrixCable = m4.translate(matrixAsaDir, -0.76, 1, -0.2);
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixCable, vertexDataCube.length, gl.TRIANGLES);
}

function drawSpaceship1(viewingProjectionMatrix){
  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = m4.scale(matrixAeronave, 0.2, 0.2, 0.2); // Escala da aeronave
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  // Corpo da aeronave
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.3, 0.25, 1); // Escala do corpo
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixCorpo, vertexDataCube.length, gl.TRIANGLES);

  // Asa esquerda
  let matrixAsaEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaEsq = m4.scale(matrixAsaEsq, 0.15, 0.2, 0.8);
  matrixAsaEsq = m4.translate(matrixAsaEsq, -1.5, 0.60, -0.2); // Translação da asa esquerda
  
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixAsaEsq, vertexDataCube.length, gl.TRIANGLES);

  // Asa direita
  let matrixAsaDir = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaDir = m4.scale(matrixAsaDir, 0.15, 0.2, 0.8)
  matrixAsaDir = m4.translate(matrixAsaDir, 1.5, 0.60, -0.2); // Translação da asa direita
  
  drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixAsaDir, vertexDataCube.length, gl.TRIANGLES);
}

let cameraPosition = [0.5,0.3,0.2]


function updateCameraPosition() {



  // Nova posição da câmera
  const P0 = [
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
  ];

  // Alvo da câmera (centro da aeronave)
  const P_ref = [...planePosition];

  // Vetor "up" no sistema de coordenadas local da aeronave
  const V = [0,1,0];

  return { P0, P_ref, V };
}

let isPerspective = true; // Variável para alternar entre ortográfica e perspectiva

function setCamera() {
  if (controls['c']) {
    isPerspective = !isPerspective; // Alterna o modo de projeção
    controls['c'] = false; // Evita alternar repetidamente enquanto a tecla está pressionada
  }
}

let isSpaceship = true
function setSpaceship(){
  if (controls['1']){
    isSpaceship = !isSpaceship
    controls['1'] = false
  }
}

const tamPlanets = {
  sun: 13.91,      // Diâmetro do Sol em km
  mercury: 4.88,    // Diâmetro de Mercúrio em km
  venus: 12.104,      // Diâmetro de Vênus em km
  earth: 12.742,      // Diâmetro da Terra em km
  mars: 6.779,       // Diâmetro de Marte em km
  jupyter: 13.982,   // Diâmetro de Júpiter em km
  saturnn: 11.646,   // Diâmetro de Saturno em km
  urano: 50.724,      // Diâmetro de Urano em km
  neptuno: 49.244,     // Diâmetro de Netuno em km
  pluto: 2.377        // Diâmetro de Plutão em km
};





let vertexDataCube = setCubeVertices();
let colorDataCube = setCubeColors();
//modelagem do aviao
const positionBuffer = createBufferData(gl, program, vertexDataCube, "a_position", 3)
const colorBuffer = createBufferData(gl, program, colorDataCube, "a_color", 3)



const vertexDataSphere = setSphereVertices(0.6, 20, 20);

const positionBufferSphere = createBufferData(gl, program, vertexDataSphere, "a_position", 3);




function main(){

  let tetha = 0
  
  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Atualiza a câmera
    setCamera();
    // Define a matriz de projeção com base no estado atual
    let projectionMatrix;
    if (isPerspective) {
      projectionMatrix = perspectiveProjection(xw_min, xw_max, yw_min, yw_max, z_near, z_far);
    } else {
      projectionMatrix = ortographicProjection(xw_min, xw_max, yw_min, yw_max, z_near, z_far);
    }
    
    const { P0, P_ref, V } = updateCameraPosition();
    let viewingMatrix = set3dViewingMatrix(P0, P_ref, V);
    let viewingProjectionMatrix = m4.identity();
    viewingProjectionMatrix = m4.multiply(viewingProjectionMatrix, projectionMatrix);
    viewingProjectionMatrix = m4.multiply(viewingProjectionMatrix, viewingMatrix);

    
    let matrixSphere = m4.multiply(viewingProjectionMatrix, m4.identity());
    matrixSphere = m4.scale(matrixSphere, 13.91, 13.91, 13.91); // Escala da esfera (ajuste conforme necessário)
  
    drawShape(gl, positionBufferSphere, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrixSphere, vertexDataSphere.length, gl.TRIANGLES);
    
    setSpaceship()

    if(!isSpaceship){
      drawSpaceship1(viewingProjectionMatrix)
    }
    else{
      drawSpaceship2(viewingProjectionMatrix)
    }
    requestAnimationFrame(drawScene);
  }

  
  drawScene();
}

function setSphereVertices(radius,slices,stacks){
  const vertexData = [];
  let slicesStep = (2*Math.PI) / slices;
  let stacksStep = Math.PI / stacks;
 
  for(let i=0;i<stacks;i++){
      let phi = -Math.PI / 2 + i * stacksStep;
      for(let j=0;j<slices;j++){
          let theta = -Math.PI + j * slicesStep; 
          vertexData.push(...[
              radius*Math.cos(phi)*Math.cos(theta),
              radius*Math.cos(phi)*Math.sin(theta),
              radius*Math.sin(phi)
          ]);
          vertexData.push(...[
              radius*Math.cos(phi+stacksStep)*Math.cos(theta),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta),
              radius*Math.sin(phi+stacksStep)
          ]);
          vertexData.push(...[
              radius*Math.cos(phi)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi)
          ]);
          vertexData.push(...[
              radius*Math.cos(phi+stacksStep)*Math.cos(theta),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta),
              radius*Math.sin(phi+stacksStep)
          ]);
          vertexData.push(...[
              radius*Math.cos(phi+stacksStep)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi+stacksStep)
          ]);
          vertexData.push(...[
              radius*Math.cos(phi)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi)
          ]);
      }
  }
 
  return vertexData;
}
 
function setSphereNormals_flat(radius,slices,stacks){
  const normalData = [];
  let slicesStep = (2*Math.PI) / slices;
  let stacksStep = Math.PI / stacks;

  let theta = -Math.PI;
  let phi = -Math.PI/2;

  for(let i=0;i<stacks;i++){
      let phi = -Math.PI / 2 + i * stacksStep;
      for(let j=0;j<slices;j++){
          let theta = -Math.PI + j * slicesStep; 
          let P0 = [
              radius*Math.cos(phi)*Math.cos(theta),
              radius*Math.cos(phi)*Math.sin(theta),
              radius*Math.sin(phi)
          ];
          let P1 = [
              radius*Math.cos(phi+stacksStep)*Math.cos(theta),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta),
              radius*Math.sin(phi+stacksStep)
          ];
          let P2 = [
              radius*Math.cos(phi)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi)
          ];
          let N = crossProduct([P2[0]-P0[0],P2[1]-P0[1],P2[2]-P0[2]],[P1[0]-P0[0],P1[1]-P0[1],P1[2]-P0[2]]);
          normalData.push(...N);
          normalData.push(...N);
          normalData.push(...N);
          P0 = [
              radius*Math.cos(phi+stacksStep)*Math.cos(theta),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta),
              radius*Math.sin(phi+stacksStep)
          ];
          P1 = [
              radius*Math.cos(phi+stacksStep)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi+stacksStep)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi+stacksStep)
          ];
          P2 = [
              radius*Math.cos(phi)*Math.cos(theta+slicesStep),
              radius*Math.cos(phi)*Math.sin(theta+slicesStep),
              radius*Math.sin(phi)
          ];
          N = crossProduct([P2[0]-P0[0],P2[1]-P0[1],P2[2]-P0[2]],[P1[0]-P0[0],P1[1]-P0[1],P1[2]-P0[2]]);
          normalData.push(...N);
          normalData.push(...N);
          normalData.push(...N);
      }
  }
 
  return normalData;
}





// Função para criar um quaternion a partir de um eixo e um ângulo
function quaternionFromAxisAngle(axis, angle) {
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);
  
  return {
    w: Math.cos(halfAngle), // Componente escalar
    x: axis[0] * s, // Componente x
    y: axis[1] * s, // Componente y
    z: axis[2] * s  // Componente z
  };
}

// Função para multiplicar dois quaternions
function multiplyQuaternions(q1, q2) {
  return {
    w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
    x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
    y: q1.w * q2.y + q1.y * q2.w + q1.z * q2.x - q1.x * q2.z,
    z: q1.w * q2.z + q1.z * q2.w + q1.x * q2.y - q1.y * q2.x
  };
}

// Função para aplicar o quaternion de rotação ao vetor
function applyQuaternionToVector(q, v) {
  const qv = { w: 0, x: v[0], y: v[1], z: v[2] }; // Representa o vetor como um quaternion (com w = 0)
  
  // Multiplicar o quaternion pelo vetor
  const qConjugate = { w: q.w, x: -q.x, y: -q.y, z: -q.z }; // Conjugado do quaternion
  const qResult = multiplyQuaternions(multiplyQuaternions(q, qv), qConjugate);
  
  // Retornar o vetor resultante (componente x, y, z do quaternion resultante)
  return [qResult.x, qResult.y, qResult.z];
}

// Função para aplicar a rotação no vetor usando um eixo e um ângulo
function applyAxisAngle(axis, angle, vector) {
  // Primeiro, criamos o quaternion de rotação
  const quaternion = quaternionFromAxisAngle(axis, angle);
  
  // Em seguida, aplicamos a rotação no vetor usando o quaternion
  return applyQuaternionToVector(quaternion, vector);
}



function buildRotationMatrix(x,y,z) {
  return [
    x[0], x[1], x[2], 0,  // Eixo X
    y[0], y[1], y[2], 0,  // Eixo Y
    z[0], z[1], z[2], 0,  // Eixo Z
    0, 0, 0, 1             // Ponto de origem (não rotaciona)
  ];
}

function createBufferData(gl, program, data, attributeName, size) {
  const buffer = gl.createBuffer();
  const location = gl.getAttribLocation(program, attributeName);
  
  if (location === -1) {
    console.warn(`Attribute ${attributeName} not found in shader program.`);
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

  return buffer;
}

function drawShape(gl, positionBuffer, colorBuffer, positionLocation, colorLocation, matrixUniformLocation, matrix, vertexCount, mode) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);

  gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);
  gl.drawArrays(mode, 0, vertexCount);
}

function createSphere(radius, latitudeBands, longitudeBands) {
  var vertexData = [];
  var indexData = [];

  // Geração de vértices
  for (var latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
          var phi = longNumber * 2 * Math.PI / longitudeBands;
          var sinPhi = Math.sin(phi);
          var cosPhi = Math.cos(phi);

          var x = cosPhi * sinTheta;
          var y = cosTheta;
          var z = sinPhi * sinTheta;
          var u = 1 - (longNumber / longitudeBands);
          var v = 1 - (latNumber / latitudeBands);

          vertexData.push(radius * x);
          vertexData.push(radius * y);
          vertexData.push(radius * z);
      }
  }

// Geração de índices dos triângulos
  for (var latNumber = 0; latNumber < latitudeBands; ++latNumber) {
    for (var longNumber = 0; longNumber < longitudeBands; ++longNumber) {
        var first = (latNumber * (longitudeBands + 1)) + longNumber;
        var second = first + longitudeBands + 1;

        indexData.push(first);
        indexData.push(second);
        indexData.push(first + 1);

        indexData.push(second);
        indexData.push(second + 1);
        indexData.push(first + 1);
    }
  }

  return {vertexData, indexData};
}


function setCubeVertices(){
  const vertexData = [
    // Front
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,

    // Left
    -.5, 0.5, 0.5,
    -.5, -.5, 0.5,
    -.5, 0.5, -.5,
    -.5, 0.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, -.5,

    // Back
    -.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, 0.5, -.5,
    0.5, 0.5, -.5,
    -.5, -.5, -.5,
    0.5, -.5, -.5,

    // Right
    0.5, 0.5, -.5,
    0.5, -.5, -.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    0.5, -.5, -.5,

    // Top
    0.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.5, -.5,
    -.5, 0.5, -.5,

    // Bottom
    0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
  ];
  return vertexData;
}

function setCubeColors(){
  function randomColor() {
    return [Math.random(), Math.random(), Math.random()];
  }

  let colorData = [];
  for (let face = 0; face < 6; face++) {
    let faceColor = randomColor();
    for (let vertex = 0; vertex < 6; vertex++) {
        colorData.push(...faceColor);
    }
  }
  return colorData;
}

function set3dViewingMatrix(P0,P_ref,V){
  let matrix = [];
  let N = [
    P0[0] - P_ref[0],
    P0[1] - P_ref[1],
    P0[2] - P_ref[2],
  ];
  let n = unitVector(N);
  let u = unitVector(crossProduct(V,n));
  let v = crossProduct(n,u);

  let T = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -P0[0], -P0[1], -P0[2], 1,
  ];
  let R = [
    u[0], v[0], n[0],  0,
    u[1], v[1], n[1],  0,
    u[2], v[2], n[2],  0,
       0,    0,    0,  1,
  ];

  matrix = m4.multiply(R,T);
  return matrix;
}

function ortographicProjection(xw_min,xw_max,yw_min,yw_max,z_near,z_far){
  let matrix = [
    2/(xw_max-xw_min), 0, 0, 0,
    0, 2/(yw_max-yw_min), 0, 0,
    0, 0, -2/(z_near-z_far), 0,
    -(xw_max+xw_min)/(xw_max-xw_min), -(yw_max+yw_min)/(yw_max-yw_min), (z_near+z_far)/(z_near-z_far), 1,
  ];
  return matrix;
}

function perspectiveProjection(xw_min,xw_max,yw_min,yw_max,z_near,z_far){
  let matrix = [
    -(2*z_near)/(xw_max-xw_min), 0, 0, 0,
    0, -(2*z_near)/(yw_max-yw_min), 0, 0,
    (xw_max+xw_min)/(xw_max-xw_min), (yw_max+yw_min)/(yw_max-yw_min), (z_near+z_far)/(z_near-z_far), -1,
    0, 0, -1, 0,
  ];
  return matrix;
}

function crossProduct(v1,v2){
  let result = [
      v1[1]*v2[2] - v1[2]*v2[1],
      v1[2]*v2[0] - v1[0]*v2[2],
      v1[0]*v2[1] - v1[1]*v2[0]
  ];
  return result;
}

function dotProduct(v1, v2) {
    if (v1.length !== v2.length) {
        throw new Error("Os vetores devem ter o mesmo comprimento.");
    }
    return v1.reduce((sum, val, index) => sum + val * v2[index], 0);
}


function addVector(a,b){
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scaleVector(v, scalar) {
  return [v[0] * scalar, v[1] * scalar, v[2] * scalar];
}


function unitVector(v) {
  // Verifica se v é um array ou converte um objeto para array
  const vectorArray = Array.isArray(v) ? v : [v.x, v.y, v.z];

  let vModulus = vectorModulus(vectorArray);
  if (vModulus === 0) throw new Error("O vetor não pode ter módulo zero.");

  return vectorArray.map(function (x) {
      return x / vModulus;
  });
}

function vectorModulus(v){
  return Math.sqrt(Math.pow(v[0],2)+Math.pow(v[1],2)+Math.pow(v[2],2));
}

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}




var m4 = {
  identity: function() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
        c, s, 0, 0,
      -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

};

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

main();