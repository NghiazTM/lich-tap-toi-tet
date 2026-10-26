/* Decorative Three.js scene. It reads timer state but never changes workout data. */
const stage = document.getElementById('motion-stage');
const art = document.getElementById('motion-art');
const toggle = document.getElementById('motion-toggle');
const phaseLabel = document.getElementById('motion-phase');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 700px)');
const KEY = 'nhip-tap-motion-v1';
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== 'off'; } catch { /* A private browser can still use the toggle. */ }
let disposed = false, failed = false, loading = null, inViewport = false, looping = false;
let renderer, scene, camera, sculpture, particles, THREE;
let frames = 0, time = 0, lastFrame = 0, lastSample = 0;
let phase = 'idle', pace = .28, particleCount = 0;
const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
const objects = [];

function visible() {
  return !document.hidden && !stage.closest('[data-view]').hidden && inViewport;
}
function canAnimate() { return enabled && !reduce.matches && visible() && !failed && !disposed; }
function sampleTimer() {
  const timer = window.NhipTimer?.getState();
  phase = timer?.status === 'running' ? (/NGHỈ/i.test(timer.phase) ? 'rest' : 'running') : timer?.status === 'paused' ? 'paused' : timer?.status === 'complete' ? 'complete' : 'idle';
  const labels = { idle: 'Sẵn sàng vào nhịp', running: timer?.mode === 'stopwatch' ? 'Đang bấm giờ' : 'Tập trung từng nhịp', rest: 'Thả lỏng và hồi phục', paused: 'Tạm dừng, lấy lại nhịp', complete: 'Đã hoàn thành nhịp tập' };
  phaseLabel.textContent = labels[phase];
  stage.dataset.phase = phase;
  pace = ({ idle: .28, running: .82, rest: .17, paused: .09, complete: .42 })[phase];
  if (sculpture) sculpture.children[0].material.color.set(phase === 'rest' ? 0xffbdc8 : 0xed2f48);
}
function draw(now = performance.now()) {
  if (!renderer || disposed || failed) return;
  if (now - lastSample >= 250 || !lastSample) { sampleTimer(); lastSample = now; }
  const minimum = narrow.matches ? 1000 / 30 : 1000 / 60;
  if (now && lastFrame && now - lastFrame < minimum - 1) return;
  const delta = looping && lastFrame ? Math.max(0, Math.min((now - lastFrame) / 1000, .06)) : 0;
  lastFrame = now;
  time += delta * pace;
  pointer.smoothX += (pointer.x - pointer.smoothX) * .055;
  pointer.smoothY += (pointer.y - pointer.smoothY) * .055;
  sculpture.rotation.set(.18 + Math.sin(time * .6) * .16 + pointer.smoothY * .23, time * .5 + pointer.smoothX * .36, -.2 + Math.sin(time * .3) * .12);
  sculpture.children[1].rotation.z = time * .44;
  sculpture.children[2].rotation.x = .9 + time * .2;
  sculpture.children[3].rotation.y = time * .55;
  sculpture.children[3].rotation.z = time * .3;
  particles.rotation.y = -time * .12;
  particles.rotation.z = Math.sin(time * .3) * .08;
  renderer.render(scene, camera);
  frames++;
}
function resize() {
  if (!renderer || disposed) return;
  const box = art.getBoundingClientRect();
  if (!box.width || !box.height) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow.matches ? 1 : 1.5));
  renderer.setSize(box.width, box.height, false);
  camera.aspect = box.width / box.height;
  camera.updateProjectionMatrix();
  if (!looping) draw();
}
function sync() {
  toggle.setAttribute('aria-pressed', String(enabled && !reduce.matches));
  toggle.setAttribute('aria-label', reduce.matches ? 'Chuyển động đang tắt theo cài đặt giảm chuyển động' : enabled ? 'Tắt chuyển động' : 'Bật chuyển động');
  if (disposed || failed) return;
  if (canAnimate()) {
    if (!renderer) { initialize(); return; }
    if (!looping) { looping = true; lastFrame = 0; resize(); renderer.setAnimationLoop(draw); }
  } else if (looping) { renderer.setAnimationLoop(null); looping = false; lastFrame = 0; }
}
function fallback() {
  failed = true;
  stage.dataset.renderer = 'fallback';
  if (renderer) { renderer.setAnimationLoop(null); looping = false; renderer.domElement.hidden = true; }
}
async function initialize() {
  if (loading || renderer || failed || disposed || !canAnimate()) return loading;
  loading = (async () => {
    try {
      THREE = await import('./assets/vendor/three/three.module.min.js');
      if (disposed || !canAnimate()) { loading = null; return; }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { alpha: true, antialias: !narrow.matches, powerPreference: 'low-power' });
      if (!context) { fallback(); return; }
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: !narrow.matches });
      renderer.setClearColor(0x120f12, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, 2, .1, 40);
      camera.position.set(0, 0, 5.1);
      sculpture = new THREE.Group();
      const ring = new THREE.TorusGeometry(1.12, .028, 8, 72);
      const thickRing = new THREE.TorusGeometry(.98, .065, 8, 64);
      const red = new THREE.MeshStandardMaterial({ color: 0xed2f48, metalness: .65, roughness: .32, emissive: 0x680b1b, emissiveIntensity: .4 });
      const soft = new THREE.MeshStandardMaterial({ color: 0xf3a7b5, metalness: .8, roughness: .28 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x7a2639, metalness: .75, roughness: .4 });
      const ringOne = new THREE.Mesh(thickRing, red);
      ringOne.rotation.x = .84;
      const ringTwo = new THREE.Mesh(ring, soft);
      ringTwo.rotation.set(-.7, .9, .3);
      const ringThree = new THREE.Mesh(ring, dark);
      ringThree.rotation.set(.9, -.9, .8);
      const coreGeometry = new THREE.IcosahedronGeometry(.36, 0);
      const core = new THREE.Mesh(coreGeometry, red);
      sculpture.add(ringOne, ringTwo, ringThree, core);
      scene.add(sculpture);
      const ambient = new THREE.HemisphereLight(0xffe3e8, 0x290712, 2.8);
      const key = new THREE.DirectionalLight(0xff7087, 4);
      key.position.set(2, 3, 4);
      const rim = new THREE.DirectionalLight(0xffffff, 3);
      rim.position.set(-3, 1, -2);
      scene.add(ambient, key, rim);
      particleCount = narrow.matches ? 22 : 40;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index++) {
        const angle = index * 2.399963;
        const radius = 1.35 + (index % 7) * .13;
        positions[index * 3] = Math.cos(angle) * radius;
        positions[index * 3 + 1] = Math.sin(angle) * radius * .65;
        positions[index * 3 + 2] = Math.sin(index * 1.7) * .7;
      }
      const dust = new THREE.BufferGeometry();
      dust.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const dustMaterial = new THREE.PointsMaterial({ color: 0xff8b9d, size: .026, transparent: true, opacity: .65, depthWrite: false });
      particles = new THREE.Points(dust, dustMaterial);
      scene.add(particles);
      objects.push(ring, thickRing, coreGeometry, red, soft, dark, dust, dustMaterial);
      canvas.setAttribute('aria-hidden', 'true');
      canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(); });
      art.append(canvas);
      stage.dataset.renderer = 'webgl';
      sampleTimer();
      resize();
      sync();
    } catch { fallback(); }
  })();
  return loading;
}
toggle.addEventListener('click', () => {
  if (reduce.matches) return;
  enabled = !enabled;
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* Session-only preferences remain usable. */ }
  sampleTimer(); sync();
});
stage.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !enabled || reduce.matches) return;
  const box = stage.getBoundingClientRect();
  pointer.x = (event.clientX - box.left) / box.width * 2 - 1;
  pointer.y = (event.clientY - box.top) / box.height * 2 - 1;
});
stage.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; });
document.addEventListener('visibilitychange', sync);
document.addEventListener('nhipview:change', () => { sampleTimer(); sync(); });
reduce.addEventListener('change', sync);
narrow.addEventListener('change', resize);
const observer = new IntersectionObserver(entries => { inViewport = entries[0].isIntersecting; sampleTimer(); sync(); }, { threshold: .05 });
observer.observe(stage);
const sizes = new ResizeObserver(resize);
sizes.observe(art);
// Keep the real timer caption current even when motion is switched off.
const statePoll = setInterval(() => { if (!looping && visible()) sampleTimer(); }, 250);
window.addEventListener('pagehide', event => {
  if (event.persisted) { if (renderer) renderer.setAnimationLoop(null); looping = false; return; }
  disposed = true;
  clearInterval(statePoll);
  observer.disconnect(); sizes.disconnect();
  if (renderer) { renderer.setAnimationLoop(null); objects.forEach(object => object.dispose()); renderer.dispose(); }
});
window.addEventListener('pageshow', sync);
window.NhipMotion = Object.freeze({ getState: () => ({ enabled, reduced: reduce.matches, visible: visible(), running: looping, ready: !!renderer, renderer: failed ? 'fallback' : renderer ? 'webgl' : 'static', revision: THREE?.REVISION || null, frames, phase, particleCount, pixelRatio: renderer?.getPixelRatio() || 0, rotation: sculpture ? { x: sculpture.rotation.x, y: sculpture.rotation.y, z: sculpture.rotation.z } : null, pointer: { x: pointer.smoothX, y: pointer.smoothY } }) });
sampleTimer(); sync();
