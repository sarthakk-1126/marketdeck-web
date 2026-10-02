import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Decorative sculpture, never a representation of live prices. The existing
// experience controller owns the clock, visibility and visitor motion preference.
export async function createMarketBlock(canvas, onFailure) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.1,30);
  camera.position.set(0,.1,8);
  camera.lookAt(0,.1,0);
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x142238);
  const studioGeometry = new THREE.PlaneGeometry(1,1);
  const studioMaterials = [];
  const softbox = (position,size,color,intensity) => {
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide});
    studioMaterials.push(material);
    const light=new THREE.Mesh(studioGeometry,material);
    light.position.set(...position);light.scale.set(...size,1);light.lookAt(0,0,0);room.add(light);
  };
  softbox([-3,5,4],[7,1.3],0xe0ecff,5);
  softbox([0,2,5],[3.5,4],0xc8d8ed,3);
  softbox([4,1,-3],[1.2,6],0x77b7f3,1.8);
  softbox([-4,-.5,1],[.7,4],0x98adc5,2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room,.04, .1, 100);
  scene.environment = environment.texture;
  studioGeometry.dispose();studioMaterials.forEach(material=>material.dispose());pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xc5def5,0x142238,1.2));
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
  const metal = own(new THREE.MeshStandardMaterial({color:0x7186a1,metalness:.84,roughness:.29,envMapIntensity:1.3}));
  // One small instanced attribute adds local blue reflections, with no extra
  // meshes, bloom pass or per-block lights.
  const touchLight = new THREE.InstancedBufferAttribute(new Float32Array(216),1);
  touchLight.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('touchLight',touchLight);
  metal.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float touchLight; varying float vTouchLight;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTouchLight=touchLight;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vTouchLight;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(.08,.32,.72)*vTouchLight;');
  };
  metal.customProgramCacheKey=()=> 'market-block-touch-v1';
  const blocks = new THREE.InstancedMesh(geometry,metal,216);
  blocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  blocks.frustumCulled = false;
  blocks.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.4,0),3.8);
  sculpture.add(blocks);
  const voxels = [], pitch=.475, transform=new THREE.Object3D();
  for(let ix=0;ix<6;ix++) for(let iy=0;iy<6;iy++) for(let iz=0;iz<6;iz++) {
    const index=voxels.length;
    const candle=iy===5&&((iz===5&&ix>=2)||(iz===4&&ix>=4));
    const height=[.28,.52,.35,.72,.44,.82][ix] + (iz===4?.14:0);
    voxels.push({ix,iy,iz,index,candle,height,x:(ix-2.5)*pitch,y:(iy-2.5)*pitch,z:(iz-2.5)*pitch,offset:0,velocity:0,normal:new THREE.Vector3(0,0,1)});
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
  const traceGeometry=own(new THREE.TubeGeometry(curve,110,.011,5,false));
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
    fragmentShader:'varying vec2 vUv; uniform float uOpen; void main(){float d=length((vUv-.5)*vec2(1.,1.6));float pool=exp(-d*d*20.);float shadow=exp(-d*d*65.);vec3 c=mix(vec3(.035,.09,.18),vec3(.10,.32,.65),uOpen*.45+.4);gl_FragColor=vec4(c,pool*.75+shadow*.15);}'
  })));
  ground.rotation.x=-Math.PI/2;ground.position.y=-2.05;scene.add(ground);
  const backlight=new THREE.Mesh(own(new THREE.PlaneGeometry(8,7)),own(new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv; void main(){float d=length((vUv-.5)*vec2(1.,1.15));float a=exp(-d*d*17.)*.26;gl_FragColor=vec4(.09,.27,.52,a);}'
  })));
  backlight.position.set(0,.3,-2.7);scene.add(backlight);
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const hitLight=new THREE.Vector3(2,-.6,3);
  let pointerActive=false,hover=null,pendingTap=false,lastRipple=-1000,lastPick=-1000,pickedHit;
  const ripples=[];
  let disposed=false,painted=false,width=1,height=1,elapsed=350,previous=0,quality=1,slowFrames=0;
  const cycleMs=6200;
  function setPointer(point){
    pointerActive=!!point;if(point)pointer.set(point.x,point.y);
  }
  function tap(point){setPointer(point);pendingTap=true;}
  function emit(v,normal,pressed=false){
    ripples.push({v,normal:normal.clone(),at:elapsed,pressed});
    if(ripples.length>4)ripples.shift();lastRipple=elapsed;
  }
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
    backlight.quaternion.copy(camera.quaternion);
    canvas.dataset.buffer=`${canvas.width}x${canvas.height}`;
  }
  function render({progress=0,entrance=1,time=0,x=0,y=0,moving=true}={}){
    if(disposed||renderer.getContext().isContextLost())return;
    const start=performance.now();
    const dt=previous&&moving?Math.min(100,Math.max(0,time-previous))/1000:0;
    if(!painted&&!moving)elapsed=2200; // Accessible static pose also exports the poster.
    elapsed+=dt*1000;painted=true;
    previous=time;
    const cycle=(elapsed%cycleMs)/1000;
    const opening=delay=>ease((cycle-.10-delay)/1.05)*(1-ease((cycle-3.65-delay)/1.65));
    const open=opening(.22),turn=Math.sin(elapsed/cycleMs*Math.PI*2);
    sculpture.rotation.set(.27+y*.055+turn*.015,-.65+turn*.17+x*.07,-.035);
    sculpture.position.set(0,.05+Math.sin(elapsed*.001)*.055-(1-entrance)*.12,0);
    sculpture.scale.setScalar(1+Math.min(progress,.5)*.06);
    if(moving){
      sculpture.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      // Touch releases also fire pointerleave. Keep the queued tap independent
      // of hover so it survives until the next shared animation frame.
      if((pointerActive||pendingTap)&&(pendingTap||elapsed-lastPick>=33)){
        raycaster.setFromCamera(pointer,camera);pickedHit=raycaster.intersectObject(blocks,false)[0];lastPick=elapsed;
      }
      const hit=pointerActive||pendingTap?pickedHit:null;
      const next=hit?voxels[hit.instanceId]:null;
      if(next){
        const normal=hit.face.normal.clone().normalize();
        if(pendingTap||next!==hover&&elapsed-lastRipple>100)emit(next,normal,pendingTap);
        next.normal.copy(normal);
        hitLight.copy(hit.point).addScaledVector(normal.clone().transformDirection(sculpture.matrixWorld),.9);
      }else hitLight.set(2,-.6,3);
      hover=pendingTap?null:next;
      if(pendingTap){pendingTap=false;pointerActive=false;canvas.dataset.interaction='tap';}
      else canvas.dataset.interaction=hover?'hover':'idle';
      fill.position.lerp(hitLight,1-Math.exp(-dt*12));
      for(let i=ripples.length-1;i>=0;i--)if(elapsed-ripples[i].at>1400)ripples.splice(i,1);
    }
    let maxOffset=0;
    for(const v of voxels){
      const rowOpen=opening(v.ix*.045+v.iy*.025);
      const front=v.iz>=3;
      const upper=v.iy>=3;
      const reveal=front?rowOpen:rowOpen*.42;
      const spread=reveal*(upper?.29:-.20);
      const stagger=front?reveal*(v.ix/5)*.10:0;
      transform.position.set(v.x+stagger,v.y+spread,v.z+(front?reveal*.12:0));
      transform.scale.set(1,1,1);transform.rotation.set(0,0,0);
      if(v.candle){
        const candleOpen=THREE.MathUtils.clamp(rowOpen*(1+.065*Math.sin(elapsed*.0028+v.ix)),0,1.03);
        transform.scale.y=1+candleOpen*(v.height/.43);
        transform.position.y+=candleOpen*(v.height*.5 + (v.ix%2?.13:0));
        transform.position.x+=rowOpen*.08*(v.ix-1);
        transform.position.z+=rowOpen*.12;
      }
      if(front&&(v.iy===2||v.iy===3)){
        transform.position.y+=rowOpen*(v.iy===3?.17:-.17);
        transform.position.z+=rowOpen*.12*(v.ix%2);
      }
      if(moving){
        let target=0,glint=0;
        if(hover){
          const distance=(v.ix-hover.ix)**2+(v.iy-hover.iy)**2+(v.iz-hover.iz)**2;
          const influence=Math.exp(-distance*1.25);
          target+=.085*influence;glint+=influence*.45;
          if(influence>.01)v.normal.copy(hover.normal);
        }
        for(const ripple of ripples){
          const age=(elapsed-ripple.at)/1000;
          const distance=Math.hypot(v.ix-ripple.v.ix,v.iy-ripple.v.iy,v.iz-ripple.v.iz);
          const wave=Math.exp(-((distance-age*4.4)**2)/.38)*Math.exp(-age*1.65);
          const press=ripple.pressed?Math.exp(-distance*distance*2)*Math.exp(-age*age/ .008):0;
          target+=wave*.075-press*.16;glint+=wave*.65;
          if(wave>.03||press>.02)v.normal.copy(ripple.normal);
        }
        target=THREE.MathUtils.clamp(target,-.11,.12);
        // Bounded spring steps keep the tiles stable on slower phone GPUs.
        const steps=Math.max(1,Math.ceil(dt/.016)),step=dt/steps;
        for(let n=0;n<steps;n++){v.velocity+=(target-v.offset)*240*step;v.velocity*=Math.exp(-24*step);v.offset+=v.velocity*step;}
        touchLight.setX(v.index,Math.min(.9,glint));
      }
      transform.position.addScaledVector(v.normal,v.offset);
      maxOffset=Math.max(maxOffset,Math.abs(v.offset));
      transform.updateMatrix();blocks.setMatrixAt(v.index,transform.matrix);
      if(v.candle){
        const wickHeight=.43*transform.scale.y+.32*open;
        transform.scale.set(1,wickHeight,1);transform.updateMatrix();
        wicks.setMatrixAt(candles.indexOf(v),transform.matrix);
      }
    }
    blocks.instanceMatrix.needsUpdate=true;wicks.instanceMatrix.needsUpdate=true;touchLight.needsUpdate=true;
    wickMaterial.opacity=open*.85;
    seamMaterial.opacity=.025+open*.075;
    seam.position.y=.02;
    traceMaterial.opacity=ease((open-.15)/.65)*.95;
    haloMaterial.opacity=traceMaterial.opacity*.20;
    signal.visible=signalHalo.visible=open>.35;
    signal.position.copy(curve.getPoint(THREE.MathUtils.clamp((cycle-.75)/2.7,0,1)));signalHalo.position.copy(signal.position);
    ground.material.uniforms.uOpen.value=open;
    renderer.render(scene,camera);
    // Gradually reduce only the artwork's buffer on a consistently slow GPU.
    if(performance.now()-start>24)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>70&&quality>.7){quality-=.15;slowFrames=0;resize(width,height);}
    canvas.dataset.phase=open>.6?'open':open<.15?'solid':'transition';
    canvas.dataset.hover=hover?String(hover.index):'';
    canvas.dataset.ripples=String(ripples.length);
    canvas.dataset.displacement=maxOffset.toFixed(4);
    canvas.dataset.cycle=String(cycleMs);
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
  return {resize,render,setPointer,tap,dispose};
}
