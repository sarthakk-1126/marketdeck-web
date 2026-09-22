// Earth-specific lighting, in linear space. A photographic approximation, not a
// live weather/astronomy simulation. No full-screen bloom or postprocessing passes.
export const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vTangent;
  void main() {
    vUv = uv;
    vLocalNormal = normalize(normal);
    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec3 east = normalize(vec3(normal.z, 0.0, -normal.x) + vec3(0.00001, 0.0, 0.0));
    vTangent = normalize(mat3(modelMatrix) * east);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shared = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vTangent;
  uniform vec3 uSun;
  uniform vec3 uIndia;
  uniform sampler2D uWeather;
  uniform float uCloudOffset;
  float coverage(vec2 uv) {
    return smoothstep(0.12, 0.92, texture2D(uWeather, vec2(fract(uv.x + uCloudOffset), uv.y)).r);
  }
`;

export const surfaceFragment = shared + /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uNormalMap;
  uniform float uCloudShell;
  uniform float uCloudShadow;
  uniform float uSurfaceDetail;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vPosition);
    vec3 normal = N;
    if (uSurfaceDetail > 0.5) {
      vec3 T = normalize(vTangent);
      vec3 B = normalize(cross(N, T));
      vec3 detail = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      normal = normalize(N * detail.z + (T * detail.x + B * detail.y) * 0.16);
    }
    float sunHeight = dot(N, uSun);
    float diffuse = max(dot(normal, uSun), 0.0);
    float day = smoothstep(-0.17, 0.22, sunHeight);
    vec2 weather = texture2D(uWeather, vUv).rg;
    float sea = smoothstep(0.2, 0.8, weather.g);
    float india = smoothstep(0.92, 0.996, dot(normalize(vLocalNormal), uIndia));

    vec3 albedo = texture2D(uDay, vUv).rgb;
    float luminance = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
    albedo = mix(vec3(luminance), albedo, 0.72);
    albedo *= 0.76 + india * 0.38;
    // Open water has its own material response; no plastic specular on continents.
    albedo = mix(albedo, mix(vec3(0.003, 0.014, 0.031), albedo * 0.3, 0.35), sea);
    float cloud = smoothstep(0.12, 0.92, weather.r);
    float shadow = 0.0;
    if (uCloudShadow > 0.5) shadow = coverage(vUv + vec2(-0.0017, 0.0008));
    vec3 direct = vec3(1.0, 0.96, 0.88) * (0.075 + diffuse * 1.0);
    vec3 fill = vec3(0.025, 0.042, 0.065) + india * vec3(0.10, 0.14, 0.16);
    vec3 color = albedo * (direct * day + fill) * (1.0 - shadow * 0.32);

    vec3 H = normalize(uSun + V);
    float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    float glint = pow(max(dot(normal, H), 0.0), 90.0);
    color += sea * day * glint * (0.16 + fresnel) * vec3(0.62, 0.75, 0.87);

    // City lights are in the source map, emerge only in twilight/shadow, and stay
    // attached to geographic UVs. Regional emphasis never paints a country border.
    float night = 1.0 - smoothstep(-0.12, 0.35, sunHeight);
    if (night > 0.001) {
      vec3 lights = texture2D(uNight, vUv).rgb;
      color += lights * night * (0.85 + india * 4.5) * (1.0 - cloud * 0.65);
    }
    float limb = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    color += vec3(0.045, 0.15, 0.28) * limb * (0.08 + day * 0.6);
    // Low tier retains cloud detail composited on the surface after retiring the
    // optional elevated shell; it does not suddenly become a cloudless planet.
    vec3 clouds = vec3(0.62, 0.72, 0.80) * (0.10 + diffuse * 1.2);
    color = mix(color, clouds, cloud * 0.72 * (1.0 - uCloudShell));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const cloudFragment = shared + /* glsl */ `
  void main() {
    vec3 N = normalize(vNormal);
    float sunHeight = dot(N, uSun);
    float cloud = coverage(vUv);
    float light = 0.085 + max(sunHeight, 0.0) * 1.25;
    vec3 color = vec3(0.65, 0.76, 0.86) * light;
    gl_FragColor = vec4(color, cloud * 0.72);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const atmosphereFragment = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  uniform vec3 uSun;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vPosition);
    float facing = abs(dot(N, V));
    // Optical density falls exponentially with altitude. Fade to zero at the
    // outer mesh boundary, removing the former solid blue circumference.
    float altitude = clamp((1.035 * sqrt(max(0.0, 1.0-facing*facing)) - 1.0) / 0.035, 0.0, 1.0);
    float density = exp(-altitude * 4.5) * (1.0 - smoothstep(0.65, 1.0, altitude));
    float sunlight = smoothstep(-0.3, 0.8, dot(N, uSun));
    vec3 color = mix(vec3(0.035, 0.075, 0.16), vec3(0.17, 0.42, 0.72), sunlight);
    gl_FragColor = vec4(color, density * (0.12 + 0.44 * sunlight));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const nodeVertex = /* glsl */ `
  uniform float uPixelRatio;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 15.0 * uPixelRatio;
  }
`;

export const nodeFragment = /* glsl */ `
  uniform float uOpacity;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.10, 0.28, r);
    float halo = exp(-r*r*5.5) * (1.0-smoothstep(0.8, 1.0, r));
    vec3 color = mix(vec3(0.25, 0.64, 0.68), vec3(1.0, 0.92, 0.70), core);
    gl_FragColor = vec4(color, (core * 0.9 + halo * 0.4) * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
