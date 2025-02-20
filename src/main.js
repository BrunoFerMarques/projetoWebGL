const canvas = document.querySelector("#canvas"); // Seleciona o elemento <canvas> no DOM
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, Antialias: true }); // Obtém o contexto WebGL

if (!gl) {
    throw new Error('WebGL not supported'); // Verifica se o navegador suporta WebGL
}

var vertexShaderSource = `
precision mediump float;

attribute vec3 a_Position; // Atributo: posição do vértice
attribute vec2 a_TexCoord; // Atributo: coordenadas de textura
attribute vec3 a_Normal;   // Atributo: normal do vértice

varying vec2 v_TexCoord;   // Variável varying: passa as coordenadas de textura para o fragment shader
varying vec3 vNormal;      // Normal do vértice
varying vec3 vPosition;    // Posição do vértice

uniform mat4 matrix;       // Matriz de transformação (projeção + visualização + modelo)
uniform mat4 u_NormalMatrix; // Matriz para transformar as normais (inversa transposta)

void main() {
  v_TexCoord = a_TexCoord; // Passa as coordenadas de textura para o fragment shader
  vNormal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1.0))); // Transforma e normaliza a normal
  vPosition = vec3(matrix * vec4(a_Position, 1.0)); // Passa a posição transformada para o fragment shader
  gl_Position = matrix * vec4(a_Position, 1.0); // Calcula a posição final do vértice
}
`;
var fragmentShaderSource = `
precision mediump float;
#define NUM_LIGHTS 8 // Define o número de luzes

varying vec2 v_TexCoord; // Recebe as coordenadas de textura do vertex shader
varying vec3 vNormal;    // Recebe a normal do vértice
varying vec3 vPosition;  // Recebe a posição do vértice

uniform sampler2D u_Texture; // Textura
uniform vec3 u_AmbientColor; // Cor da luz ambiente
uniform float u_AmbientIntensity; // Intensidade da luz ambiente

uniform vec3 u_LightPositions[NUM_LIGHTS]; // Posições das luzes
uniform vec3 u_LightColors[NUM_LIGHTS];    // Cores das luzes
uniform float u_LightIntensity;            // Intensidade das luzes

uniform float u_Shininess; // Valor de brilho (para especular)
uniform vec3 u_AirplanePosition; // Posição do avião no espaço do mundo

void main() {
  vec3 normal = normalize(vNormal); // Normaliza a normal do vértice
  vec3 ambient = u_AmbientColor * u_AmbientIntensity; // Calcula a luz ambiente

  vec3 diffuseSum = vec3(0.0); // Soma da iluminação difusa
  vec3 specularSum = vec3(0.0); // Soma da iluminação especular

  for (int i = 0; i < NUM_LIGHTS; i++) {
    vec3 lightDir = normalize(u_LightPositions[i] - vPosition); // Direção da luz
    float diff = max(dot(normal, lightDir), 0.0); // Intensidade da luz difusa

    // Calcula a distância da luz ao avião (não ao fragmento)
    float distanceToAirplane = length(u_LightPositions[i] - u_AirplanePosition); // Distância da luz ao avião

    // Aplica a atenuação com base na distância da luz ao avião
    float attenuation = 1.0 / (1.0 + 0.0003 * distanceToAirplane + 0.0006 * (distanceToAirplane * distanceToAirplane));

    vec3 diffuse = u_LightColors[i] * diff * attenuation * u_LightIntensity; // Luz difusa
    diffuseSum += diffuse;

    // Reflete a luz sobre a normal
    vec3 reflectDir = reflect(-lightDir, normal); // Direção da reflexão

    // Calcula a luz especular sem usar a direção da câmera
    float spec = pow(max(dot(normal, reflectDir), 0.0), u_Shininess) * 0.04; // Intensidade especular

    vec3 specular = u_LightColors[i] * spec * attenuation * u_LightIntensity; // Luz especular
    specularSum += specular;
  }

  vec4 textureColor = texture2D(u_Texture, v_TexCoord); // Amostra a cor da textura
  vec3 finalColor = textureColor.rgb * (ambient + diffuseSum) + specularSum; // Combina as cores

  gl_FragColor = vec4(finalColor, textureColor.a); // Define a cor final do fragmento
}

`;


var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource); // Compila o vertex shader
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource); // Compila o fragment shader

var program = createProgram(gl, vertexShader, fragmentShader); // Linka os shaders em um programa

gl.useProgram(program); // Usa o programa criado


gl.enable(gl.DEPTH_TEST);


const matrixUniformLocation = gl.getUniformLocation(program, `matrix`);

gl.clearColor(1.0, 1.0, 1.0, 1.0);

//configuracoes iniciais da camera
gl.viewport(0,0,500,500);

const xw_min = -1.0; // Limite mínimo do eixo X
const xw_max = 1.0;  // Limite máximo do eixo X
const yw_min = -1.0; // Limite mínimo do eixo Y
const yw_max = 1.0;  // Limite máximo do eixo Y
const z_near = -1.0; // Limite próximo do eixo Z
const z_far = -500;  // Limite distante do eixo Z

const positionLocation = gl.getAttribLocation(program, "a_Position"); // Localização da posição
const colorLocation = gl.getAttribLocation(program, "a_Color"); // Localização da cor
const normalLocation = gl.getAttribLocation(program, "a_Normal"); // Localização da normal
const texCoordLocation = gl.getAttribLocation(program, "a_TexCoord"); // Localização da textura

function ambientLight() {
  const ambientColorLocation = gl.getUniformLocation(program, "u_AmbientColor"); // Localização da cor ambiente
  const ambientIntensityLocation = gl.getUniformLocation(program, "u_AmbientIntensity"); // Localização da intensidade

  const ambientColor = [1.0, 1.0, 1.0]; // Luz branca
  const ambientIntensity = 0.1; // 10% da intensidade
  gl.uniform3fv(ambientColorLocation, ambientColor); // Define a cor ambiente
  gl.uniform1f(ambientIntensityLocation, ambientIntensity); // Define a intensidade
}


function puntualLight() {
  const lightPositions =[[1,1,1], [-1,-1,-1]] // Posições das luzes

  
  const lightColors = [1.0, 0.9, 0.8] // Cores das luzes


  const lightPositionLocation = gl.getUniformLocation(program, "u_LightPositions"); // Localização das posições
  const lightColorLocation = gl.getUniformLocation(program, "u_LightColors"); // Localização das cores
  const lightIntensityLocation = gl.getUniformLocation(program, "u_LightIntensity"); // Localização da intensidade

  gl.uniform3fv(lightPositionLocation, new Float32Array(lightPositions)); // Define as posições das luzes
  gl.uniform3fv(lightColorLocation, new Float32Array(lightColors)); // Define as cores das luzes
  gl.uniform1f(lightIntensityLocation, 1.5); // Define a intensidade das luzes
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




// Vetores de direção da aeronave (eixos x, y, z)
let x = [1, 0, 0]; // Vetor de direção para a direita
let y = [0, 1, 0]; // Vetor de direção para cima
let z = [0, 0, 1]; // Vetor de direção para frente

// Ângulos de rotação da aeronave
let pitch = 0; // Ângulo de inclinação (rotação em torno do eixo z)
let roll = 0;  // Ângulo de rolagem (rotação em torno do eixo x)

// Variáveis de controle de velocidade
let speed = 0;          // Velocidade inicial da aeronave
let maxSpeed = 0.2;     // Velocidade máxima permitida
let acceleration = 0.0002; // Taxa de aceleração ao pressionar a tecla de aceleração
let deceleration = 0.0005; // Taxa de desaceleração ao pressionar a tecla de freio

// Posição inicial da aeronave no espaço 3D
let planePosition = [-8, 7, -4];

// Posições dos corpos celestes no espaço 3D
let sunPosition = [0, 0, 0];      // Posição do Sol
let venusPosition = [10, 0, 10];  // Posição de Vênus
let mercuryPosition = [20, 0, 20]; // Posição de Mercúrio

// Posição do fundo (background) no espaço 3D
let backgroundPosition = [200, 200, 200];

let controls = {};

// Event listeners para detectar quando uma tecla é pressionada ou solta
window.addEventListener('keydown', (e) => {
  controls[e.key.toLowerCase()] = true; // Marca a tecla como pressionada
  console.log(e.key); // Log da tecla pressionada (para debug)
});

window.addEventListener('keyup', (e) => {
  controls[e.key.toLowerCase()] = false; // Marca a tecla como não pressionada
});

// Função principal de atualização da aeronave
function updateAirplane(matrixAeronave) {
  // Controles de movimento da aeronave
  if (controls['a']) roll -= 0.2; // Rotaciona para a esquerda (guinada)
  if (controls['d']) roll += 0.2; // Rotaciona para a direita (guinada)
  if (controls['w']) pitch -= 0.2;  // Rotaciona para cima (rolagem)
  if (controls['s']) pitch += 0.2;  // Rotaciona para baixo (rolagem)
  if (controls[' ']) speed += acceleration; // Aumenta a velocidade (aceleração)
  if (controls['x']) speed -= deceleration; // Diminui a velocidade (desaceleração)
  if (controls['r']) resetGame(); controls['r'] = false; // Reinicia o jogo
  if (controls['c']) setCamera(); // Configura a câmera

  // Aplica amortecimento aos ângulos de rotação para suavizar o movimento
  pitch *= 0.095;
  roll *= 0.095;

  // Limita a velocidade entre 0 e a velocidade máxima
  speed = Math.min(speed, maxSpeed);
  speed = Math.max(speed, 0);

  // Aplica rotações aos vetores de direção da aeronave
  x = applyAxisAngle(z, roll, x); // Rotaciona o vetor x em torno do eixo z
  y = applyAxisAngle(z, roll, y); // Rotaciona o vetor y em torno do eixo z
  y = applyAxisAngle(x, pitch, y);  // Rotaciona o vetor y em torno do eixo x
  z = applyAxisAngle(x, pitch, z);  // Rotaciona o vetor z em torno do eixo x

  // Normaliza os vetores de direção para garantir que tenham comprimento 1
  x = unitVector(x);
  y = unitVector(y);
  z = unitVector(z);

  // Atualiza a posição da aeronave com base na direção e velocidade
  planePosition[0] += z[0] * speed; // Movimento no eixo x
  planePosition[1] += z[1] * speed; // Movimento no eixo y
  planePosition[2] += z[2] * speed; // Movimento no eixo z

  // Cria a matriz de rotação com base nos vetores de direção atualizados
  let rotMatrix = m4.identity();
  rotMatrix = buildRotationMatrix(x, y, z);

  // Cria a matriz de translação com base na posição atual da aeronave
  let translateMatrix = m4.translate(m4.identity(), planePosition[0], planePosition[1], planePosition[2]);

  // Combina a matriz de translação e rotação para obter a matriz final da aeronave
  matrixAeronave = m4.multiply(matrixAeronave, translateMatrix);
  matrixAeronave = m4.multiply(matrixAeronave, rotMatrix);

  // Retorna a matriz atualizada da aeronave
  return matrixAeronave;
}

// Função para reiniciar o jogo
function resetGame() {
  // Reinicia os ângulos de rotação da aeronave
  pitch = 0; // Ângulo de inclinação (rotação em torno do eixo z)
  roll = 0;  // Ângulo de rolagem (rotação em torno do eixo x)

  // Reinicia a velocidade da aeronave
  speed = 0;

  // Reinicia a posição da aeronave para a posição inicial
  planePosition = [-8, 7, -4];

  // Reinicia os vetores de direção da aeronave para os valores iniciais
  x = [1, 0, 0]; // Vetor de direção para a direita
  y = [0, 1, 0]; // Vetor de direção para cima
  z = [0, 0, 1]; // Vetor de direção para frente

  // Reinicia o contador de anéis coletados
  ringCounter = 0;

  // Reinicia a lista de posições dos anéis
  ringPositions = [];

  // Reinicia os ângulos de órbita dos planetas
  thetaMercury = 0; // Ângulo de órbita de Mercúrio
  thetaVenus = 0;   // Ângulo de órbita de Vênus

  // Reinicia as posições dos corpos celestes
  sunPosition = [0, 0, 0];      // Posição do Sol
  venusPosition = [10, 0, 10];  // Posição de Vênus
  mercuryPosition = [20, 0, 20]; // Posição de Mercúrio
  controls = [] // Marca a tecla de reinício como não pressionada
  // Gera novas posições para os anéis
  generateRingPositions(20);
}

let isPerspective = true;
let canToggleCamera = true; // Variável para controlar se a câmera pode ser alternada

function setCamera() {
  if (canToggleCamera) {
    isPerspective = !isPerspective;
    canToggleCamera = false; // Impede que a câmera seja alternada novamente imediatamente

    // Reativa a possibilidade de alternar a câmera após um pequeno intervalo de tempo
    setTimeout(() => {
      canToggleCamera = true;
    }, 200); // Ajuste o tempo conforme necessário
  }
}



let currentCameraPos = [0, 0, 0]; // Posição inicial da câmera
let prevOffset // Variável para armazenar o deslocamento anterior da câmera

function updateCamera() {

  

  let offsetX 
  let offsetY 
  let offsetZ 

  // ajustar os deslocamentos
  if(!isPerspective){
    offsetX = 0;
    offsetY = 2;
    offsetZ = -6; // Deslocamento maior para visualização em terceira pessoa
  }
  else{
    offsetX = 0;
    offsetY = 1;
    offsetZ = -1.4; // Deslocamento menor para visualização em primeira pessoa
  }

  // Calcular o alvo de deslocamento baseado nas direções dos eixos (x, y, z)
  const offsetTarget = [
    x[0] * offsetX + y[0] * offsetY + z[0] * offsetZ,
    x[1] * offsetX + y[1] * offsetY + z[1] * offsetZ,
    x[2] * offsetX + y[2] * offsetY + z[2] * offsetZ,
  ];

  // Definir o fator de suavização para a transição da câmera
  const smoothFactor = 0.08;
  
  // Inicializar o deslocamento anterior se não estiver definido
  if (typeof prevOffset === 'undefined') prevOffset = offsetTarget;

  // Suavizar a transição do deslocamento, fazendo a câmera se mover suavemente
  const offset = prevOffset.map((v, i) => v + smoothFactor * (offsetTarget[i] - v));
  
  // Atualizar o deslocamento anterior com o novo valor suavizado
  prevOffset = offset;

  // Calcular a posição final da câmera (P0) com base na posição da aeronave (planePosition) e o deslocamento
  const P0 = [
    planePosition[0] + offset[0],
    planePosition[1] + offset[1],
    planePosition[2] + offset[2],
  ];

  // Referência da posição da aeronave
  const P_ref = [...planePosition];
  
  // Vetor de visão (direção da câmera, geralmente o eixo Y da aeronave)
  const V = [...y];

  // Retornar as variáveis de posição final da câmera, referência e vetor de visão
  return { P0, P_ref, V };
}

// Carregar as texturas utilizadas nos objetos da nave
const textures = {
  metalWorned: loadTexture('../public/textures/metalpreview.png'),
  greyMetal: loadTexture('../public/textures/metalgrey.jpg'),
  greyMetalPolish: loadTexture('../public/textures/metalgreypolish.png'),
  redMetal: loadTexture('../public/textures/redMetal.jpg'),
  glass: loadTexture('../public/textures/windowpane.png')
}

// Função para desenhar a nave espacial (versão 2)
function drawSpaceship2(viewingProjectionMatrix){
  // Matriz da nave (aplicando identidade e transformações)
  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  
  // Corpo da aeronave (escalando e desenhando)
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.2, 0.15, 1); // Escala do corpo
  drawShape(matrixCorpo, textures.greyMetalPolish , gl.TRIANGLES, 'sphere', 128);

  // Desenhando a asa esquerda da nave
  let matrixAsaEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaEsq = m4.translate(matrixAsaEsq, -0.4, 0.06, -0.3); // Translação da asa esquerda
  matrixAsaEsq = m4.scale(matrixAsaEsq, 0.8, 0.1, 0.3);
  drawShape(matrixAsaEsq ,textures.greyMetal, gl.TRIANGLES, 'cube', 32);

  // Desenhando a asa direita da nave
  let matrixAsaDir = m4.multiply(matrixAeronave, m4.identity());
  matrixAsaDir = m4.translate(matrixAsaDir, 0.4, 0.06, -0.3); // Translação da asa direita
  matrixAsaDir = m4.scale(matrixAsaDir, -0.8, 0.1, -0.3);
  drawShape(matrixAsaDir, textures.greyMetal, gl.TRIANGLES, 'cube' ,32);

  // Desenhando os suportes superiores esquerdo e direito
  let matrixSupEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixSupEsq = m4.translate(matrixSupEsq, -0.3, 0, -0.15);
  matrixSupEsq = m4.scale(matrixSupEsq, 0.07, 0.1, 0.6)
  drawShape(matrixSupEsq, textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  matrixSupEsq = m4.translate(matrixSupEsq, -7, 0, -0.10);
  drawShape(matrixSupEsq, textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Desenhando os suportes superiores direito
  let matrixSupDir = m4.multiply(matrixAeronave, m4.identity());
  matrixSupDir = m4.translate(matrixSupDir, 0.3, 0, -0.15);
  matrixSupDir = m4.scale(matrixSupDir, 0.07, 0.1, 0.6);
  drawShape(matrixSupDir, textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  matrixSupEsq = m4.translate(matrixSupDir, 7, 0, -0.10);
  drawShape(matrixSupEsq, textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Desenhando o cabo da nave
  let matrixCable = m4.multiply(matrixAeronave, m4.identity());
  matrixCable = m4.translate(matrixCable, 0, 0.1, -0.8);
  matrixCable = m4.scale(matrixCable, 0.1, 0.3, 0.1);
  matrixCable = m4.zRotate(matrixCable, 4);
  drawShape(matrixCable, textures.redMetal, gl.TRIANGLES, 'cube', 32);

  // Desenhando as janelas da nave
  let matrixJanela = m4.multiply(matrixAeronave, m4.identity());
  matrixJanela = m4.translate(matrixJanela, -0.15, 0, 0.4);
  matrixJanela = m4.scale(matrixJanela, 0.1, 0.1, 0.1);
  drawShape(matrixJanela, textures.glass, gl.TRIANGLES, 'cube', 32);
  matrixJanela = m4.translate(matrixJanela, 3, 0, 0.3);
  drawShape(matrixJanela, textures.glass, gl.TRIANGLES, 'cube', 32);
}

// Função para desenhar a nave espacial (versão 1)
function drawSpaceship1(viewingProjectionMatrix){
  // Matriz da nave (aplicando identidade e transformações)
  let matrixAeronave = m4.multiply(viewingProjectionMatrix, m4.identity());
  matrixAeronave = updateAirplane(matrixAeronave, viewingProjectionMatrix)
  
  // Corpo da aeronave
  let matrixCorpo = m4.multiply(matrixAeronave, m4.identity());
  matrixCorpo = m4.scale(matrixCorpo, 0.3, 0.25, 1); // Escala do corpo
  drawShape(matrixCorpo , textures.greyMetalPolish, gl.TRIANGLES, 'sphere' ,32);

  // Desenhando as turbinas (esquerda, direita e inferior)
  let matrixTurbEsq = m4.multiply(matrixAeronave, m4.identity());
  matrixTurbEsq = m4.translate(matrixTurbEsq, -0.2, 0.1, -0.5);
  matrixTurbEsq = m4.scale(matrixTurbEsq, 0.1, 0.1, 0.6);

  drawShape(matrixTurbEsq, textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  let matrixTurbDir = m4.multiply(matrixAeronave, m4.identity());
  matrixTurbDir = m4.translate(matrixTurbDir, 0.2, 0.1, -0.5);
  matrixTurbDir = m4.scale(matrixTurbDir, 0.1, 0.1, 0.6);
  drawShape(matrixTurbDir, textures.redMetal, gl.TRIANGLES,'sphere' ,32);

  let matrixTurbBaixo = m4.multiply(matrixAeronave, m4.identity());
  matrixTurbBaixo = m4.translate(matrixTurbBaixo, 0,-0.1, -0.5);
  matrixTurbBaixo = m4.scale(matrixTurbBaixo, 0.1, 0.1, 0.6);
 
  drawShape(matrixTurbBaixo, textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Desenhando as janelas da nave
  let matrixJanela = m4.multiply(matrixAeronave, m4.identity());
  matrixJanela = m4.scale(matrixJanela, 0.2, 0.2, 0.2);
  matrixJanela = m4.translate(matrixJanela, 0.97, 0, 1);
  drawShape(matrixJanela, textures.glass, gl.TRIANGLES, 'cube', 32);
  matrixJanela = m4.translate(matrixJanela, -1.97 , 0, 0);
  drawShape(matrixJanela, textures.glass, gl.TRIANGLES, 'cube', 32);
}

// Carregar a textura do fundo (via galáxia)
const backgroundTexture = loadTexture('../public/textures/2k_stars_milky_way.jpg')

// Função para desenhar o fundo (galáxia)
function background(viewingProjectionMatrix){
  let matrixBackground = m4.multiply(viewingProjectionMatrix, m4.identity())
  matrixBackground = m4.scale(matrixBackground, 100, 100, 100) // Escala grande para o fundo
  drawShape(matrixBackground, backgroundTexture, gl.TRIANGLES, 'sphere', 64) // Desenha a esfera de fundo
}

// Variáveis para controlar a rotação e translação dos planetas
let theta = 0
let thetaMercury = 0
let thetaVenus = 0
// Texturas para os planetas
const planetsTextures = {
  sun: loadTexture('../public/textures/2k_sun.jpg'),
  mercury: loadTexture('../public/textures/2k_mercury.jpg'),
  venus: loadTexture('../public/textures/2k_venus_surface.jpg')
}

// Função para desenhar os planetas (Sol e Mercúrio)
// Função para desenhar os planetas na cena
function drawPlanets(viewingProjectionMatrix) {
  // Matriz do Sol
  let matrixSol = m4.multiply(viewingProjectionMatrix, m4.identity()); // Cria uma matriz de transformação para o Sol
  matrixSol = m4.scale(matrixSol, 7, 7, 7); // Aplica escala ao Sol (tamanho)
  matrixSol = m4.translate(matrixSol, sunPosition[0], sunPosition[1], sunPosition[2]); // Posiciona o Sol no espaço
  matrixSol = m4.yRotate(matrixSol, theta+=0.001); // Rotação do Sol em torno do eixo Y
  drawShape(matrixSol, planetsTextures.sun, gl.TRIANGLES, 'sphere', 255); // Desenha o Sol

  // Atualiza a posição de Mercúrio em sua órbita ao redor do Sol
  mercuryPosition[0] = 20 * Math.sin(thetaMercury); // Posição X de Mercúrio
  mercuryPosition[1] = 0; // Posição Y de Mercúrio (fixa no plano)
  mercuryPosition[2] = 20 * Math.cos(thetaMercury); // Posição Z de Mercúrio
  thetaMercury += 0.02; // Atualiza o ângulo de órbita de Mercúrio

  // Matriz de Mercúrio
  let matrixMercury = m4.multiply(viewingProjectionMatrix, m4.identity()); // Cria uma matriz de transformação para Mercúrio
  matrixMercury = m4.translate(matrixMercury, mercuryPosition[0], mercuryPosition[1], mercuryPosition[2]); // Posiciona Mercúrio
  matrixMercury = m4.yRotate(matrixMercury, -thetaMercury); // Rotação de Mercúrio em torno do eixo Y
  matrixMercury = m4.scale(matrixMercury, 3, 3, 3); // Aplica escala a Mercúrio (tamanho)
  drawShape(matrixMercury, planetsTextures.mercury, gl.TRIANGLES, 'sphere', 16); // Desenha Mercúrio

  // Atualiza a posição de Vênus em sua órbita ao redor do Sol
  venusPosition[0] = 30 * Math.sin(thetaVenus); // Posição X de Vênus
  venusPosition[1] = 0; // Posição Y de Vênus (fixa no plano)
  venusPosition[2] = 30 * Math.cos(thetaVenus); // Posição Z de Vênus
  thetaVenus += 0.01; // Atualiza o ângulo de órbita de Vênus

  // Matriz de Vênus
  let matrixVenus = m4.multiply(viewingProjectionMatrix, m4.identity()); // Cria uma matriz de transformação para Vênus
  matrixVenus = m4.translate(matrixVenus, venusPosition[0], venusPosition[1], venusPosition[2]); // Posiciona Vênus
  matrixVenus = m4.scale(matrixVenus, 4, 4, 4); // Aplica escala a Vênus (tamanho)
  drawShape(matrixVenus, planetsTextures.venus, gl.TRIANGLES, 'sphere', 16); // Desenha Vênus
}

// Array para armazenar as posições dos anéis
let ringPositions = new Array();

// Contador de anéis coletados
let ringCounter = 0;

// Função para verificar colisão entre a nave e um anel
function isColliding(ringPosition) {
  // Calcula a distância entre a nave e o anel
  let distance = Math.sqrt(
    Math.pow(planePosition[0] - ringPosition[0], 2) +
    Math.pow(planePosition[1] - ringPosition[1], 2) +
    Math.pow(planePosition[2] - ringPosition[2], 2)
  );

  // Define um limiar de colisão (distância mínima para coletar o anel)
  let collisionThreshold = 2;

  // Retorna true se a distância for menor que o limiar
  return distance < collisionThreshold;
}

// Função para verificar colisão com o Sol
function checkSunCollision() {
  let sunCollisionThreshold = 7; // Limiar de colisão com o Sol
  return getDistance(planePosition, sunPosition) < sunCollisionThreshold;
}

// Função para verificar colisão com Vênus
function checkVenusCollision() {
  let venusCollisionThreshold = 4; // Limiar de colisão com Vênus
  return getDistance(planePosition, venusPosition) < venusCollisionThreshold;
}

// Função para verificar colisão com Mercúrio
function checkMercuryCollision() {
  let mercuryCollisionThreshold = 3; // Limiar de colisão com Mercúrio
  return getDistance(planePosition, mercuryPosition) < mercuryCollisionThreshold;
}

// Função para verificar se a nave está saindo do cenário
function checkBackgroundCollision() {
  const backgroundRadius = 100; // Raio do fundo (escala do background)
  const distanceFromCenter = getDistance([0, 0, 0], planePosition); // Distância da nave ao centro do cenário

  // Retorna true se a distância for maior que o raio do fundo
  return distanceFromCenter > backgroundRadius;
}

// Função para calcular a distância entre dois pontos no espaço 3D
function getDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}


function checkAndRemoveRings() {
  // Verifique e remova os anéis que foram pegos
  for (let i = 0; i < ringPositions.length; i++) {
    if(ringCounter == 20){
      alert('Parabéns! Você coletou todos os anéis!🎉')
    }
    if (isColliding(ringPositions[i])) {
      // Remover o anel da lista
      ringPositions.splice(i, 1);

      // Aumentar o contador de anéis pegos
      ringCounter++;

      // Opcional: fazer algo com o contador, como atualizar na tela
      console.log('Anel pego! Total de anéis pegos: ' + ringCounter);
      
      document.getElementById('ring-counter').textContent = 'Anéis coletados: ' + ringCounter + ' de 20 ' ;
      // Recalcular o índice porque o array foi modificado
      i--;
    }
  }
  if(ringCounter == 20){
    alert('Parabéns! Você coletou todos os anéis!🎉')
    resetGame()
  }
}

//funcao para gerar as posições dos aneis
function generateRingPositions(count) {
  const sunRadius = 7; // Raio do Sol
  for (let i = 0; i < count; i++) {
    let x, y, z;
    do {
      x = (Math.random() - 0.5) * 50; // Gera um valor entre -25 e 25
      y = (Math.random() - 0.5) * 50;
      z = (Math.random() - 0.5) * 50;
    } while (Math.sqrt(x*x + y*y + z*z) < sunRadius + 2); // Garante uma distância mínima do Sol
    
    ringPositions.push([x, y, z]);
  }
}

let thetaRings = 0
const texRing = loadTexture('../public/textures/2k_saturn_ring_alpha.png') // Textura do anel
function drawRings(viewingProjectionMatrix) {
  checkAndRemoveRings() // Verifica e remove os anéis coletados
  for (let i = 0; i < ringPositions.length; i++) {
    let matrixRing = m4.multiply(viewingProjectionMatrix, m4.identity()); // Cria uma matriz de transformação para o anel
    matrixRing = m4.translate(matrixRing, ringPositions[i][0], ringPositions[i][1], ringPositions[i][2]); // Posiciona o anel
    matrixRing = m4.yRotate(matrixRing, thetaRings+=0.001); // Rotação do anel em torno do eixo Y
    drawShape(matrixRing, texRing, gl.TRIANGLE_STRIP, 'ring', 36); // Desenha o anel
  }
}

// Gere as posições apenas uma vez ao iniciar o jogo
generateRingPositions(20);

//funcao para trocar de nave
let isSpaceship = true
function setSpaceship(){
  if (controls['1']){
    isSpaceship = !isSpaceship
    controls['1'] = false
  }
}


  // Configura a iluminação ambiente
ambientLight();

  // Configura a iluminação pontual
puntualLight();
// Função principal que controla o loop de renderização do jogo
function main() {
  // Limpa o buffer de cor e o buffer de profundidade
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Define a matriz de projeção com base no estado atual da câmera
  let projectionMatrix;

  // Cria a matriz de projeção perspectiva
  projectionMatrix = perspectiveProjection(xw_min, xw_max, yw_min, yw_max, z_near, z_far);

  // Atualiza a câmera e obtém sua posição (P0), ponto de referência (P_ref) e vetor de visão (V)
  const { P0, P_ref, V } = updateCamera();

  // Obtém a localização da variável uniforme da posição da câmera no shader
  const cameraPositionLocation = gl.getUniformLocation(program, "u_CameraPosition");

  // Passa a posição da câmera para o shader
  gl.uniform3fv(cameraPositionLocation, [...P0]);

  // Cria a matriz de visualização (viewingMatrix) com base na posição da câmera, ponto de referência e vetor de visão
  let viewingMatrix = set3dViewingMatrix(P0, P_ref, V);

  // Cria a matriz de visualização-projeção (viewingProjectionMatrix)
  let viewingProjectionMatrix = m4.identity();
  viewingProjectionMatrix = m4.multiply(viewingProjectionMatrix, projectionMatrix); // Combina projeção e visualização
  viewingProjectionMatrix = m4.multiply(viewingProjectionMatrix, viewingMatrix);

  // Configura a nave com base no estado atual (escolha entre nave 1 e nave 2)
  setSpaceship();

  // Desenha a nave 1 ou a nave 2, dependendo do estado atual
  if (!isSpaceship) {
    drawSpaceship1(viewingProjectionMatrix); // Desenha a nave 1
  } else {
    drawSpaceship2(viewingProjectionMatrix); // Desenha a nave 2
  }

  // Desenha os anéis na cena
  drawRings(viewingProjectionMatrix);

  // Desenha o fundo (background) da cena
  background(viewingProjectionMatrix);


  // Verifica colisões com os planetas e o fundo do cenário
  if (checkSunCollision()) {
    alert('Você queimou!'); // Alerta de colisão com o Sol
    resetGame(); // Reinicia o jogo
  }
  if (checkVenusCollision()) {
    alert('Você bateu em Vênus!'); // Alerta de colisão com Vênus
    resetGame(); // Reinicia o jogo
  }
  if (checkMercuryCollision()) {
    alert('Você bateu em Mercúrio!'); // Alerta de colisão com Mercúrio
    resetGame(); // Reinicia o jogo
  }
  if (checkBackgroundCollision()) {
    alert('Você saiu do mapa!'); // Alerta de saída do cenário
    resetGame(); // Reinicia o jogo
  }
 
  gl.uniform3fv(gl.getUniformLocation(program, "u_AirplanePosition"), planePosition);
  ambientLight(planePosition)
  puntualLight(planePosition)
  // Desenha os planetas na cena
  drawPlanets(viewingProjectionMatrix);

  // Solicita o próximo quadro de animação (loop de renderização)
  requestAnimationFrame(main);
}


// Função para carregar uma textura a partir de uma URL
function loadTexture(url) {
  // Cria uma textura no WebGL
  const texture = gl.createTexture();

  // Vincula a textura ao contexto WebGL (TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Define parâmetros iniciais para a textura
  const level = 0; // Nível de mipmap (0 = base)
  const internalFormat = gl.RGBA; // Formato interno da textura (RGBA)
  const width = 1; // Largura inicial da textura (1 pixel)
  const height = 1; // Altura inicial da textura (1 pixel)
  const border = 0; // Sem borda
  const srcFormat = gl.RGBA; // Formato dos dados de origem (RGBA)
  const srcType = gl.UNSIGNED_BYTE; // Tipo dos dados de origem (8 bits por canal)
  const pixel = new Uint8Array([0, 0, 255, 255]); // Pixel inicial (azul opaco)

  // Carrega um pixel inicial na textura (para evitar erros enquanto a imagem é carregada)
  gl.texImage2D(
    gl.TEXTURE_2D, // Tipo de textura (2D)
    level, // Nível de mipmap
    internalFormat, // Formato interno
    width, // Largura
    height, // Altura
    border, // Borda
    srcFormat, // Formato dos dados de origem
    srcType, // Tipo dos dados de origem
    pixel, // Dados do pixel
  );

  // Cria uma nova imagem para carregar a textura
  const image = new Image();

  // Define o callback para quando a imagem for carregada
  image.onload = () => {
    // Vincula a textura novamente ao contexto WebGL
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Carrega a imagem na textura
    gl.texImage2D(
      gl.TEXTURE_2D, // Tipo de textura (2D)
      level, // Nível de mipmap
      internalFormat, // Formato interno
      srcFormat, // Formato dos dados de origem
      srcType, // Tipo dos dados de origem
      image, // Imagem carregada
    );

    // Verifica se a imagem tem dimensões que são potências de 2
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Se for potência de 2, gera mipmaps para a textura
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // Se não for potência de 2, desativa mipmaps e ajusta os parâmetros de textura
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // Ajusta o modo de wrapping no eixo S (horizontal)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // Ajusta o modo de wrapping no eixo T (vertical)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Define o filtro de minificação como LINEAR
    }
  };

  // Define a URL da imagem a ser carregada
  image.src = url;

  // Retorna a textura criada
  return texture;
}

// Função para verificar se um valor é uma potência de 2
function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

//seta as coordenadas de textura na origem do cubo
function setCubeTexCoords() {
  return [
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Top
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];
}


//seta as coordenadas do cubo na origem
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


function setCubeNormals() {
  return [
    // Front face (6 vértices)
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,
    0.0, 0.0, 1.0,

    // Back face (6 vértices)
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,
    0.0, 0.0, -1.0,

    // Top face (6 vértices)
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 0.0,

    // Bottom face (6 vértices)
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,
    0.0, -1.0, 0.0,

    // Right face (6 vértices)
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,

    // Left face (6 vértices)
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0,
  ];
}
function createBufferData(gl, program, data, attributeName, size) {
  // Cria um buffer no WebGL
  const buffer = gl.createBuffer();

  // Obtém a localização do atributo no shader
  const location = gl.getAttribLocation(program, attributeName);

  // Verifica se o atributo foi encontrado no shader
  if (location === -1) {
    console.warn(`Attribute ${attributeName} not found in shader program.`);
  }

  // Vincula o buffer ao contexto WebGL (ARRAY_BUFFER)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Carrega os dados no buffer (converte para Float32Array)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

  // Habilita o atributo no shader
  gl.enableVertexAttribArray(location);

  // Define como os dados do buffer serão interpretados pelo shader
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

  // Retorna o buffer criado
  return buffer;
}
function setSphereVertices(radius, slices, stacks) {
  const vertexData = []; // Array para armazenar os vértices da esfera
  let slicesStep = (2 * Math.PI) / slices; // Passo angular para slices (longitude)
  let stacksStep = Math.PI / stacks; // Passo angular para stacks (latitude)

  // Gera os vértices da esfera
  for (let i = 0; i < stacks; i++) {
    let phi = -Math.PI / 2 + i * stacksStep; // Ângulo de latitude
    for (let j = 0; j < slices; j++) {
      let theta = -Math.PI + j * slicesStep; // Ângulo de longitude

      // Adiciona os vértices de dois triângulos que formam um "quadrado" na esfera
      vertexData.push(
        ...[
          radius * Math.cos(phi) * Math.cos(theta), // Vértice 1
          radius * Math.cos(phi) * Math.sin(theta),
          radius * Math.sin(phi),
        ],
        ...[
          radius * Math.cos(phi + stacksStep) * Math.cos(theta), // Vértice 2
          radius * Math.cos(phi + stacksStep) * Math.sin(theta),
          radius * Math.sin(phi + stacksStep),
        ],
        ...[
          radius * Math.cos(phi) * Math.cos(theta + slicesStep), // Vértice 3
          radius * Math.cos(phi) * Math.sin(theta + slicesStep),
          radius * Math.sin(phi),
        ],
        ...[
          radius * Math.cos(phi + stacksStep) * Math.cos(theta), // Vértice 4 (repetido)
          radius * Math.cos(phi + stacksStep) * Math.sin(theta),
          radius * Math.sin(phi + stacksStep),
        ],
        ...[
          radius * Math.cos(phi + stacksStep) * Math.cos(theta + slicesStep), // Vértice 5
          radius * Math.cos(phi + stacksStep) * Math.sin(theta + slicesStep),
          radius * Math.sin(phi + stacksStep),
        ],
        ...[
          radius * Math.cos(phi) * Math.cos(theta + slicesStep), // Vértice 6 (repetido)
          radius * Math.cos(phi) * Math.sin(theta + slicesStep),
          radius * Math.sin(phi),
        ]
      );
    }
  }

  return vertexData; // Retorna os vértices da esfera
}


function setSphereNormals_smooth(radius, slices, stacks) {
  const normalData = []; // Array para armazenar as normais da esfera
  let slicesStep = (2 * Math.PI) / slices; // Passo angular para slices (longitude)
  let stacksStep = Math.PI / stacks; // Passo angular para stacks (latitude)

  // Gera as normais da esfera
  for (let i = 0; i < stacks; i++) {
    let phi = -Math.PI / 2 + i * stacksStep; // Ângulo de latitude
    for (let j = 0; j < slices; j++) {
      let theta = -Math.PI + j * slicesStep; // Ângulo de longitude

      // Calcula as normais (vetores normalizados)
      let nx1 = Math.cos(phi) * Math.cos(theta);
      let ny1 = Math.cos(phi) * Math.sin(theta);
      let nz1 = Math.sin(phi);

      let nx2 = Math.cos(phi + stacksStep) * Math.cos(theta);
      let ny2 = Math.cos(phi + stacksStep) * Math.sin(theta);
      let nz2 = Math.sin(phi + stacksStep);

      let nx3 = Math.cos(phi) * Math.cos(theta + slicesStep);
      let ny3 = Math.cos(phi) * Math.sin(theta + slicesStep);
      let nz3 = Math.sin(phi);

      let nx4 = Math.cos(phi + stacksStep) * Math.cos(theta);
      let ny4 = Math.cos(phi + stacksStep) * Math.sin(theta);
      let nz4 = Math.sin(phi + stacksStep);

      let nx5 = Math.cos(phi + stacksStep) * Math.cos(theta + slicesStep);
      let ny5 = Math.cos(phi + stacksStep) * Math.sin(theta + slicesStep);
      let nz5 = Math.sin(phi + stacksStep);

      let nx6 = Math.cos(phi) * Math.cos(theta + slicesStep);
      let ny6 = Math.cos(phi) * Math.sin(theta + slicesStep);
      let nz6 = Math.sin(phi);

      // Adiciona as normais normalizadas ao array
      normalData.push(nx1, ny1, nz1);
      normalData.push(nx2, ny2, nz2);
      normalData.push(nx3, ny3, nz3);
      normalData.push(nx4, ny4, nz4);
      normalData.push(nx5, ny5, nz5);
      normalData.push(nx6, ny6, nz6);
    }
  }

  return normalData; // Retorna as normais da esfera
}



function setSphereTexCoords(slices, stacks) {
  const texCoordData = []; // Array para armazenar as coordenadas de textura
  const sliceStep = 1.0 / slices; // Passo horizontal (u) para as coordenadas de textura
  const stackStep = 1.0 / stacks; // Passo vertical (v) para as coordenadas de textura

  // Gera as coordenadas de textura para a esfera
  for (let i = 0; i < stacks; i++) {
    const v = i * stackStep; // Coordenada vertical (v) da textura
    for (let j = 0; j < slices; j++) {
      const u = j * sliceStep; // Coordenada horizontal (u) da textura

      // Adiciona as coordenadas de textura para cada vértice
      texCoordData.push(u, v); // Vértice 1
      texCoordData.push(u, v + stackStep); // Vértice 2
      texCoordData.push(u + sliceStep, v); // Vértice 3
      texCoordData.push(u, v + stackStep); // Vértice 4 (repetido)
      texCoordData.push(u + sliceStep, v + stackStep); // Vértice 5
      texCoordData.push(u + sliceStep, v); // Vértice 6 (repetido)
    }
  }

  return texCoordData; // Retorna as coordenadas de textura
}




function setRingVertices(majorRadius, minorRadius, majorSegments, minorSegments) {
  const vertices = []; // Array para armazenar os vértices do anel


  // Gera os vértices do anel
  for (let slice = 0; slice <= majorSegments; ++slice) {
    const v = slice / majorSegments; // Progressão ao longo do anel (0 a 1)
    const slice_angle = v * 2 * Math.PI; // Ângulo da fatia (em radianos)
    const cos_slices = Math.cos(slice_angle); // Cosseno do ângulo da fatia
    const sin_slices = Math.sin(slice_angle); // Seno do ângulo da fatia
    const slice_rad = majorRadius + minorRadius * cos_slices; // Raio da fatia atual

    // Gera os vértices ao longo do "tubo" do anel
    for (let loop = 0; loop <= minorSegments; ++loop) {
      const u = loop / minorSegments; // Progressão ao longo do tubo (0 a 1)
      const loop_angle = u * 2 * Math.PI; // Ângulo do loop (em radianos)
      const cos_loops = Math.cos(loop_angle); // Cosseno do ângulo do loop
      const sin_loops = Math.sin(loop_angle); // Seno do ângulo do loop

      // Calcula as coordenadas (x, y, z) do vértice
      const x = slice_rad * cos_loops;
      const y = slice_rad * sin_loops;
      const z = minorRadius * sin_slices;

      // Adiciona o vértice ao array
      vertices.push(x, y, z);
    }
  }

  return vertices; // Retorna os vértices do anel
}
function setRingTexCoords(majorSegments, minorSegments) {
  const texCoords = []; // Array para armazenar as coordenadas de textura do anel

  // Gera as coordenadas de textura (UV) para o anel
  for (let slice = 0; slice <= majorSegments; ++slice) {
    const v = slice / majorSegments; // Coordenada `v` (ao longo do anel, de 0 a 1)

    for (let loop = 0; loop <= minorSegments; ++loop) {
      const u = loop / minorSegments; // Coordenada `u` (ao redor do tubo, de 0 a 1)

      // Adiciona as coordenadas de textura (u, v) ao array
      texCoords.push(u, v);
    }
  }

  return texCoords; // Retorna as coordenadas de textura
}

function setRingNormals(majorSegments, minorSegments) {
  const normals = []; // Array para armazenar as normais do anel

  // Gera as normais do anel
  for (let slice = 0; slice <= majorSegments; ++slice) {
    const v = slice / majorSegments; // Progressão ao longo do anel (0 a 1)
    const slice_angle = v * 2 * Math.PI; // Ângulo da fatia (em radianos)
    const cos_slices = Math.cos(slice_angle); // Cosseno do ângulo da fatia
    const sin_slices = Math.sin(slice_angle); // Seno do ângulo da fatia

    // Gera as normais ao redor do tubo
    for (let loop = 0; loop <= minorSegments; ++loop) {
      const u = loop / minorSegments; // Progressão ao redor do tubo (0 a 1)
      const loop_angle = u * 2 * Math.PI; // Ângulo do loop (em radianos)
      const cos_loops = Math.cos(loop_angle); // Cosseno do ângulo do loop
      const sin_loops = Math.sin(loop_angle); // Seno do ângulo do loop

      // Calcula as normais (nx, ny, nz) para o vértice
      const nx = cos_loops * sin_slices;
      const ny = sin_loops * sin_slices;
      const nz = cos_slices;

      // Adiciona a normal ao array
      normals.push(nx, ny, nz);
    }
  }

  return normals; // Retorna as normais do anel
}



function quaternionFromAxisAngle(axis, angle) {
  const halfAngle = angle / 2; // Metade do ângulo de rotação
  const s = Math.sin(halfAngle); // Seno da metade do ângulo

  return {
    w: Math.cos(halfAngle), // Componente escalar (w)
    x: axis[0] * s, // Componente x (eixo de rotação * seno)
    y: axis[1] * s, // Componente y (eixo de rotação * seno)
    z: axis[2] * s  // Componente z (eixo de rotação * seno)
  };
}

// Função para multiplicar dois quaternions
function multiplyQuaternions(q1, q2) {
  return {
    w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z, // Componente w
    x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y, // Componente x
    y: q1.w * q2.y + q1.y * q2.w + q1.z * q2.x - q1.x * q2.z, // Componente y
    z: q1.w * q2.z + q1.z * q2.w + q1.x * q2.y - q1.y * q2.x  // Componente z
  };
}

function applyQuaternionToVector(q, v) {
  const qv = { w: 0, x: v[0], y: v[1], z: v[2] }; // Converte o vetor em um quaternion (w = 0)
  
  const qConjugate = { w: q.w, x: -q.x, y: -q.y, z: -q.z }; // Conjugado do quaternion
  const qResult = multiplyQuaternions(multiplyQuaternions(q, qv), qConjugate); // Aplica a rotação

  return [qResult.x, qResult.y, qResult.z]; // Retorna o vetor rotacionado
}

function applyAxisAngle(axis, angle, vector) {
  const quaternion = quaternionFromAxisAngle(axis, angle); // Cria um quaternion a partir do eixo e ângulo
  
  // Aplica a rotação no vetor usando o quaternion
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



  // Configura os vértices, normais e coordenadas de textura do Sol (esfera com normais invertidas)
  const radius = 1; // Raio do Sol
  const slices = 80; // Número de fatias (longitude)
  const stacks = 80; // Número de camadas (latitude)
  // Configura os vértices, normais e coordenadas de textura do anel (torus)
  const majorRadius = 1; // Raio maior do anel
  const minorRadius = 0.4; // Raio menor do anel (seção transversal)
  const majorSegments = 100; // Número de fatias do anel
  const minorSegments = 60; // Número de segmentos no tubo (corte transversal)
  
  // Configura os vértices, normais e coordenadas de textura do cubo
  let vertexDataCube = setCubeVertices(); // Gera os vértices do cubo
  let normalDataCube = setCubeNormals(); // Gera as normais do cubo
  let texCoordDataCube = setCubeTexCoords(); // Gera as coordenadas de textura do cubo
 
  const vertexDataSphere = setSphereVertices(radius, slices, stacks); // Gera os vértices da esfera
  const normalDataSphere = setSphereNormals_smooth(radius, slices, stacks); // Gera as normais da esfera
  const texCoordDataSphere = setSphereTexCoords(slices, stacks); // Gera as coordenadas de textura da esfera
  // Gera os dados do anel
  const vertexDataRing = setRingVertices(majorRadius, minorRadius, majorSegments, minorSegments); // Gera os vértices do anel
  const normalDataRing = setRingNormals(majorSegments, minorSegments); // Gera as normais do anel
  const texCoordDataRing = setRingTexCoords(majorSegments, minorSegments); // Gera as coordenadas de textura do anel


  // Cria e configura os buffers para vértices, normais e coordenadas de textura
  const positionBufferCube = createBufferData(gl, program, vertexDataCube, "a_Position", 3);
  const normalBufferCube = createBufferData(gl, program, normalDataCube, "a_Normal", 3);
  const texCoordBufferCube = createBufferData(gl, program, texCoordDataCube, "a_TexCoord", 2);

  // Cria e configura os buffers para vértices, normais e coordenadas de textura
  const positionBufferSphere = createBufferData(gl, program, vertexDataSphere, "a_Position", 3);
  const normalBufferSphere = createBufferData(gl, program, normalDataSphere, "a_Normal", 3);
  const texCoordBufferSphere = createBufferData(gl, program, texCoordDataSphere, "a_TexCoord", 2);
  
  const positionBufferRing = createBufferData(gl, program, vertexDataRing, "a_Position", 3);
  const normalBufferRing = createBufferData(gl, program, normalDataRing, "a_Normal", 3);
  const texCoordBufferRing = createBufferData(gl, program, texCoordDataRing, "a_TexCoord", 2);
  


function drawShape(matrix, texture, mode, type, shininess) {
  // Obtém a localização do uniform u_Shininess no shader
  const shininessLocation = gl.getUniformLocation(program, "u_Shininess");

  // Passa o valor de brilho (shininess) para o shader
  gl.uniform1f(shininessLocation, shininess);

  // Calcula a matriz inversa transposta (normal matrix) para transformar normais corretamente
  const normalMatrix = invTransposeMatrix(matrix); // Função que calcula a normal matrix

  // Passa a matriz inversa transposta para o shader
  const normalMatrixLocation = gl.getUniformLocation(program, "u_NormalMatrix");
  gl.uniformMatrix4fv(normalMatrixLocation, false, normalMatrix);

  // Verifica o tipo de objeto a ser desenhado
  if (type == 'cube') {

    // Configura os atributos dos buffers no shader
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferCube);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferCube);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferCube);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    // Passa a matriz de transformação para o shader
    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);

    // Configura a textura
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "u_Texture"), 0);
    // Desenha o cubo
    gl.drawArrays(mode, 0, vertexDataCube.length / 3);
  }

  if (type == 'sphere') {
    // Configura os atributos dos buffers no shader
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferSphere);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferSphere);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferSphere);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    // Passa a matriz de transformação para o shader
    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);

    // Configura a textura
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "u_Texture"), 0);

    // Desenha a esfera
    gl.drawArrays(mode, 0, vertexDataSphere.length / 3);
  }

 

  if (type == 'ring') {

    // Configura os atributos dos buffers no shader
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRing);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferRing);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBufferRing);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLocation);

    // Passa a matriz de transformação para o shader
    gl.uniformMatrix4fv(matrixUniformLocation, false, matrix);

    // Configura a textura
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "u_Texture"), 0);

    // Desenha o anel
    gl.drawArrays(mode, 0, vertexDataRing.length / 3);
  }
}
function invTransposeMatrix(matrix) {
  let invMatrix = m4.inverse(matrix);       // Inverte a matriz
  return m4.transpose(invMatrix);           // Transpõe a inversa
}



function set3dViewingMatrix(P0, P_ref, V) {
  let matrix = [];

  // Calcula o vetor N (direção da câmera para o ponto de referência)
  let N = [
      P0[0] - P_ref[0],
      P0[1] - P_ref[1],
      P0[2] - P_ref[2],
  ];

  // Normaliza o vetor N
  let n = unitVector(N);

  // Calcula o vetor U (eixo X da câmera) como o produto vetorial entre V (vetor "up") e N
  let u = unitVector(crossProduct(V, n));

  // Calcula o vetor V (eixo Y da câmera) como o produto vetorial entre N e U
  let v = crossProduct(n, u);

  // Matriz de translação T (move a câmera para a origem)
  let T = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -P0[0], -P0[1], -P0[2], 1,
  ];

  // Matriz de rotação R (alinhamento dos eixos da câmera com os eixos do mundo)
  let R = [
      u[0], v[0], n[0], 0,
      u[1], v[1], n[1], 0,
      u[2], v[2], n[2], 0,
      0, 0, 0, 1,
  ];

  // Combina a matriz de rotação e translação para obter a matriz de visualização
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

  transformPoint: function (matrix, point) {
    // Converte o ponto para coordenadas homogêneas (adiciona w = 1)
    const x = point[0];
    const y = point[1];
    const z = point[2];
    const w = 1;

    // Aplica a transformação da matriz ao ponto
    const xNew = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w;
    const yNew = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w;
    const zNew = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w;
    const wNew = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w;

    // Converte de volta para coordenadas 3D (divide por w)
    return [
      xNew / wNew,
      yNew / wNew,
      zNew / wNew
    ] ;
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