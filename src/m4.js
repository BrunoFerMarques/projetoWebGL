export const m4 = {
  identity() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  },

  multiply(a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12],a31 = a[13],a32 = a[14], a33 = a[15];
    const b00 = b[0], b01 = b[1], b02 = b[2],  b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6],  b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12],b31 = b[13],b32 = b[14], b33 = b[15];
    return [
      b00*a00 + b01*a10 + b02*a20 + b03*a30,
      b00*a01 + b01*a11 + b02*a21 + b03*a31,
      b00*a02 + b01*a12 + b02*a22 + b03*a32,
      b00*a03 + b01*a13 + b02*a23 + b03*a33,
      b10*a00 + b11*a10 + b12*a20 + b13*a30,
      b10*a01 + b11*a11 + b12*a21 + b13*a31,
      b10*a02 + b11*a12 + b12*a22 + b13*a32,
      b10*a03 + b11*a13 + b12*a23 + b13*a33,
      b20*a00 + b21*a10 + b22*a20 + b23*a30,
      b20*a01 + b21*a11 + b22*a21 + b23*a31,
      b20*a02 + b21*a12 + b22*a22 + b23*a32,
      b20*a03 + b21*a13 + b22*a23 + b23*a33,
      b30*a00 + b31*a10 + b32*a20 + b33*a30,
      b30*a01 + b31*a11 + b32*a21 + b33*a31,
      b30*a02 + b31*a12 + b32*a22 + b33*a32,
      b30*a03 + b31*a13 + b32*a23 + b33*a33,
    ];
  },

  translation(tx, ty, tz) {
    return [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
    ];
  },

  xRotation(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [1, 0, 0, 0,  0, c, s, 0,  0, -s, c, 0,  0, 0, 0, 1];
  },

  yRotation(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c, 0, -s, 0,  0, 1, 0, 0,  s, 0, c, 0,  0, 0, 0, 1];
  },

  zRotation(angle) {
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c, s, 0, 0,  -s, c, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1];
  },

  scaling(sx, sy, sz) {
    return [sx, 0, 0, 0,  0, sy, 0, 0,  0, 0, sz, 0,  0, 0, 0, 1];
  },

  transpose(m, dst) {
    dst = dst || new Float32Array(16);
    dst[0]=m[0]; dst[1]=m[4]; dst[2]=m[8];  dst[3]=m[12];
    dst[4]=m[1]; dst[5]=m[5]; dst[6]=m[9];  dst[7]=m[13];
    dst[8]=m[2]; dst[9]=m[6]; dst[10]=m[10];dst[11]=m[14];
    dst[12]=m[3];dst[13]=m[7];dst[14]=m[11];dst[15]=m[15];
    return dst;
  },

  inverse(m, dst) {
    dst = dst || new Float32Array(16);
    const m00=m[0],m01=m[1],m02=m[2],m03=m[3];
    const m10=m[4],m11=m[5],m12=m[6],m13=m[7];
    const m20=m[8],m21=m[9],m22=m[10],m23=m[11];
    const m30=m[12],m31=m[13],m32=m[14],m33=m[15];
    const t0=m22*m33, t1=m32*m23, t2=m12*m33, t3=m32*m13;
    const t4=m12*m23, t5=m22*m13, t6=m02*m33, t7=m32*m03;
    const t8=m02*m23, t9=m22*m03, t10=m02*m13, t11=m12*m03;
    const t12=m20*m31,t13=m30*m21,t14=m10*m31,t15=m30*m11;
    const t16=m10*m21,t17=m20*m11,t18=m00*m31,t19=m30*m01;
    const t20=m00*m21,t21=m20*m01,t22=m00*m11,t23=m10*m01;
    const r0=(t0*m11+t3*m21+t4*m31)-(t1*m11+t2*m21+t5*m31);
    const r1=(t1*m01+t6*m21+t9*m31)-(t0*m01+t7*m21+t8*m31);
    const r2=(t2*m01+t7*m11+t10*m31)-(t3*m01+t6*m11+t11*m31);
    const r3=(t5*m01+t8*m11+t11*m21)-(t4*m01+t9*m11+t10*m21);
    const d=1/(m00*r0+m10*r1+m20*r2+m30*r3);
    dst[0]=d*r0; dst[1]=d*r1; dst[2]=d*r2; dst[3]=d*r3;
    dst[4]=d*((t1*m10+t2*m20+t5*m30)-(t0*m10+t3*m20+t4*m30));
    dst[5]=d*((t0*m00+t7*m20+t8*m30)-(t1*m00+t6*m20+t9*m30));
    dst[6]=d*((t3*m00+t6*m10+t11*m30)-(t2*m00+t7*m10+t10*m30));
    dst[7]=d*((t4*m00+t9*m10+t10*m20)-(t5*m00+t8*m10+t11*m20));
    dst[8]=d*((t12*m13+t15*m23+t16*m33)-(t13*m13+t14*m23+t17*m33));
    dst[9]=d*((t13*m03+t18*m23+t21*m33)-(t12*m03+t19*m23+t20*m33));
    dst[10]=d*((t14*m03+t19*m13+t22*m33)-(t15*m03+t18*m13+t23*m33));
    dst[11]=d*((t17*m03+t20*m13+t23*m23)-(t16*m03+t21*m13+t22*m23));
    dst[12]=d*((t14*m22+t17*m32+t13*m12)-(t16*m32+t12*m12+t15*m22));
    dst[13]=d*((t20*m32+t12*m02+t19*m22)-(t18*m22+t21*m32+t13*m02));
    dst[14]=d*((t18*m12+t23*m32+t15*m02)-(t22*m32+t14*m02+t19*m12));
    dst[15]=d*((t22*m22+t16*m02+t21*m12)-(t20*m12+t23*m22+t17*m02));
    return dst;
  },

  transformPoint(matrix, point) {
    const x=point[0], y=point[1], z=point[2], w=1;
    const xN=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12]*w;
    const yN=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13]*w;
    const zN=matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]*w;
    const wN=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15]*w;
    return [xN/wN, yN/wN, zN/wN];
  },

  transformNormal(m) {
    const inv = m4.inverse(m);
    return inv ? m4.transpose(inv).slice(0, 9) : null;
  },

  translate(m, tx, ty, tz)      { return m4.multiply(m, m4.translation(tx, ty, tz)); },
  xRotate(m, angle)             { return m4.multiply(m, m4.xRotation(angle)); },
  yRotate(m, angle)             { return m4.multiply(m, m4.yRotation(angle)); },
  zRotate(m, angle)             { return m4.multiply(m, m4.zRotation(angle)); },
  scale(m, sx, sy, sz)          { return m4.multiply(m, m4.scaling(sx, sy, sz)); },
};
