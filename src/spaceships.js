import { m4 } from './m4.js';
import { drawShape, loadTexture, getGl } from './renderer.js';
import { getAircraftMatrix } from './aircraft.js';

let textures;

// import.meta.url é src/spaceships.js → ../public/textures/ = public/textures/ na raiz
const _tex = new URL('../public/textures/', import.meta.url).href;

export function initSpaceships() {
  textures = {
    metalWorned:     loadTexture(_tex + 'metalpreview.png'),
    greyMetal:       loadTexture(_tex + 'metalgrey.jpg'),
    greyMetalPolish: loadTexture(_tex + 'metalgreypolish.png'),
    redMetal:        loadTexture(_tex + 'redmetal.jpg'),
    glass:           loadTexture(_tex + 'windowpane.png'),
  };
}

/*
 * Cada drawShape recebe (viewProj, modelMatrix, ...).
 * modelMatrix descreve a posição e orientação do objeto em world space.
 * O renderer calcula MVP = viewProj × modelMatrix internamente.
 */

export function drawSpaceship1(viewProj) {
  const gl  = getGl();
  const mat = getAircraftMatrix();          // world-space: translação + rotação da nave

  // Corpo
  drawShape(viewProj, m4.scale(mat, 0.3, 0.25, 1),
    textures.greyMetalPolish, gl.TRIANGLES, 'sphere', 32);

  // Turbinas
  drawShape(viewProj, m4.scale(m4.translate(mat, -0.2, 0.1, -0.5), 0.1, 0.1, 0.6),
    textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  drawShape(viewProj, m4.scale(m4.translate(mat, 0.2, 0.1, -0.5), 0.1, 0.1, 0.6),
    textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  drawShape(viewProj, m4.scale(m4.translate(mat, 0, -0.1, -0.5), 0.1, 0.1, 0.6),
    textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Janelas
  let jan = m4.translate(m4.scale(mat, 0.2, 0.2, 0.2), 0.97, 0, 1);
  drawShape(viewProj, jan, textures.glass, gl.TRIANGLES, 'cube', 32);
  drawShape(viewProj, m4.translate(jan, -1.97, 0, 0), textures.glass, gl.TRIANGLES, 'cube', 32);
}

export function drawSpaceship2(viewProj) {
  const gl  = getGl();
  const mat = getAircraftMatrix();

  // Corpo
  drawShape(viewProj, m4.scale(mat, 0.2, 0.15, 1),
    textures.greyMetalPolish, gl.TRIANGLES, 'sphere', 128);

  // Asas
  drawShape(viewProj, m4.scale(m4.translate(mat, -0.4, 0.06, -0.3), 0.8, 0.1, 0.3),
    textures.greyMetal, gl.TRIANGLES, 'cube', 32);
  drawShape(viewProj, m4.scale(m4.translate(mat, 0.4, 0.06, -0.3), -0.8, 0.1, -0.3),
    textures.greyMetal, gl.TRIANGLES, 'cube', 32);

  // Suporte esquerdo + ponta
  const sE = m4.scale(m4.translate(mat, -0.3, 0, -0.15), 0.07, 0.1, 0.6);
  drawShape(viewProj, sE, textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  drawShape(viewProj, m4.translate(sE, -7, 0, -0.10), textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Suporte direito + ponta
  const sD = m4.scale(m4.translate(mat, 0.3, 0, -0.15), 0.07, 0.1, 0.6);
  drawShape(viewProj, sD, textures.redMetal, gl.TRIANGLES, 'sphere', 32);
  drawShape(viewProj, m4.translate(sD, 7, 0, -0.10), textures.redMetal, gl.TRIANGLES, 'sphere', 32);

  // Cabo
  drawShape(viewProj,
    m4.zRotate(m4.scale(m4.translate(mat, 0, 0.1, -0.8), 0.1, 0.3, 0.1), 4),
    textures.redMetal, gl.TRIANGLES, 'cube', 32);

  // Janelas
  let jan = m4.scale(m4.translate(mat, -0.15, 0, 0.4), 0.1, 0.1, 0.1);
  drawShape(viewProj, jan, textures.glass, gl.TRIANGLES, 'cube', 32);
  drawShape(viewProj, m4.translate(jan, 3, 0, 0.3), textures.glass, gl.TRIANGLES, 'cube', 32);
}
