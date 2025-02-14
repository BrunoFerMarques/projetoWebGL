const canvas = document.querySelector("#canvas");
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, Antialias: true });

if (!gl) {
    throw new Error('WebGL not supported');
}

var vertexShaderSource = `
precision mediump float;

attribute vec3 a_Position; // Atributo: posição do vértice
attribute vec3 a_Color;    // Atributo: cor do vértice
attribute vec3 a_Normal;   // Atributo: normal do vértice

varying vec3 vColor;       // Variável varying: passa a cor para o fragment shader
uniform mat4 matrix;       // Matriz de transformação (projeção + visualização + modelo)
uniform mat4 u_NormalMatrix;

varying vec3 vNormal;     // Normal do vértice
varying vec3 vPosition;   // Posição do vértice

void main() {
  vColor = a_Color; // Passa a cor para o fragment shader
  vNormal = normalize(a_Normal); // Passa a normal para o fragment shader
  
  vPosition = a_Position; // Passa a posição para o fragment shader
  gl_Position = matrix * vec4(a_Position, 1.0); // Calcula a posição final do vértice
}
`
var fragmentShaderSource = `
precision mediump float;
#define NUM_LIGHTS 8

varying vec3 vColor; // Variável varying: recebe a cor do vertex shader
varying vec3 vNormal; // Normal do vértice
varying vec3 vPosition; // Posição do vértice

uniform vec3 u_AmbientColor;      // Cor da luz ambiente
uniform float u_AmbientIntensity; // Intensidade da luz ambiente
uniform bool u_IsSun;

uniform vec3 u_LightPositions[NUM_LIGHTS]; // Posições das luzes
uniform vec3 u_LightColors[NUM_LIGHTS];    // Cores das luzes
uniform float u_LightIntensity;            // Intensidade das luzes

void main() {
  vec3 normal = normalize(vNormal); // Normaliza a normal do vértice
  vec3 ambient = u_AmbientColor * u_AmbientIntensity;
  
  vec3 diffuseSum = vec3(0.0);
  if (!u_IsSun) { // Se não for o Sol, calcular a luz pontual
    for (int i = 0; i < NUM_LIGHTS; i++) {
      vec3 lightDir = normalize(u_LightPositions[i] - vPosition);
      float diff = max(dot(normal, lightDir), 0.0);

      float distance = length(u_LightPositions[i] - vPosition);
      float attenuation = 1.0 / (1.0 + 0.01 * distance + 0.02 * (distance * distance));

      vec3 diffuse = u_LightColors[i] * diff * attenuation * u_LightIntensity;
      diffuseSum += diffuse;
    }
  }


  vec3 finalColor = vColor * (ambient + diffuseSum);

  gl_FragColor = vec4(finalColor, 1.0);
}

`


var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

var program = createProgram(gl, vertexShader, fragmentShader);

gl.useProgram(program);

gl.enable(gl.DEPTH_TEST);

const matrixUniformLocation = gl.getUniformLocation(program, `matrix`);

gl.clearColor(0.0, 0.0, 0.0, 1.0);

//configuracoes iniciais da camera
gl.viewport(0,0,500,500);

const xw_min = -1.0;
const xw_max = 1.0;
const yw_min = -1.0;
const yw_max = 1.0;
const z_near = -1.0;
const z_far = -80;


const positionLocation = gl.getAttribLocation(program, "a_Position");
const colorLocation = gl.getAttribLocation(program, "a_Color");
const normalLocation = gl.getAttribLocation(program, "a_Normal");

gl.useProgram(program);


const faceColors = [
  [0.5, 0.5, 0.5], // Face frontal: vermelho
  [0.5, 0.5, 0.5], // Face esquerda: verde
  [0.5, 0.5, 0.5], // Face traseira: azul
  [0.5, 0.5, 0.5], // Face direita: amarelo
  [0.5, 0.5, 0.5], // Face superior: ciano
  [0.5, 0.5, 0.5], // Face inferior: branco
];


function ambientLight() {
  const ambientColorLocation = gl.getUniformLocation(program, "u_AmbientColor");
  const ambientIntensityLocation = gl.getUniformLocation(program, "u_AmbientIntensity");

  const ambientColor = [1.0, 1.0, 1.0]; // Luz branca
  const ambientIntensity = 0.3; // 30% da intensidade
  gl.uniform3fv(ambientColorLocation, ambientColor);
  gl.uniform1f(ambientIntensityLocation, ambientIntensity);

}
//estou posicionando as luzes para nao ter nada em preto no sol, aproximadamente terá 12, uma em cada canto, depois acertar atenuação, modelar e fazer jogabilida
function puntualLight(){
  
  const lightPositions = [
    [0.0, 2, 0.0],
    [0.0, -2, 0.0],
    [2, 0, 0.0],
    [-2, 0.0, 0.0],
    [0.0, 0.0, 2.2],
    [0.0, 0.0, -2.2],
    [-1.0, 0.0, 2.2]
  ];
  const lightPositions2 = [
    [1.0, 0.0, -2.2],
    [0.0, -2, 0.0],
    [2, 0, 0.0],
    [-2, 0.0, 0.0],
    [0.0, 0.0, 2.2],
    [0.0, 0.0, -2.2],
    [-1.0, 0.0, 2.2]
  ];
  const lightColors = [
    [1.0, 0.9, 0.8], // Cor amarelada para cada luz
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
  ];
  const lightColors2 = [
    [1.0, 0.9, 0.8], // Cor amarelada para cada luz
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
    [1.0, 0.9, 0.8],
  ];
  // Enviando as luzes para o shader
  const lightPositionLocation = gl.getUniformLocation(program, "u_LightPositions");
  const lightColorLocation = gl.getUniformLocation(program, "u_LightColors");
  const lightIntensityLocation = gl.getUniformLocation(program, "u_LightIntensity");


  gl.uniform3fv(lightPositionLocation, lightPositions.flat()); // Envia todas as posições
  gl.uniform3fv(lightColorLocation, lightColors.flat());       // Envia todas as cores
  gl.uniform1f(lightIntensityLocation, 1,5);                
  gl.uniform3fv(lightPositionLocation, lightPositions2.flat()); // Envia todas as posições
  gl.uniform3fv(lightColorLocation, lightColors2.flat());       // Envia todas as cores
  gl.uniform1f(lightIntensityLocation, 1,5); 
}


let smoothingFactor = 0.1
function updateCameraPosition() {

  const P0 = [1, 0, -4 ]
  const P_ref = [0,0,0]


  // Vetor "up" ajustado com base na orientação da aeronave
  const V = [0,1,0]; // Usa o vetor y da aeronave como "up"

  return { P0, P_ref, V };
}


if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
  console.error("Erro ao compilar vertex shader:", gl.getShaderInfoLog(vertexShader));
}
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
  console.error("Erro ao compilar fragment shader:", gl.getShaderInfoLog(fragmentShader));
}
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error("Erro ao linkar programa:", gl.getProgramInfoLog(program));
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

let planePosition = [3,4,4]


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
  let facecolorsCorpo = [
    [1,0,0],
    [1,0,0],
    [1,0,0],
    [1,0,0],
    [1,0,0],
    [1,0,0],
  ]

  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = m4.scale(matrixAeronave, 0.2, 0.2, 0.2); // Escala da aeronave
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  // Corpo da aeronave
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.3, 0.3, 1); // Escala do corpo
  drawShape(matrixCorpo, facecolorsCorpo , gl.TRIANGLES, 'cube');

  // Asa esquerda
  let matrixAsaEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaEsq = m4.scale(matrixAsaEsq, 0.6, 0.2, 0.3);
  matrixAsaEsq = m4.translate(matrixAsaEsq, -0.75, 0, -0.9); // Translação da asa esquerda
  
  drawShape( matrixAsaEsq, faceColors, gl.TRIANGLES, 'cube');

  // Asa direita
  let matrixAsaDir = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaDir = m4.scale(matrixAsaDir, 0.6, 0.2, 0.3)
  matrixAsaDir = m4.translate(matrixAsaDir, 0.75, 0, -0.9); // Translação da asa direita
  drawShape(matrixAsaDir, faceColors, gl.TRIANGLES, 'cube');

  let matrixCable = m4.multiply(matrixAeronave, m4.identity());
  matrixCable = m4.scale(matrixAsaDir, 0.1, 0.4, 0.1)
  matrixCable = m4.translate(matrixAsaDir, -0.76, 1, -0.2);
  drawShape(matrixCable, faceColors, gl.TRIANGLES, 'cube');
}

function drawSpaceship1(viewingProjectionMatrix){
  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = m4.scale(matrixAeronave, 0.2, 0.2, 0.2); // Escala da aeronave
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  // Corpo da aeronave
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.3, 0.25, 1); // Escala do corpo
  drawShape(matrixCorpo, faceColors, gl.TRIANGLES, 'cube');

  // Asa esquerda
  let matrixAsaEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaEsq = m4.scale(matrixAsaEsq, 0.15, 0.2, 0.8);
  matrixAsaEsq = m4.translate(matrixAsaEsq, -1.5, 0.60, -0.2); // Translação da asa esquerda
  drawShape(matrixAsaEsq, faceColors, gl.TRIANGLES, 'cube');
  // Asa direita
  let matrixAsaDir = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaDir = m4.scale(matrixAsaDir, 0.15, 0.2, 0.8)
  matrixAsaDir = m4.translate(matrixAsaDir, 1.5, 0.60, -0.2); // Translação da asa direita
  drawShape(matrixAsaDir, faceColors, gl.TRIANGLES,'cube');
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







let theta = 0
function main(){
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
  setSpaceship()
  if(!isSpaceship){
    drawSpaceship1(viewingProjectionMatrix)
  }
  else{
    drawSpaceship2(viewingProjectionMatrix)
  }
  
  ambientLight()
  puntualLight()
  let matrixSol = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixSol = m4.scale(matrixSol, 1, 1, 1); // Escala do Sol
  drawShape(matrixSol, [1,1,0], gl.TRIANGLES, 'sphere', true);
  requestAnimationFrame(main);
  
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



function setCubeNormals(){
  const normalData = [
      // Front
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,

      // Left
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,
      -1.0, 0.0, 0.0,

      // Back
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,
      0.0, 0.0, -1.0,

      // Right
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,

      // Top
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,
      0.0, 1.0, 0.0,

      // Bottom
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, -1.0, 0.0,
  ];
  return normalData;
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
 
function setSphereColors(slices, stacks, color) {
  const colorData = [];

  // Verifica se a cor é um array com 3 elementos (RGB)
  if (!Array.isArray(color) || color.length !== 3) {
    console.error("A cor deve ser um array com 3 valores (RGB).");
    return [];
  }

  // Número total de vértices na esfera
  const totalVertices = slices * stacks * 6; // 6 vértices por face (2 triângulos)

  // Preenche o array de cores com a cor especificada para cada vértice
  for (let i = 0; i < totalVertices; i++) {
    colorData.push(...color); // Adiciona os valores RGB
  }

  return colorData;
}


function setSphereNormals_smooth(radius, slices, stacks) {
  const normalData = [];
  let slicesStep = (2 * Math.PI) / slices;
  let stacksStep = Math.PI / stacks;

  let theta = -Math.PI;
  let phi = -Math.PI / 2;

  for (let i = 0; i < stacks; i++) {
      let phi = -Math.PI / 2 + i * stacksStep;
      for (let j = 0; j < slices; j++) {
          let theta = -Math.PI + j * slicesStep;
          normalData.push(...[
              radius * Math.cos(phi) * Math.cos(theta),
              radius * Math.cos(phi) * Math.sin(theta),
              radius * Math.sin(phi)
          ]);
          normalData.push(...[
              radius * Math.cos(phi + stacksStep) * Math.cos(theta),
              radius * Math.cos(phi + stacksStep) * Math.sin(theta),
              radius * Math.sin(phi + stacksStep)
          ]);
          normalData.push(...[
              radius * Math.cos(phi) * Math.cos(theta + slicesStep),
              radius * Math.cos(phi) * Math.sin(theta + slicesStep),
              radius * Math.sin(phi)
          ]);
          normalData.push(...[
              radius * Math.cos(phi + stacksStep) * Math.cos(theta),
              radius * Math.cos(phi + stacksStep) * Math.sin(theta),
              radius * Math.sin(phi + stacksStep)
          ]);
          normalData.push(...[
              radius * Math.cos(phi + stacksStep) * Math.cos(theta + slicesStep),
              radius * Math.cos(phi + stacksStep) * Math.sin(theta + slicesStep),
              radius * Math.sin(phi + stacksStep)
          ]);
          normalData.push(...[
              radius * Math.cos(phi) * Math.cos(theta + slicesStep),
              radius * Math.cos(phi) * Math.sin(theta + slicesStep),
              radius * Math.sin(phi)
          ]);
      }
  }

  return normalData;
}

function setCubeColors(faceColors) {
  const colorData = [];

  // Verifica se o array de cores tem 6 elementos (uma cor para cada face)
  if (faceColors.length !== 6) {
    console.error("O array de cores deve conter exatamente 6 cores (uma para cada face do cubo).");
    return [];
  }

  // Itera sobre as 6 faces do cubo
  for (let face = 0; face < 6; face++) {
    const color = faceColors[face]; // Obtém a cor da face atual

    // Verifica se a cor é um array com 3 elementos (RGB)
    if (!Array.isArray(color) || color.length !== 3) {
      console.error(`A cor da face ${face} deve ser um array com 3 valores (RGB).`);
      return [];
    }

    // Adiciona a cor para cada vértice da face (6 vértices por face)
    for (let vertex = 0; vertex < 6; vertex++) {
      colorData.push(...color); // Adiciona os valores RGB
    }
  }

  return colorData;
}


function updateNormals(normals, modelMatrix) {
  const normalMatrix = m4.transpose(m4.inverse(modelMatrix));
  const newNormals = [];
  for (let i = 0; i < normals.length; i += 3) {
    const normal = [normals[i], normals[i + 1], normals[i + 2]];
    const transformedNormal = m4.transformNormal(normalMatrix, normal);
    newNormals.push(...transformedNormal);
  }
  return newNormals;
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

function applyQuaternionToVector(q, v) {
  const qv = { w: 0, x: v[0], y: v[1], z: v[2] }; 
  
  
  const qConjugate = { w: q.w, x: -q.x, y: -q.y, z: -q.z }; 
  const qResult = multiplyQuaternions(multiplyQuaternions(q, qv), qConjugate);
  

  return [qResult.x, qResult.y, qResult.z];
}


function applyAxisAngle(axis, angle, vector) {
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



function drawShape(matrix, color, mode, type) {
  if(type == 'cube'){
    //setando os vertices, normais e cores do cubo
    let vertexDataCube = setCubeVertices();
    let normalDataCube = setCubeNormals();
    let colorDataCube = setCubeColors(color);

    // Cria e configura o buffer de posição
    const positionBufferCube = createBufferData(gl, program, vertexDataCube, "a_Position", 3);
    const normalBufferCube = createBufferData(gl, program, normalDataCube, "a_Normal", 3);
    const colorBufferCube = createBufferData(gl, program, colorDataCube, "a_Color", 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferCube);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferCube);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferCube);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);
    

    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);
    gl.drawArrays(mode, 0, vertexDataCube.length);
  }
  if(type == 'sphere'){
    //setando os vertices, normais e cores da esfera
    let colorDataSphere = setSphereColors(50,50 , [...color])
    let vertexDataSphere = setSphereVertices(1,50,50)
    let normalDataSphere = setSphereNormals_smooth(1,50,50)

    const positionBufferSphere = createBufferData(gl, program, vertexDataSphere, "a_Position", 3);
    const normalBufferSphere = createBufferData(gl, program, normalDataSphere, "a_Normal", 3);
    const colorBufferSphere = createBufferData(gl, program, colorDataSphere, "a_Color", 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferSphere);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferSphere);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);


    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferSphere);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);
    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);
    gl.drawArrays(mode, 0, vertexDataSphere.length);
  }
  
}



function set3dViewingMatrix(P0, P_ref, V) {
  let matrix = [];
  let N = [
      P0[0] - P_ref[0],
      P0[1] - P_ref[1],
      P0[2] - P_ref[2],
  ];
  let n = unitVector(N);
  let u = unitVector(crossProduct(V, n));
  let v = crossProduct(n, u);

  let T = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -P0[0], -P0[1], -P0[2], 1,
  ];
  let R = [
      u[0], v[0], n[0], 0,
      u[1], v[1], n[1], 0,
      u[2], v[2], n[2], 0,
      0, 0, 0, 1,
  ];

  matrix = m4.multiply(R, T);
  return matrix;
}

function ortographicProjection(xw_min, xw_max, yw_min, yw_max, z_near, z_far) {
  let matrix = [
      2 / (xw_max - xw_min), 0, 0, 0,
      0, 2 / (yw_max - yw_min), 0, 0,
      0, 0, -2 / (z_near - z_far), 0,
      -(xw_max + xw_min) / (xw_max - xw_min), -(yw_max + yw_min) / (yw_max - yw_min), (z_near + z_far) / (z_near - z_far), 1,
  ];
  return matrix;
}

function perspectiveProjection(xw_min, xw_max, yw_min, yw_max, z_near, z_far) {
  let matrix = [
      -(2 * z_near) / (xw_max - xw_min), 0, 0, 0,
      0, -(2 * z_near) / (yw_max - yw_min), 0, 0,
      (xw_max + xw_min) / (xw_max - xw_min), (yw_max + yw_min) / (yw_max - yw_min), (z_near + z_far) / (z_near - z_far), -1,
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
  transpose: function(m, dst) {
    dst = dst || new Float32Array(16);

    dst[ 0] = m[0];
    dst[ 1] = m[4];
    dst[ 2] = m[8];
    dst[ 3] = m[12];
    dst[ 4] = m[1];
    dst[ 5] = m[5];
    dst[ 6] = m[9];
    dst[ 7] = m[13];
    dst[ 8] = m[2];
    dst[ 9] = m[6];
    dst[10] = m[10];
    dst[11] = m[14];
    dst[12] = m[3];
    dst[13] = m[7];
    dst[14] = m[11];
    dst[15] = m[15];

    return dst;
  },

  inverse: function(m, dst) {
    dst = dst || new Float32Array(16);
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return dst;
  },

  transformNormal: function(m) {
    const invTranspose = m4.transpose(m4.inverse(m));
    return invTranspose ? invTranspose.slice(0, 9) : null;
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