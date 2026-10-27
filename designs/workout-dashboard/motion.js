/* Shared spatial world. The training and audio engines remain the source of truth. */
const host = document.getElementById('spatial-world');
const toggle = document.getElementById('motion-toggle');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 700px)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const KEY = 'nhip-tap-motion-v1';
const captions = { workout: 'Tập trung · Sức mạnh · Kiểm soát', schedule: 'Bảy ngày · Một nhịp tập', progress: 'Tiến độ từ những buổi tập thật', music: 'Âm nhạc · Năng lượng · Chuyển động' };
const anchors = {};
document.querySelectorAll('[data-view]').forEach(view => {
  const anchor = document.createElement('div');
  anchor.className = 'spatial-anchor'; anchor.dataset.caption = captions[view.dataset.view];
  anchor.setAttribute('aria-hidden', 'true');
  anchor.innerHTML = '<div class="spatial-fallback"><i></i></div>';
  view.querySelector('.page-heading').append(anchor);
  anchors[view.dataset.view] = anchor;
});
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== 'off'; } catch { /* The preference is optional. */ }
let THREE, renderer, scene, camera, ambient, dust, grid, modelBounds;
let initializing = null, failed = false, disposed = false, looping = false;
let current = window.NhipView?.getState() || 'workout';
let frames = 0, lastFrame = 0, elapsed = 0, phaseTime = 0, lastSample = 0;
let phase = 'idle', pace = .28, progress = 0, playing = false, selectedDay = -1;
let modelScale = 1, targetX = 0, targetY = 0;
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
const models = {}, resources = new Set(), segments = [], calendarTiles = [], bars = [];
const shared = {};
const artBand = { left: 0, right: 0, top: 0, bottom: 0 };
const visible = () => !document.hidden;
const canMove = () => enabled && !reduce.matches && visible() && !disposed && !failed;
const keep = resource => { resources.add(resource); return resource; };
function material(color, options = {}) { return keep(new THREE.MeshStandardMaterial({ color, metalness: .65, roughness: .34, ...options })); }
function mesh(geometry, surface, parent, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geometry, surface); item.position.set(x, y, z); parent.add(item); return item;
}
function group(name) {
  const item = new THREE.Group(); item.visible = name === current; scene.add(item); models[name] = item; return item;
}
function createModels() {
  shared.red = material(0xed2f48, { emissive: 0x710b20, emissiveIntensity: .5 });
  shared.pink = material(0xf0a8b8); shared.dark = material(0x32262d); shared.steel = material(0x99808d);
  const workout = group('workout');
  const ring = keep(new THREE.TorusGeometry(1.48, .065, 10, 84));
  const thin = keep(new THREE.TorusGeometry(1.65, .025, 6, 80));
  mesh(ring, shared.red, workout).rotation.set(.5, .1, 0);
  mesh(thin, shared.pink, workout).rotation.set(-.6, .9, .2);
  mesh(ring, shared.dark, workout).rotation.set(.9, -.7, .7);
  mesh(keep(new THREE.IcosahedronGeometry(.52, 0)), shared.red, workout);
  const orbitDot = keep(new THREE.SphereGeometry(.09, 10, 8));
  for (let i = 0; i < 5; i++) mesh(orbitDot, shared.pink, workout, Math.cos(i * 1.256) * 1.8, Math.sin(i * 1.256) * 1.8, .15);

  const schedule = group('schedule');
  const plate = keep(new THREE.BoxGeometry(.76, .92, .18));
  const mark = keep(new THREE.BoxGeometry(.48, .045, .025));
  for (let i = 0; i < 7; i++) {
    const tile = mesh(plate, material(0x38232e), schedule, (i % 4 - 1.5) * .91, i < 4 ? .58 : -.6, 0);
    const line = mesh(mark, shared.pink, tile, 0, .22, .11);
    mesh(mark, shared.steel, tile, 0, -.03, .11).scale.x = .65;
    mesh(mark, shared.steel, tile, 0, -.24, .11).scale.x = .4;
    calendarTiles.push({ tile, line });
  }
  const frame = mesh(keep(new THREE.BoxGeometry(3.94, 2.57, .08)), material(0x1b1319), schedule, 0, 0, -.2);
  frame.rotation.z = -.025;

  const gauge = group('progress');
  const block = keep(new THREE.BoxGeometry(.19, .32, .22));
  for (let i = 0; i < 40; i++) {
    const angle = Math.PI / 2 - i / 40 * Math.PI * 2;
    const piece = mesh(block, material(0x453740), gauge, Math.cos(angle) * 1.32, Math.sin(angle) * 1.32, 0);
    piece.rotation.z = angle - Math.PI / 2; segments.push(piece);
  }
  mesh(keep(new THREE.TorusGeometry(1.64, .018, 6, 96)), shared.steel, gauge);
  mesh(keep(new THREE.IcosahedronGeometry(.48, 1)), shared.dark, gauge);

  const music = group('music');
  const vinyl = new THREE.Group(); music.add(vinyl); shared.vinyl = vinyl;
  const disc = mesh(keep(new THREE.CylinderGeometry(1.44, 1.44, .14, 64)), material(0x181418), vinyl);
  disc.rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++) mesh(keep(new THREE.TorusGeometry(.58 + i * .115, .009, 4, 64)), shared.steel, vinyl, 0, 0, .079);
  mesh(keep(new THREE.CircleGeometry(.47, 40)), shared.red, vinyl, 0, 0, .085);
  mesh(keep(new THREE.CircleGeometry(.09, 16)), shared.dark, vinyl, 0, 0, .091);
  const barGeometry = keep(new THREE.BoxGeometry(.12, .48, .18));
  for (let i = 0; i < 12; i++) {
    const item = mesh(barGeometry, i % 3 === 0 ? shared.pink : shared.red, music, (i - 5.5) * .22, -1.8, .16);
    bars.push(item);
  }
}
function createAtmosphere() {
  ambient = new THREE.Group(); scene.add(ambient);
  grid = new THREE.GridHelper(2400, 34, 0x9c2341, 0x3c1a28);
  grid.rotation.x = Math.PI / 2 - .22;
  grid.material.transparent = true; grid.material.opacity = .15;
  keep(grid.geometry); keep(grid.material); ambient.add(grid);
  const count = mobile.matches ? 42 : 92;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = Math.sin(i * 17.71) * 1100;
    positions[i * 3 + 1] = Math.cos(i * 11.31) * 750;
    positions[i * 3 + 2] = Math.sin(i * 5.13) * 90 - 140;
  }
  const geometry = keep(new THREE.BufferGeometry()); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  dust = new THREE.Points(geometry, keep(new THREE.PointsMaterial({ color: 0xd06178, size: mobile.matches ? 1.5 : 2, transparent: true, opacity: .45, depthWrite: false })));
  ambient.add(dust);
  const halo = new THREE.Mesh(keep(new THREE.TorusGeometry(280, 1, 4, 100)), keep(new THREE.MeshBasicMaterial({ color: 0x6e263b, transparent: true, opacity: .18 })));
  halo.position.set(750, -160, -200); halo.rotation.set(.6, .9, 0); ambient.add(halo); shared.halo = halo;
}
function sample() {
  const timer = window.NhipTimer?.getState();
  phase = timer?.status === 'running' ? (/NGHỈ/i.test(timer.phase) ? 'rest' : 'running') : timer?.status || 'idle';
  pace = ({ idle: .28, running: .72, rest: .18, paused: .08, complete: .35 })[phase] || .28;
  progress = Math.max(0, Math.min(100, parseInt(document.getElementById('progress-percent')?.textContent, 10) || 0));
  playing = !!window.NhipMusic?.getState().playing;
  const days = [...document.querySelectorAll('#week-days .day-button')];
  selectedDay = days.findIndex(day => day.classList.contains('selected'));
  if (renderer) {
    shared.red.color.set(phase === 'rest' ? 0xd97891 : 0xed2f48);
    calendarTiles.forEach(({ tile, line }, index) => {
      const active = index === selectedDay;
      tile.material.color.set(active ? 0xdb2b49 : days[index]?.classList.contains('is-rest') ? 0x29252c : 0x633044);
      tile.position.z = active ? .24 : 0;
      line.visible = !days[index]?.classList.contains('is-rest');
    });
    segments.forEach((segment, index) => segment.material.color.set(index < Math.round(progress / 2.5) ? 0xed2f48 : 0x453740));
  }
  anchors.progress.dataset.caption = `${progress}% buổi tập hoàn thành trong tuần`;
  anchors.music.dataset.caption = playing ? 'Đang phát · Vào nhịp cùng âm nhạc' : 'Sẵn sàng bật nhạc cho buổi tập';
}
function place() {
  const box = anchors[current].getBoundingClientRect();
  targetX = box.left + box.width / 2 - innerWidth / 2;
  targetY = innerHeight / 2 - box.top - box.height * .44;
  modelScale = Math.min(box.width / 3.9, box.height / 3.5, mobile.matches ? 75 : 108);
  artBand.left = box.left + 12 - innerWidth / 2;
  artBand.right = box.right - 12 - innerWidth / 2;
  artBand.top = innerHeight / 2 - box.top - 12;
  artBand.bottom = innerHeight / 2 - box.bottom + 34;
  if (ambient) {
    ambient.position.set(pointer.sx * 12, -innerHeight * .48 + Math.min(scrollY, 900) * .08, -180);
    grid.rotation.z = -.2 + pointer.sx * .01;
  }
}
function draw(now = performance.now(), staticFrame = false) {
  if (!renderer || failed || disposed) return;
  if (now - lastSample >= 250 || !lastSample) { sample(); lastSample = now; }
  const minimum = 1000 / (mobile.matches ? 30 : 60);
  if (!staticFrame && lastFrame && now - lastFrame < minimum - 1) return;
  const delta = !staticFrame && looping && lastFrame ? Math.max(0, Math.min((now - lastFrame) / 1000, .06)) : 0;
  lastFrame = now; elapsed += delta; phaseTime += delta * pace;
  pointer.sx += (pointer.x - pointer.sx) * .045; pointer.sy += (pointer.y - pointer.sy) * .045;
  place();
  Object.entries(models).forEach(([name, model]) => {
    const active = name === current;
    const targetOpacity = active ? 1 : 0;
    model.userData.reveal += (targetOpacity - model.userData.reveal) * (staticFrame ? 1 : .11);
    model.visible = model.userData.reveal > .015;
    const reveal = model.userData.reveal;
    model.scale.setScalar(modelScale * (name === 'music' ? .9 : 1) * Math.max(.001, reveal));
    model.position.set(targetX + (1 - reveal) * 80, targetY + Math.sin(elapsed * .5) * 5, 0);
    if (name === 'workout') {
      model.rotation.set(.1 + Math.sin(elapsed * .2) * .15 + pointer.sy * .18, phaseTime * .45 + pointer.sx * .28, -.1);
      model.children[1].rotation.z = phaseTime * .35;
      model.children[3].rotation.y = phaseTime;
    } else if (name === 'schedule') model.rotation.set(.22 + pointer.sy * .12, -.3 + pointer.sx * .25 + Math.sin(elapsed * .2) * .06, -.07);
    else if (name === 'progress') model.rotation.set(.2 + pointer.sy * .15, -.25 + pointer.sx * .25 + Math.sin(elapsed * .18) * .12, 0);
    else {
      model.position.y += 20;
      model.rotation.set(.17 + pointer.sy * .15, -.23 + pointer.sx * .25, -.1);
      if (playing) shared.vinyl.rotation.z += delta * .8;
      bars.forEach((bar, index) => {
        const height = playing ? .4 + (Math.sin(elapsed * 4 + index * .8) + 1) * .38 : .3;
        bar.scale.y = height; bar.position.y = -1.58 + height * .08;
      });
    }
    // Keep the complete rotated silhouette inside the mobile art band.
    // This reserves room for the description above and the caption below.
    if (mobile.matches && model.visible) {
      model.updateMatrixWorld(true);
      modelBounds.setFromObject(model);
      const width = modelBounds.max.x - modelBounds.min.x;
      const height = modelBounds.max.y - modelBounds.min.y;
      const fit = Math.min(1, (artBand.right - artBand.left) / Math.max(width, .001), (artBand.top - artBand.bottom) / Math.max(height, .001));
      model.scale.multiplyScalar(fit);
      model.updateMatrixWorld(true);
      modelBounds.setFromObject(model);
      model.position.x += (artBand.left + artBand.right - modelBounds.min.x - modelBounds.max.x) / 2;
      model.position.y += (artBand.top + artBand.bottom - modelBounds.min.y - modelBounds.max.y) / 2;
    }
  });
  dust.rotation.z = elapsed * .009;
  shared.halo.rotation.z = elapsed * .03;
  renderer.render(scene, camera); frames++;
}
function resize() {
  if (!renderer || disposed) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.left = -innerWidth / 2; camera.right = innerWidth / 2; camera.top = innerHeight / 2; camera.bottom = -innerHeight / 2;
  camera.updateProjectionMatrix();
  if (!looping) draw(performance.now(), true);
}
function resetTilt() {
  document.querySelectorAll('[data-tilted=true]').forEach(card => { card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); delete card.dataset.tilted; });
}
function sync() {
  const motion = enabled && !reduce.matches;
  toggle.setAttribute('aria-pressed', String(motion));
  toggle.setAttribute('aria-label', reduce.matches ? 'Hiệu ứng 3D đang tắt theo cài đặt giảm chuyển động' : motion ? 'Tắt hiệu ứng 3D' : 'Bật hiệu ứng 3D');
  document.body.dataset.motion = motion ? 'on' : 'off';
  if (!motion) resetTilt();
  if (disposed || failed) return;
  if (canMove()) {
    if (!renderer) { initialize(); return; }
    if (!looping) { looping = true; lastFrame = 0; resize(); renderer.setAnimationLoop(draw); }
  } else if (looping) { renderer.setAnimationLoop(null); looping = false; lastFrame = 0; }
}
function fallback() {
  failed = true; document.body.dataset.renderer = 'fallback';
  if (renderer) { renderer.setAnimationLoop(null); renderer.domElement.hidden = true; }
  looping = false;
}
async function initialize() {
  if (initializing || renderer || !canMove()) return initializing;
  initializing = (async () => {
    try {
      THREE = await import('./assets/vendor/three/three.module.min.js');
      if (!canMove()) { initializing = null; return; }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { alpha: true, antialias: !mobile.matches, powerPreference: 'low-power' });
      if (!context) { fallback(); return; }
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: !mobile.matches });
      renderer.setClearColor(0x09090b, 0);
      scene = new THREE.Scene(); modelBounds = new THREE.Box3(); camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 3000); camera.position.z = 1000;
      scene.add(new THREE.HemisphereLight(0xffe7ee, 0x300719, 2.8));
      const light = new THREE.DirectionalLight(0xff6b85, 4); light.position.set(400, 500, 600); scene.add(light);
      const rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(-400, 200, 300); scene.add(rim);
      createModels(); createAtmosphere();
      Object.entries(models).forEach(([name, model]) => { model.userData.reveal = name === current ? 1 : 0; });
      canvas.setAttribute('aria-hidden', 'true'); canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
      host.append(canvas); document.body.dataset.renderer = 'webgl'; sample(); resize(); sync();
    } catch { fallback(); }
  })();
  return initializing;
}
toggle.addEventListener('click', () => { if (reduce.matches) return; enabled = !enabled; try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* Optional storage. */ } sync(); });
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !canMove() || !fine.matches) return;
  pointer.x = event.clientX / innerWidth * 2 - 1; pointer.y = event.clientY / innerHeight * 2 - 1;
  const card = event.target.closest('.spatial-depth');
  resetTilt();
  if (!card || event.target.closest('button,a,input,select,iframe,dialog') || card.closest('[hidden]')) return;
  const box = card.getBoundingClientRect();
  card.style.setProperty('--tilt-x', `${-(event.clientY - box.top - box.height / 2) / box.height * 2}deg`);
  card.style.setProperty('--tilt-y', `${(event.clientX - box.left - box.width / 2) / box.width * 2}deg`);
  card.dataset.tilted = 'true';
});
document.addEventListener('pointerout', event => { if (!event.relatedTarget) { pointer.x = pointer.y = 0; resetTilt(); } });
window.addEventListener('blur', () => { pointer.x = pointer.y = 0; resetTilt(); });
document.addEventListener('focusin', resetTilt);
document.addEventListener('nhipview:change', event => { current = event.detail.view; pointer.x = pointer.y = 0; resetTilt(); sample(); sync(); if (renderer && !looping) draw(performance.now(), true); });
document.addEventListener('visibilitychange', sync); reduce.addEventListener('change', sync);
window.addEventListener('resize', resize); mobile.addEventListener('change', resize);
window.addEventListener('scroll', () => { if (!looping && renderer) draw(performance.now(), true); }, { passive: true });
document.querySelectorAll('.progress-card,.nutrition-card,.source-strip,.overview-strip,.session-context,.schedule-bottom,.gentle-note').forEach(card => card.classList.add('spatial-depth'));
const statePoll = setInterval(() => { if (visible() && !looping) sample(); }, 250);
window.addEventListener('pagehide', event => {
  if (renderer) renderer.setAnimationLoop(null); looping = false;
  if (event.persisted) return;
  disposed = true; clearInterval(statePoll); resources.forEach(resource => resource.dispose()); renderer?.dispose();
});
window.addEventListener('pageshow', sync);
window.NhipMotion = Object.freeze({ getState: () => ({ enabled, reduced: reduce.matches, visible: visible(), running: looping, ready: !!renderer, renderer: failed ? 'fallback' : renderer ? 'webgl' : 'static', revision: THREE?.REVISION || null, currentView: current, frames, phase, progress, playing, selectedDay, canvasCount: host.querySelectorAll('canvas').length, pixelRatio: renderer?.getPixelRatio() || 0, modelScale, rotation: models[current] ? { x: models[current].rotation.x, y: models[current].rotation.y, z: models[current].rotation.z } : null, pointer: { x: pointer.sx, y: pointer.sy } }) });
sample(); sync();
