export const vertexShaderSource = `
precision mediump float;

attribute vec3 a_Position;
attribute vec2 a_TexCoord;
attribute vec3 a_Normal;

varying vec2 v_TexCoord;
varying vec3 vNormal;
varying vec3 vPosition;  /* world space */

uniform mat4 matrix;         /* MVP — só para gl_Position              */
uniform mat4 u_ModelMatrix;  /* Model — para posição em world space     */
uniform mat4 u_NormalMatrix; /* transpose(inverse(Model)) — para normais*/

void main() {
  v_TexCoord = a_TexCoord;

  /* Normal em world space: usa apenas a parte 3x3 da normal matrix */
  vNormal = normalize(mat3(u_NormalMatrix) * a_Normal);

  /* Posição em world space (para iluminação) */
  vPosition = vec3(u_ModelMatrix * vec4(a_Position, 1.0));

  /* Posição em clip space (para rasterização) */
  gl_Position = matrix * vec4(a_Position, 1.0);
}
`;

export const fragmentShaderSource = `
precision mediump float;
#define NUM_LIGHTS 8

varying vec2 v_TexCoord;
varying vec3 vNormal;
varying vec3 vPosition;  /* world space */

uniform sampler2D u_Texture;
uniform vec3  u_AmbientColor;
uniform float u_AmbientIntensity;

uniform vec3  u_LightPositions[NUM_LIGHTS];
uniform vec3  u_LightColors[NUM_LIGHTS];
uniform float u_LightIntensity;
uniform float u_Shininess;

void main() {
  /* Inverte a normal em backfaces (resolve o interior da esfera de fundo) */
  vec3 normal = gl_FrontFacing
    ? normalize(vNormal)
    : normalize(-vNormal);

  vec3 ambient = u_AmbientColor * u_AmbientIntensity;

  vec3 diffuseSum  = vec3(0.0);
  vec3 specularSum = vec3(0.0);

  for (int i = 0; i < NUM_LIGHTS; i++) {
    vec3  lightDir = normalize(u_LightPositions[i] - vPosition);
    float diff     = max(dot(normal, lightDir), 0.0);

    /* Atenuação baseada na distância do fragmento à luz (world space) */
    float dist        = length(u_LightPositions[i] - vPosition);
    float attenuation = 1.0 / (1.0 + 0.05 * dist + 0.005 * dist * dist);

    diffuseSum += u_LightColors[i] * diff * attenuation * u_LightIntensity;

    vec3  reflectDir = reflect(-lightDir, normal);
    float spec       = pow(max(dot(normal, reflectDir), 0.0), u_Shininess) * 0.3;
    specularSum += u_LightColors[i] * spec * attenuation * u_LightIntensity;
  }

  vec4 texColor  = texture2D(u_Texture, v_TexCoord);
  vec3 finalColor = texColor.rgb * (ambient + diffuseSum) + specularSum;
  gl_FragColor   = vec4(finalColor, texColor.a);
}
`;
