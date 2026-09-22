import * as THREE from 'three';
import { earthVertex, surfaceFragment, cloudFragment, atmosphereFragment, nodeVertex, nodeFragment } from './earth-shaders.js';

// The controller owns the only animation clock. This module only renders its state.
export async function createGlobe(canvas, onFailure) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'default' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const mobile = matchMedia('(max-width: 800px)').matches;
  const tier = mobile || renderer.capabilities.maxTextureSize < 4096 ? '2k' : '4k';
  const loader = new THREE.TextureLoader();
  const textures = [];
  let disposed = false;
  const load = async (name, color = true) => {
    const texture = await loader.loadAsync(`/assets/earth/${name}.webp`);
    if (disposed) { texture.dispose(); throw new Error('Globe disposed'); }
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    texture.wrapS = THREE.RepeatWrapping;
    textures.push(texture);
    return texture;
  };
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
  camera.position.z = 4.7;
  const earth = new THREE.Group();
  scene.add(earth);
  // SphereGeometry's u=0 starts at longitude -180. Geographic positions use the same convention.
  const geo = (lat, lon, radius = 1) => {
    const phi = THREE.MathUtils.degToRad(90 - lat), theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
  };
  const orientation = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(23), THREE.MathUtils.degToRad(-169), 0, 'XYZ'));
  const uniforms = {
    uDay: { value: null }, uNight: { value: null }, uNormalMap: { value: null },
    uWeather: { value: null }, uCloudOffset: { value: 0 },
    uCloudShell: { value: 1 }, uCloudShadow: { value: 1 }, uSurfaceDetail: { value: 1 },
    uSun: { value: new THREE.Vector3(-1.3, .4, .25).normalize() },
    uIndia: { value: geo(22, 79) }
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: earthVertex, fragmentShader: surfaceFragment });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), material);
  earth.add(sphere);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.003, 96, 64), new THREE.ShaderMaterial({
    uniforms, vertexShader: earthVertex, fragmentShader: cloudFragment,
    transparent: true, depthWrite: false
  }));
  earth.add(clouds);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 64), new THREE.ShaderMaterial({
    uniforms, vertexShader: earthVertex, fragmentShader: atmosphereFragment,
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending
  }));
  earth.add(atmosphere);
  const network = new THREE.Group(); earth.add(network);
  const cities = [[19.076,72.878],[28.614,77.209],[12.972,77.595],[13.083,80.271],[22.573,88.364],[17.385,78.487],[23.023,72.571]];
  const nodeMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: {value: 1}, uPixelRatio: {value: 1} },
    vertexShader: nodeVertex, fragmentShader: nodeFragment,
    transparent: true, depthWrite: false
  });
  const nodeGeometry = new THREE.BufferGeometry().setFromPoints(cities.map(city => geo(...city, 1.009)));
  network.add(new THREE.Points(nodeGeometry, nodeMat));
  const arcs = [];
  const routes = [[0,1],[0,2],[2,3],[3,4],[4,1],[0,5],[0,6]];
  for (const [a,b] of routes) {
    const start = geo(...cities[a]), end = geo(...cities[b]);
    const points = Array.from({length:49},(_,i)=> start.clone().lerp(end,i/48).normalize().multiplyScalar(1.011 + Math.sin(Math.PI*i/48)*.035));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x84bdcb,transparent:true,opacity:.42}));
    network.add(line); arcs.push(line);
  }
  let w=1,h=1,quality=0,renderSamples=[],cadenceSamples=[],last=0;
  function resize(width,height) {
    w=Math.max(1,width); h=Math.max(1,height);
    const cap=mobile?650000:1600000;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5,Math.sqrt(cap/(w*h))) * (quality>1?.8:1));
    renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    nodeMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    canvas.dataset.buffer=`${canvas.width}x${canvas.height}`;
  }
  function render({progress=0, entrance=1, time=0, x=0,y=0, moving=true}) {
    if(disposed || renderer.getContext().isContextLost()) return;
    const start=performance.now();
    const drift=moving?Math.sin(time*.00009)*.012:0;
    const settle=(1-entrance)*.035;
    earth.quaternion.copy(orientation);
    earth.rotateY(drift+x*.022+settle+progress*.055);
    earth.rotateX(y*.016);
    // Keep the settled globe beside the unchanged headline; move towards centre during the story.
    const halfHeight=Math.tan(THREE.MathUtils.degToRad(17))*camera.position.z;
    earth.position.set(mobile?0:halfHeight*camera.aspect*(.43*(1-Math.min(1,progress*2))),mobile?-.4:0,0);
    earth.scale.setScalar((mobile?.92:1.08)*(1+Math.min(progress/.2,1)*.10));
    network.visible=entrance>.28;
    nodeMat.uniforms.uOpacity.value=Math.min(1,Math.max(0,(entrance-.28)/.42));
    clouds.visible = quality === 0;
    uniforms.uCloudShell.value = clouds.visible ? 1 : 0;
    uniforms.uCloudShadow.value = quality === 0 ? 1 : 0;
    uniforms.uSurfaceDetail.value = quality === 0 ? 1 : 0;
    arcs.forEach((arc,i)=>{arc.visible=quality===0||i<3;arc.geometry.setDrawRange(0,Math.ceil(49*Math.min(1,Math.max(0,(entrance-.33)/.42))));});
    renderer.render(scene,camera);
    renderSamples.push(performance.now()-start);
    if(last&&time-last<150&&moving)cadenceSamples.push(time-last);
    if(renderSamples.length===90){const mean=renderSamples.reduce((a,b)=>a+b,0)/90,cadence=cadenceSamples.length?cadenceSamples.reduce((a,b)=>a+b,0)/cadenceSamples.length:0; if((mean>18||cadence>28)&&quality<2){quality++; resize(w,h);} canvas.dataset.renderMs=mean.toFixed(2);canvas.dataset.cadenceMs=cadence.toFixed(2);canvas.dataset.quality=String(quality);renderSamples=[];cadenceSamples=[];}
    if(last) canvas.dataset.frameMs=(time-last).toFixed(1); last=time;
  }
  function dispose() {
    if(disposed)return;disposed=true;
    const geometries=new Set(),materials=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();
    canvas.removeEventListener('webglcontextlost',lost);
  }
  function lost(e){e.preventDefault();onFailure('context-lost');dispose();}
  canvas.addEventListener('webglcontextlost',lost);
  try {
    const [day,night,normal,weather] = await Promise.all([load(`day-${tier}`),load(`night-${tier}`),load('normal',false),load(`cloud-ocean-${tier}`,false)]);
    uniforms.uDay.value=day;uniforms.uNight.value=night;uniforms.uNormalMap.value=normal;uniforms.uWeather.value=weather;
    await renderer.compileAsync(scene,camera);
    canvas.dataset.textureTier=tier;
    canvas.dataset.material='earth-photographic';
    return {resize,render,dispose};
  } catch(error){dispose();throw error;}
}
