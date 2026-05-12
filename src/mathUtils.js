export function crossProduct(v1, v2) {
  return [
    v1[1]*v2[2] - v1[2]*v2[1],
    v1[2]*v2[0] - v1[0]*v2[2],
    v1[0]*v2[1] - v1[1]*v2[0],
  ];
}

export function dotProduct(v1, v2) {
  if (v1.length !== v2.length) throw new Error('Os vetores devem ter o mesmo comprimento.');
  return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
}

export function addVector(a, b) {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

export function scaleVector(v, scalar) {
  return [v[0]*scalar, v[1]*scalar, v[2]*scalar];
}

export function vectorModulus(v) {
  return Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
}

export function unitVector(v) {
  const arr = Array.isArray(v) ? v : [v.x, v.y, v.z];
  const mod = vectorModulus(arr);
  if (mod === 0) throw new Error('O vetor não pode ter módulo zero.');
  return arr.map(x => x / mod);
}

export function quaternionFromAxisAngle(axis, angle) {
  const half = angle / 2;
  const s = Math.sin(half);
  return { w: Math.cos(half), x: axis[0]*s, y: axis[1]*s, z: axis[2]*s };
}

export function multiplyQuaternions(q1, q2) {
  return {
    w: q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z,
    x: q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y,
    y: q1.w*q2.y + q1.y*q2.w + q1.z*q2.x - q1.x*q2.z,
    z: q1.w*q2.z + q1.z*q2.w + q1.x*q2.y - q1.y*q2.x,
  };
}

export function applyQuaternionToVector(q, v) {
  const qv = { w: 0, x: v[0], y: v[1], z: v[2] };
  const qConj = { w: q.w, x: -q.x, y: -q.y, z: -q.z };
  const r = multiplyQuaternions(multiplyQuaternions(q, qv), qConj);
  return [r.x, r.y, r.z];
}

export function applyAxisAngle(axis, angle, vector) {
  return applyQuaternionToVector(quaternionFromAxisAngle(axis, angle), vector);
}

export function buildRotationMatrix(x, y, z) {
  return [
    x[0], x[1], x[2], 0,
    y[0], y[1], y[2], 0,
    z[0], z[1], z[2], 0,
    0,    0,    0,    1,
  ];
}

export function radToDeg(r) { return r * 180 / Math.PI; }
export function degToRad(d) { return d * Math.PI / 180; }
