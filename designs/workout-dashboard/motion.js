/* One persistent gym room; useful controls remain accessible HTML. */
const host=document.getElementById('spatial-world'),toggle=document.getElementById('motion-toggle');
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 700px)');
const KEY='nhip-tap-motion-v1';
let enabled=true;try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
let THREE,renderer,scene,camera,raycaster,initializing,failed=false,disposed=false,looping=false,frames=0,lastFrame=0;
let current=window.NhipView?.getState()||'overview',transitioning=false,startTime=0,progress=0,playing=false,phase='idle';
let targetPosition,targetLook,fromPosition,fromLook,look,vinyl,progressFill,timerLamp;
const resources=new Set(),hits=[],pins=[...document.querySelectorAll('[data-station]')],stations={};
const pointer={x:0,y:0};
const positions={workout:[-6,0,-4],schedule:[1,0,-7.4],progress:[7,0,-5.8],music:[7,0,3]};
const views={overview:{position:[19,13,23],look:[0,1.3,-2]},workout:{position:[-1.5,5,9],look:[-2.5,2,-4]},schedule:{position:[7,4.5,6],look:[3,2,-6]},progress:{position:[12,4,5],look:[10,1.7,-5]},music:{position:[12,5,12],look:[11,1.4,2]}};
const keep=r=>(resources.add(r),r);
function mat(color,extra={}){return keep(new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.25,...extra}));}
let cube,cylinder,steel,dark,red,white,glow;
function box(parent,w,h,d,x,y,z,surface=steel){const m=new THREE.Mesh(cube,surface);m.scale.set(w,h,d);m.position.set(x,y,z);parent.add(m);return m;}
function round(parent,r,h,x,y,z,surface=steel){const m=new THREE.Mesh(cylinder,surface);m.scale.set(r,h,r);m.position.set(x,y,z);parent.add(m);return m;}
function label(parent,text,w,h,x,y,z,color='#f3f0ec',size=58){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#15171b';ctx.fillRect(0,0,1024,256);ctx.fillStyle=color;ctx.font=`700 ${size}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);const texture=keep(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(keep(new THREE.PlaneGeometry(w,h)),keep(new THREE.MeshBasicMaterial({map:texture})));m.position.set(x,y,z);parent.add(m);return m;}
function station(name){const g=new THREE.Group();g.position.set(...positions[name]);g.userData.station=name;scene.add(g);stations[name]=g;hits.push(g);return g;}
function build(){
 cube=keep(new THREE.BoxGeometry(1,1,1));cylinder=keep(new THREE.CylinderGeometry(1,1,1,20));
 steel=mat(0x78818b);dark=mat(0x171b21);red=mat(0xce2c3c);white=mat(0xc8c6bd);glow=mat(0xff3449,{emissive:0xff1530,emissiveIntensity:2});
 const room=new THREE.Group();scene.add(room);
 box(room,25,.3,23,0,-.2,0,mat(0x35383d));
 box(room,25,8,.3,0,3.8,-10,mat(0x282b31));box(room,.3,8,23,-12.5,3.8,1.4,mat(0x24272c));
 // Open front and right wall let the overview look inside the architecture.
 for(let i=-12;i<=12;i+=3){box(room,.025,.012,22,i,-.04,1,mat(0x55575b));}
 for(let i=-9;i<=12;i+=3)box(room,25,.012,.025,0,-.03,i,steel);
 for(let i=-10;i<=10;i+=5){box(room,.18,7.8,.22,i,3.8,-9.7,dark);box(room,.24,.24,19,i,7.7,-.5,dark);box(room,.08,.05,17,i,7.5,-.4,glow);}
 box(room,24,.08,.08,0,.18,-9.7,glow);box(room,.08,.08,20,-12.2,.18,.3,glow);
 label(room,'N H Ị P   T Ậ P',7,1.4,-5,5.7,-9.78,'#e7e4dc',80);
 label(room,'YOUR SPACE. YOUR PACE.',6,.65,4,6,-9.78,'#e26770',40);
 // Left side window strips and industrial wall panels.
 for(let i=0;i<4;i++){box(room,.03,3.5,1.6,-12.3,4,-6+i*3,mat(0x66717b,{emissive:0x60778c,emissiveIntensity:.35}));box(room,.08,.08,1.8,-12.2,4,-6+i*3,dark);}
 let g=station('workout');
 box(g,5,.08,5,0,.03,0,mat(0x202126));
 for(const x of [-1.6,1.6])for(const z of [-1.2,1.2])box(g,.17,4.7,.17,x,2.4,z,red);
 for(const z of [-1.2,1.2]){box(g,3.5,.15,.18,0,4.7,z,steel);box(g,3.8,.15,.5,0,.18,z,dark);}
 for(const x of [-1.6,1.6]){box(g,.15,.15,2.5,x,4.7,0,steel);box(g,.4,.12,.7,x,2.6,.8,steel);}
 const bar=round(g,.055,4.9,0,2.85,1.1,steel);bar.rotation.z=Math.PI/2;
 for(const x of [-1.95,-1.65,1.65,1.95]){const p=round(g,.52,.17,x,2.85,1.1,dark);p.rotation.z=Math.PI/2;const hub=round(g,.13,.19,x,2.85,1.1,red);hub.rotation.z=Math.PI/2;}
 box(g,.8,.2,2.6,0,1,1.2,dark);for(const z of [.3,2])box(g,.12,.9,.12,0,.5,z,steel);
 box(g,1.25,.7,.3,-2.4,1.6,1.4,dark);box(g,.12,1.5,.2,-2.4,.75,1.4,steel);label(g,'TẬP / NGHỈ',1.1,.4,-2.4,1.65,1.56,'#ff6a77',70);timerLamp=box(g,.12,.12,.05,-2.85,1.85,1.57,glow);
 g=station('schedule');box(g,4.3,3,.2,0,3,0,dark);label(g,'02 / LỊCH TUẦN',3.8,.55,0,4.05,.12,'#efb3b9',70);
 for(let i=0;i<7;i++){box(g,.43,1.55,.08,(i-3)*.51,2.7,.15,i%2?red:steel);label(g,['T2','T3','T4','T5','T6','T7','CN'][i],.4,.35,(i-3)*.51,3.1,.2,'#ffffff',100);}
 for(const x of [-1.6,1.6])box(g,.1,1.6,.15,x,.8,0,steel);
 g=station('progress');box(g,3.4,2.3,.25,0,2.7,0,dark);label(g,'03 / TIẾN ĐỘ',3,.6,0,3.4,.14,'#efb3b9',70);label(g,'TỪ NHỮNG BUỔI TẬP THẬT',3,.5,0,2.9,.14,'#aaaaaa',47);
 box(g,2.7,.22,.08,0,2.3,.15,steel);progressFill=box(g,.01,.24,.09,-1.35,2.3,.2,red);for(const x of [-1.2,1.2])box(g,.12,1.8,.15,x,.9,0,steel);box(g,3.8,.14,1.5,0,1.4,.2,dark);
 // Mats and small dumbbells identify the recovery area.
 for(let i=0;i<2;i++)box(scene,1.4,.045,3.4,2+i*2,.04,2,mat(i?0x4e4346:0x752d38));
 g=station('music');box(g,3.6,.25,1.7,0,1.6,0,dark);for(const x of [-1.4,1.4])box(g,.12,1.5,.12,x,.75,.3,steel);
 for(const x of [-2.6,2.6]){box(g,1.1,2.5,.95,x,1.3,0,dark);for(const y of [.7,1.7]){const s=round(g,.38,.1,x,y,.52,steel);s.rotation.x=Math.PI/2;const c=round(g,.2,.12,x,y,.58,dark);c.rotation.x=Math.PI/2;}}
 vinyl=round(g,.65,.09,-.65,1.78,0,dark);round(g,.2,.1,-.65,1.8,0,red);box(g,.8,.12,1,.75,1.78,0,steel);for(let i=0;i<4;i++)box(g,.06,.03,.6,.5+i*.16,1.86,0,red);label(g,'04 / ÂM NHẠC',3.5,.6,0,2.7,-.3,'#efb3b9',70);
 // Front bench, weights and floor markings give the room depth.
 box(scene,2.8,.2,.8,-5,1,4,dark);for(const x of [-6,-4])box(scene,.15,.9,.6,x,.5,4,steel);
 for(let i=0;i<3;i++){const b=round(scene,.25,.65,-8+i*.7,.3,5,dark);b.rotation.z=Math.PI/2;}
 box(scene,10,.01,.07,-4,.01,7,red);
 scene.add(new THREE.HemisphereLight(0xe5eafa,0x25202a,2.6));const sun=new THREE.DirectionalLight(0xffffff,3.1);sun.position.set(-8,14,12);scene.add(sun);const rim=new THREE.PointLight(0xff1b38,65,28,2);rim.position.set(0,5,-6);scene.add(rim);
}
function cameraDestination(){let v=views[current]||views.overview;const p=[...v.position],l=[...v.look];if(mobile.matches&&current==='overview'){p[0]=22;p[1]=20;p[2]=31;l[0]=0;l[1]=1;}targetPosition.set(...p);targetLook.set(...l);}
function navigate(instant=false){if(!camera)return;fromPosition.copy(camera.position);fromLook.copy(look);cameraDestination();startTime=performance.now();transitioning=!instant&&enabled&&!reduce.matches&&!failed;if(!transitioning){camera.position.copy(targetPosition);look.copy(targetLook);camera.lookAt(look);}if(!looping)draw(performance.now(),true);}
function sample(){progress=parseInt(document.getElementById('progress-percent')?.textContent,10)||0;playing=!!window.NhipMusic?.getState().playing;const timer=window.NhipTimer?.getState();phase=timer?.status||'idle';if(progressFill){progressFill.scale.x=Math.max(.01,2.7*progress/100);progressFill.position.x=-1.35+progressFill.scale.x/2;}if(timerLamp)timerLamp.material=phase==='running'?glow:steel;}
function draw(now=performance.now(),force=false){if(!renderer||failed||disposed||document.hidden)return;if(!force&&lastFrame&&now-lastFrame<1000/(mobile.matches?30:60)-1)return;lastFrame=now;sample();if(transitioning){const t=Math.min(1,(now-startTime)/1100),e=1-Math.pow(1-t,3);camera.position.lerpVectors(fromPosition,targetPosition,e);look.lerpVectors(fromLook,targetLook,e);transitioning=t<1;}
 camera.lookAt(look.x+pointer.x*.2,look.y+pointer.y*.12,look.z);if(playing&&enabled&&!reduce.matches)vinyl.rotation.y+=.008;
 renderer.render(scene,camera);frames++;
 if(!mobile.matches&&current==='overview'){pins.forEach(pin=>{const point=stations[pin.dataset.station].position.clone();point.y=pin.dataset.station==='workout'?4.9:3.8;point.project(camera);pin.style.left=`${(point.x*.5+.5)*innerWidth}px`;pin.style.top=`${(-point.y*.5+.5)*innerHeight}px`;});}
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile.matches?1:1.5));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=mobile.matches?57:48;camera.updateProjectionMatrix();navigate(true);}
function fallback(){failed=true;looping=false;transitioning=false;renderer?.setAnimationLoop(null);if(renderer)renderer.domElement.hidden=true;document.body.dataset.renderer='fallback';}
function sync(){const motion=enabled&&!reduce.matches;document.body.dataset.motion=motion?'on':'off';toggle.setAttribute('aria-pressed',String(motion));toggle.setAttribute('aria-label',reduce.matches?'Chuyển động đang giảm theo thiết bị':motion?'Tắt chuyển động 3D':'Bật chuyển động 3D');pointer.x=pointer.y=0;if(disposed||failed)return;if(!renderer){if(motion)initialize();return;}renderer.setAnimationLoop(null);looping=false;if(motion&&!document.hidden){looping=true;lastFrame=0;renderer.setAnimationLoop(draw);}else{navigate(true);draw(performance.now(),true);}}
async function initialize(){if(initializing||renderer||disposed)return;initializing=true;try{THREE=await import('./assets/vendor/three/three.module.min.js');const canvas=document.createElement('canvas'),context=canvas.getContext('webgl2',{antialias:!mobile.matches,powerPreference:'low-power'});if(!context){fallback();return;}renderer=new THREE.WebGLRenderer({canvas,context,antialias:!mobile.matches});renderer.setClearColor(0x14161b);renderer.outputColorSpace=THREE.SRGBColorSpace;scene=new THREE.Scene();scene.fog=new THREE.Fog(0x14161b,35,75);camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,120);raycaster=new THREE.Raycaster();targetPosition=new THREE.Vector3();targetLook=new THREE.Vector3();fromPosition=new THREE.Vector3();fromLook=new THREE.Vector3();look=new THREE.Vector3();build();canvas.setAttribute('aria-hidden','true');canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback();});host.append(canvas);document.body.dataset.renderer='webgl';resize();sync();}catch(error){console.warn('Room renderer unavailable',error);fallback();}}
 document.addEventListener('nhipview:change',event=>{current=event.detail.view;pointer.x=pointer.y=0;navigate();});
 toggle.addEventListener('click',()=>{if(reduce.matches)return;enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}sync();});
 document.addEventListener('pointermove',event=>{if(current!=='overview'||event.pointerType!=='mouse'||event.target.closest('a,button,input,dialog')||!enabled||reduce.matches)return;pointer.x=(event.clientX/innerWidth-.5)*.6;pointer.y=(.5-event.clientY/innerHeight)*.4;});
 document.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
 document.addEventListener('click',event=>{if(current!=='overview'||!renderer||failed||event.target.closest('a,button,input,dialog,.lobby-intro,.sidebar,.topbar'))return;const point=new THREE.Vector2(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);raycaster.setFromCamera(point,camera);const hit=raycaster.intersectObjects(hits,true)[0];if(hit){let item=hit.object;while(item&&!item.userData.station)item=item.parent;if(item)window.NhipView.open(item.userData.station,{focus:true});}});
 document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);window.addEventListener('resize',resize);
 window.addEventListener('pagehide',event=>{renderer?.setAnimationLoop(null);looping=false;if(event.persisted)return;disposed=true;resources.forEach(r=>r.dispose());renderer?.dispose();});window.addEventListener('pageshow',sync);
 window.NhipMotion=Object.freeze({getState:()=>{sample();return ({enabled,reduced:reduce.matches,visible:!document.hidden,running:looping,ready:!!renderer&&!failed,renderer:failed?'fallback':renderer?'webgl':'static',revision:THREE?.REVISION||null,mode:current==='overview'?'overview':'panel',station:current==='overview'?null:current,currentView:current,transitioning,camera:camera?{position:camera.position.toArray(),target:look.toArray()}:null,frames,canvasCount:host.querySelectorAll('canvas').length,pixelRatio:renderer?.getPixelRatio()||0,phase,progress,playing});}});
 sync();
