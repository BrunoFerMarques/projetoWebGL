import { m4 } from './m4.js';
import { drawShape, loadTexture, getGl } from './renderer.js';

let textures;
let backgroundTexture;

let theta        = 0;
let thetaMercury = 0;
let thetaVenus   = 0;

// Posições em world space — lidas por collisions.js
export const sunPosition     = [0, 0, 0];
export const mercuryPosition = [20, 0, 20];
export const venusPosition   = [10, 0, 10];

export function initPlanets() {
  textures = {
    sun:     loadTexture('./public/textures/2k_sun.jpg'),
    mercury: loadTexture('./public/textures/2k_mercury.jpg'),
    venus:   loadTexture('./public/textures/2k_venus_surface.jpg'),
  };
  backgroundTexture = loadTexture('./public/textures/2k_stars_milky_way.jpg');
}

export function resetPlanets() {
  theta = 0; thetaMercury = 0; thetaVenus = 0;
  sunPosition[0]=0;      sunPosition[1]=0;      sunPosition[2]=0;
  mercuryPosition[0]=20; mercuryPosition[1]=0;  mercuryPosition[2]=20;
  venusPosition[0]=10;   venusPosition[1]=0;    venusPosition[2]=10;
}

/*
 * Todas as model matrices partem de m4.identity() e aplicam
 * transformações em world space. O renderer multiplica viewProj × model.
 */

export function drawPlanets(viewProj) {
  const gl = getGl();

  // Sol — escala 7, gira no próprio eixo
  const sunModel = m4.yRotate(m4.scale(m4.identity(), 7, 7, 7), theta += 0.001);
  drawShape(viewProj, sunModel, textures.sun, gl.TRIANGLES, 'sphere', 255);

  // Mercúrio — orbita a 20 unidades do sol
  mercuryPosition[0] = 20 * Math.sin(thetaMercury);
  mercuryPosition[1] = 0;
  mercuryPosition[2] = 20 * Math.cos(thetaMercury);
  thetaMercury += 0.02;
  const mercuryModel = m4.scale(
    m4.yRotate(m4.translate(m4.identity(), mercuryPosition[0], mercuryPosition[1], mercuryPosition[2]), -thetaMercury),
    3, 3, 3
  );
  drawShape(viewProj, mercuryModel, textures.mercury, gl.TRIANGLES, 'sphere', 16);

  // Vênus — orbita a 30 unidades do sol
  venusPosition[0] = 30 * Math.sin(thetaVenus);
  venusPosition[1] = 0;
  venusPosition[2] = 30 * Math.cos(thetaVenus);
  thetaVenus += 0.01;
  const venusModel = m4.scale(
    m4.translate(m4.identity(), venusPosition[0], venusPosition[1], venusPosition[2]),
    4, 4, 4
  );
  drawShape(viewProj, venusModel, textures.venus, gl.TRIANGLES, 'sphere', 16);
}

export function drawBackground(viewProj) {
  const gl = getGl();
  // Esfera grande centrada na origem — interior visível pelo gl_FrontFacing no shader
  drawShape(viewProj, m4.scale(m4.identity(), 100, 100, 100),
    backgroundTexture, gl.TRIANGLES, 'sphere', 64);
}
