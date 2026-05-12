export function setCubeVertices() {
  return [
    // Front
     0.5,  0.5,  0.5,   0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // Left
    -0.5,  0.5,  0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5, -0.5,
    -0.5,  0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5, -0.5, -0.5,
    // Back
    -0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,
    // Right
     0.5,  0.5, -0.5,   0.5, -0.5, -0.5,   0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,   0.5, -0.5,  0.5,   0.5, -0.5, -0.5,
    // Top
     0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,   0.5,  0.5, -0.5,  -0.5,  0.5, -0.5,
    // Bottom
     0.5, -0.5,  0.5,   0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5, -0.5, -0.5,  -0.5, -0.5, -0.5,
  ];
}

export function setCubeNormals() {
  const f = [0,0,1], b = [0,0,-1], t = [0,1,0], bo = [0,-1,0], r = [1,0,0], l = [-1,0,0];
  const face = n => Array(6).fill(n).flat();
  return [...face(f), ...face(l), ...face(b), ...face(r), ...face(t), ...face(bo)];
}

export function setCubeTexCoords() {
  // 6 vértices por face (2 triângulos) × 6 faces = 36 pares UV
  const face = [0,0, 1,0, 1,1, 0,1, 0,0, 1,1];
  return Array(6).fill(face).flat();
}

export function setSphereVertices(radius, slices, stacks) {
  const verts = [];
  const sliceStep = (2 * Math.PI) / slices;
  const stackStep = Math.PI / stacks;
  for (let i = 0; i < stacks; i++) {
    const phi = -Math.PI / 2 + i * stackStep;
    for (let j = 0; j < slices; j++) {
      const theta = -Math.PI + j * sliceStep;
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const cp1 = Math.cos(phi + stackStep), sp1 = Math.sin(phi + stackStep);
      const ct = Math.cos(theta), st = Math.sin(theta);
      const ct1 = Math.cos(theta + sliceStep), st1 = Math.sin(theta + sliceStep);
      verts.push(
        radius*cp*ct,  radius*cp*st,  radius*sp,
        radius*cp1*ct, radius*cp1*st, radius*sp1,
        radius*cp*ct1, radius*cp*st1, radius*sp,
        radius*cp1*ct, radius*cp1*st, radius*sp1,
        radius*cp1*ct1,radius*cp1*st1,radius*sp1,
        radius*cp*ct1, radius*cp*st1, radius*sp
      );
    }
  }
  return verts;
}

export function setSphereNormals_smooth(radius, slices, stacks) {
  const norms = [];
  const sliceStep = (2 * Math.PI) / slices;
  const stackStep = Math.PI / stacks;
  for (let i = 0; i < stacks; i++) {
    const phi = -Math.PI / 2 + i * stackStep;
    for (let j = 0; j < slices; j++) {
      const theta = -Math.PI + j * sliceStep;
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const cp1 = Math.cos(phi + stackStep), sp1 = Math.sin(phi + stackStep);
      const ct = Math.cos(theta), st = Math.sin(theta);
      const ct1 = Math.cos(theta + sliceStep), st1 = Math.sin(theta + sliceStep);
      norms.push(
        cp*ct,  cp*st,  sp,
        cp1*ct, cp1*st, sp1,
        cp*ct1, cp*st1, sp,
        cp1*ct, cp1*st, sp1,
        cp1*ct1,cp1*st1,sp1,
        cp*ct1, cp*st1, sp
      );
    }
  }
  return norms;
}

export function setSphereTexCoords(slices, stacks) {
  const coords = [];
  const su = 1 / slices, sv = 1 / stacks;
  for (let i = 0; i < stacks; i++) {
    const v = i * sv;
    for (let j = 0; j < slices; j++) {
      const u = j * su;
      coords.push(
        u,    v,
        u,    v+sv,
        u+su, v,
        u,    v+sv,
        u+su, v+sv,
        u+su, v
      );
    }
  }
  return coords;
}

export function setRingVertices(majorRadius, minorRadius, majorSegments, minorSegments) {
  const verts = [];
  for (let slice = 0; slice <= majorSegments; slice++) {
    const v = slice / majorSegments;
    const sa = v * 2 * Math.PI;
    const cs = Math.cos(sa), ss = Math.sin(sa);
    const sliceRad = majorRadius + minorRadius * cs;
    for (let loop = 0; loop <= minorSegments; loop++) {
      const u = loop / minorSegments;
      const la = u * 2 * Math.PI;
      const cl = Math.cos(la), sl = Math.sin(la);
      verts.push(sliceRad * cl, sliceRad * sl, minorRadius * ss);
    }
  }
  return verts;
}

export function setRingNormals(majorSegments, minorSegments) {
  const norms = [];
  for (let slice = 0; slice <= majorSegments; slice++) {
    const sa = (slice / majorSegments) * 2 * Math.PI;
    const cs = Math.cos(sa), ss = Math.sin(sa);
    for (let loop = 0; loop <= minorSegments; loop++) {
      const la = (loop / minorSegments) * 2 * Math.PI;
      const cl = Math.cos(la), sl = Math.sin(la);
      norms.push(cl * ss, sl * ss, cs);
    }
  }
  return norms;
}

export function setRingTexCoords(majorSegments, minorSegments) {
  const coords = [];
  for (let slice = 0; slice <= majorSegments; slice++) {
    const v = slice / majorSegments;
    for (let loop = 0; loop <= minorSegments; loop++) {
      coords.push(loop / minorSegments, v);
    }
  }
  return coords;
}
