import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Decorative sculpture, never a representation of live prices. The existing
// experience controller owns the clock, visibility and visitor motion preference.
export async function createMarketBlock(canvas, onFailure) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.1,30);
  camera.position.set(0,.1,8);
  camera.lookAt(0,.1,0);
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x070b12);
  const studioGeometry = new THREE.PlaneGeometry(1,1);
  const studioMaterials = [];
  const softbox = (position,size,color,intensity) => {
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide});
    studioMaterials.push(material);
    const light=new THREE.Mesh(studioGeometry,material);
    light.position.set(...position);light.scale.set(...size,1);light.lookAt(0,0,0);room.add(light);
  };
  softbox([-3,5,4],[7,1.3],0xe0ecff,5);
  softbox([0,2,5],[3.5,4],0xbac8dc,1.8);
  softbox([4,1,-3],[1.2,6],0x77b7f3,1.8);
  softbox([-4,-.5,1],[.7,4],0x98adc5,2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room,.04, .1, 100);
  scene.environment = environment.texture;
  studioGeometry.dispose();studioMaterials.forEach(material=>material.dispose());pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xbad6f5,0x09101c,.8));
  const key = new THREE.DirectionalLight(0xe0ecff,2.8);
  key.position.set(-3,6,5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x77b7f3,1.6);
  rim.position.set(4,1,-2); scene.add(rim);
  const fill = new THREE.PointLight(0x4a9fff,3,8,2);
  fill.position.set(2,-.6,3); scene.add(fill);
  const studioKey = new THREE.PointLight(0xd3dfef,24,12,2);
  studioKey.position.set(-2,3,5);scene.add(studioKey);
  const sculpture = new THREE.Group(); scene.add(sculpture);
  const resources = [];
  const own = resource => {resources.push(resource);return resource;};
  const geometry = own(new RoundedBoxGeometry(.43,.43,.43,1,.015));
  const metal = own(new THREE.MeshStandardMaterial({color:0x526071,metalness:.9,roughness:.30,envMapIntensity:1.1}));
  const blocks = new THREE.InstancedMesh(geometry,metal,216);
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blocks.frustumCulled = false;
  sculpture.add(blocks);
  const voxels = [], pitch=.475, transform=new THREE.Object3D();
  for(let ix=0;ix<6;ix++) for(let iy=0;iy<6;iy++) for(let iz=0;iz<6;iz++) {
    const index=voxels.length;
    const candle=iy===5&&((iz===5&&ix>=2)||(iz===4&&ix>=4));
    const height=[.28,.52,.35,.72,.44,.82][ix] + (iz===4?.14:0);
    voxels.push({ix,iy,iz,index,candle,height,x:(ix-2.5)*pitch,y:(iy-2.5)*pitch,z:(iz-2.5)*pitch});
    blocks.setColorAt(index,new THREE.Color().setScalar(.88+((ix*7+iy*3+iz)%9)*.017));
  }
  const wickGeometry=own(new THREE.CylinderGeometry(.008,.008,1,6));
  const wickMaterial=own(new THREE.MeshBasicMaterial({color:0x91caf5,transparent:true,opacity:0}));
  const candles=voxels.filter(v=>v.candle);
  const wicks=new THREE.InstancedMesh(wickGeometry,wickMaterial,candles.length);
  wicks.frustumCulled=false; sculpture.add(wicks);
  const seamMaterial=own(new THREE.MeshBasicMaterial({color:0x184174,transparent:true,opacity:.08,depthWrite:false}));
  const seam=new THREE.Mesh(own(new THREE.BoxGeometry(2.7,.018,2.7)),seamMaterial);
  sculpture.add(seam);
  // An irregular, deliberately non-data trace sits in the opening between rows.
  const points=[[-1.30,-.46],[-1.16,-.26],[-1.04,-.31],[-.89,-.13],[-.73,-.18],[-.59,-.03],[-.44,-.09],[-.32,-.28],[-.17,-.17],[-.01,-.04],[.12,.20],[.25,.12],[.37,.32],[.52,.23],[.65,.45],[.78,.29],[.91,.42],[1.05,.35],[1.18,.58],[1.30,.53]].map(([a,b])=>new THREE.Vector3(a,b,1.48));
  const curve=new THREE.CatmullRomCurve3(points,false,'catmullrom',.08);
  const traceGeometry=own(new THREE.TubeGeometry(curve,110,.008,5,false));
  const traceMaterial=own(new THREE.MeshBasicMaterial({color:0x80c5ff,transparent:true,opacity:1}));
  const trace=new THREE.Mesh(traceGeometry,traceMaterial); sculpture.add(trace);
  const haloMaterial=own(new THREE.MeshBasicMaterial({color:0x2588e7,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending}));
  const halo=new THREE.Mesh(own(new THREE.TubeGeometry(curve,110,.032,5,false)),haloMaterial); sculpture.add(halo);
  const signal=new THREE.Mesh(own(new THREE.SphereGeometry(.023,10,8)),own(new THREE.MeshBasicMaterial({color:0xd0f2ff})));
  sculpture.add(signal);
  const signalHalo=new THREE.Mesh(own(new THREE.SphereGeometry(.07,12,8)),own(new THREE.MeshBasicMaterial({color:0x489ef5,transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending})));
  sculpture.add(signalHalo);
  // A small shader plane grounds the real geometry without shadow-map/postprocessing cost.
  const ground=new THREE.Mesh(own(new THREE.PlaneGeometry(7,7)),own(new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{uOpen:{value:0}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv; uniform float uOpen; void main(){float d=length((vUv-.5)*vec2(1.,1.6));float pool=exp(-d*d*24.);float shadow=exp(-d*d*65.);vec3 c=mix(vec3(.015,.025,.04),vec3(.07,.23,.5),uOpen*.6+.3);gl_FragColor=vec4(c,pool*.65+shadow*.2);}'
  })));
  ground.rotation.x=-Math.PI/2;ground.position.y=-2.05;scene.add(ground);
  let disposed=false, width=1,height=1,elapsed=5400,previous=0,quality=1,slowFrames=0;
  const ease=v=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*v*(v*(v*6-15)+10);};
  function resize(w,h){
    width=Math.max(1,w);height=Math.max(1,h);
    const phone=width<600;
    const cap=phone?650000:1300000;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,phone?1.6:1.5,Math.sqrt(cap/(width*height)))*quality);
    renderer.setSize(width,height,false);
    const aspect=width/height, span=phone?6.4:6.25;
    const halfHeight=Math.max(span/2,span/(2*aspect));
    camera.aspect=aspect;
    camera.position.y=1.2;
    camera.position.z=halfHeight/Math.tan(THREE.MathUtils.degToRad(17));
    camera.lookAt(0,.1,0);camera.updateProjectionMatrix();
    canvas.dataset.buffer=`${canvas.width}x${canvas.height}`;
  }
  function render({progress=0,entrance=1,time=0,x=0,y=0,moving=true}={}){
    if(disposed||renderer.getContext().isContextLost())return;
    const start=performance.now();
    if(previous&&moving)elapsed+=Math.min(64,Math.max(0,time-previous));
    previous=time;
    const cycle=(elapsed%17000)/1000;
    const open=ease((cycle-1.7)/3.8)*(1-ease((cycle-10.5)/4.4));
    sculpture.rotation.set(.27+y*.055,-.65+Math.sin(elapsed*.00019)*.13+x*.07,-.035);
    sculpture.position.set(0,.05+Math.sin(elapsed*.0004)*.045-(1-entrance)*.12,0);
    sculpture.scale.setScalar(1+Math.min(progress,.5)*.06);
    for(const v of voxels){
      const front=v.iz>=3;
      const upper=v.iy>=3;
      const reveal=front?open:open*.42;
      const spread=reveal*(upper?.25:-.17);
      const stagger=front?reveal*(v.ix/5)*.10:0;
      transform.position.set(v.x+stagger,v.y+spread,v.z+(front?reveal*.12:0));
      transform.scale.set(1,1,1);transform.rotation.set(0,0,0);
      if(v.candle){
        transform.scale.y=1+open*(v.height/.43);
        transform.position.y+=open*(v.height*.5 + (v.ix%2?.13:0));
        transform.position.x+=open*.08*(v.ix-1);
        transform.position.z+=open*.12;
      }
      if(front&&(v.iy===2||v.iy===3)){
        transform.position.y+=open*(v.iy===3?.17:-.17);
        transform.position.z+=open*.12*(v.ix%2);
      }
      transform.updateMatrix();blocks.setMatrixAt(v.index,transform.matrix);
      if(v.candle){
        const wickHeight=.43*transform.scale.y+.32*open;
        transform.scale.set(1,wickHeight,1);transform.updateMatrix();
        wicks.setMatrixAt(candles.indexOf(v),transform.matrix);
      }
    }
    blocks.instanceMatrix.needsUpdate=true;wicks.instanceMatrix.needsUpdate=true;
    wickMaterial.opacity=open*.85;
    seamMaterial.opacity=.025+open*.075;
    seam.position.y=.02;
    traceMaterial.opacity=ease((open-.15)/.65)*.95;
    haloMaterial.opacity=traceMaterial.opacity*.20;
    signal.visible=signalHalo.visible=open>.35;
    signal.position.copy(curve.getPoint((elapsed%4200)/4200));signalHalo.position.copy(signal.position);
    ground.material.uniforms.uOpen.value=open;
    renderer.render(scene,camera);
    // Gradually reduce only the artwork's buffer on a consistently slow GPU.
    if(performance.now()-start>24)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>70&&quality>.7){quality-=.15;slowFrames=0;resize(width,height);}
    canvas.dataset.phase=open>.6?'open':open<.15?'solid':'transition';
  }
  const lost=event=>{event.preventDefault();onFailure('context-lost');};
  canvas.addEventListener('webglcontextlost',lost);
  canvas.dataset.engine=`three.js r${THREE.REVISION}`;
  canvas.dataset.material='kinetic-graphite';
  canvas.dataset.instances=String(voxels.length);
  function dispose(){
    if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);
    blocks.dispose();wicks.dispose();resources.forEach(resource=>resource.dispose());
    environment.dispose();renderer.dispose();
  }
  return {resize,render,dispose};
}
