(() => {
  'use strict';
  const KEY = 'nhip-tap-tools-v1';
  const MODES = ['stopwatch', 'countdown', 'interval'];
  const TITLES = { stopwatch: 'Bấm giờ', countdown: 'Hẹn giờ', interval: 'Tập và nghỉ' };
  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const finite = (value, max = 31536000000) => Number.isFinite(value) && value >= 0 && value <= max;
  const blank = () => ({ status: 'idle', elapsed: 0, startedAt: null, run: null, laps: [], lapCount: 0, acknowledged: true });
  const defaults = () => ({ version: 1, mode: 'stopwatch', sound: true, wake: false, settings: { countdownKind: 'duration', duration: 60, alarmInput: '', work: 25, rest: 60, rounds: 4, exerciseName: '', sideNote: '' }, sessions: { stopwatch: blank(), countdown: blank(), interval: blank() } });
  let initialNotice = '';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const saved = JSON.parse(raw);
      const clean = defaults();
      if (saved?.version !== 1 || !MODES.includes(saved.mode) || !saved.settings || !saved.sessions) throw new Error('invalid');
      clean.mode = saved.mode; clean.sound = saved.sound !== false; clean.wake = saved.wake === true;
      const s = saved.settings;
      if (!['duration', 'absolute'].includes(s.countdownKind) || !integer(s.duration, 1, 21600) || !integer(s.work, 1, 3600) || !integer(s.rest, 0, 3600) || !integer(s.rounds, 1, 50)) throw new Error('invalid');
      clean.settings = { countdownKind: s.countdownKind, duration: s.duration, alarmInput: typeof s.alarmInput === 'string' ? s.alarmInput.slice(0, 30) : '', work: s.work, rest: s.rest, rounds: s.rounds, exerciseName: typeof s.exerciseName === 'string' ? s.exerciseName.slice(0, 90) : '', sideNote: typeof s.sideNote === 'string' ? s.sideNote.slice(0, 160) : '' };
      for (const mode of MODES) {
        const item = saved.sessions[mode];
        if (!item || !['idle', 'running', 'paused', 'complete'].includes(item.status) || !finite(item.elapsed) || (item.status === 'running' && !finite(item.startedAt, 8640000000000000))) throw new Error('invalid');
        const target = { ...blank(), status: item.status, elapsed: item.elapsed, startedAt: item.status === 'running' ? item.startedAt : null, acknowledged: item.acknowledged !== false };
        if (mode === 'stopwatch') {
          if (Array.isArray(item.laps)) target.laps = item.laps.filter((lap) => lap && integer(lap.number, 1, 1000000) && finite(lap.total) && finite(lap.split) && lap.split <= lap.total).slice(-20);
          target.lapCount = integer(item.lapCount, 0, 1000000) ? item.lapCount : target.laps.length;
        } else if (item.status !== 'idle') {
          const run = item.run;
          if (!run || !finite(run.duration) || run.duration <= 0) throw new Error('invalid');
          if (mode === 'countdown') {
            if (!['duration', 'absolute'].includes(run.kind) || (run.kind === 'absolute' && !finite(run.deadline, 8640000000000000))) throw new Error('invalid');
            target.run = { kind: run.kind, duration: run.duration, deadline: run.kind === 'absolute' ? run.deadline : null };
          } else {
            if (!integer(run.work, 1, 3600) || !integer(run.rest, 0, 3600) || !integer(run.rounds, 1, 50) || run.duration !== (run.work * run.rounds + run.rest * (run.rounds - 1)) * 1000 || run.duration > 86400000) throw new Error('invalid');
            target.run = { work: run.work, rest: run.rest, rounds: run.rounds, duration: run.duration, exerciseName: typeof run.exerciseName === 'string' ? run.exerciseName.slice(0, 90) : '', sideNote: typeof run.sideNote === 'string' ? run.sideNote.slice(0, 160) : '' };
          }
        }
        clean.sessions[mode] = target;
      }
      // Only the selected mode may run. Other saved modes retain their paused values.
      MODES.filter((mode) => mode !== clean.mode).forEach((mode) => {
        const item = clean.sessions[mode];
        if (item.status === 'running') { item.elapsed += Math.max(0, Date.now() - item.startedAt); item.startedAt = null; item.status = item.run?.kind === 'absolute' ? 'idle' : 'paused'; }
      });
      return clean;
    } catch {
      initialNotice = 'Không đọc được trạng thái đồng hồ đã lưu. Bạn có thể bắt đầu một lượt mới.';
      return defaults();
    }
  }
  let state = load();
  let exercises = [];
  let audioContext = null;
  let alertInterval = null;
  let wakeLock = null;
  let wakePending = false;
  let wakeMessage = '';
  let lastTick = Date.now();
  let lastPhase = '';
  let saveWarning = false;
  let musicState = { playing: false, title: '', hasTracks: false };
  let dockMode = state.mode;
  const current = () => state.sessions[state.mode];
  const isLocked = (item = current()) => item.status === 'running' || item.status === 'paused';
  const elapsed = (item, now = Date.now()) => item.elapsed + (item.status === 'running' ? Math.max(0, now - item.startedAt) : 0);
  const running = () => MODES.some((mode) => state.sessions[mode].status === 'running');
  const note = (message) => { $('#tools-notice').textContent = message; };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { if (!saveWarning) { saveWarning = true; note('Trình duyệt chưa cho phép lưu trạng thái đồng hồ. Đồng hồ vẫn chạy trong thẻ này.'); } }
  }
  function clock(ms, tenths = false) {
    const total = Math.max(0, tenths ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
    const hours = Math.floor(total / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60;
    const main = `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return { main, tenth: tenths ? `.${Math.floor(ms % 1000 / 100)}` : '' };
  }
  const shortTime = (seconds) => seconds >= 60 ? `${Math.floor(seconds / 60)} phút${seconds % 60 ? ` ${seconds % 60} giây` : ''}` : `${seconds} giây`;
  const bangkokInput = (timestamp) => new Date(timestamp + 7 * 3600000).toISOString().slice(0, 16);
  const bangkokLabel = (timestamp) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
  function info(mode = state.mode, now = Date.now()) {
    const item = state.sessions[mode];
    const settings = state.settings;
    let total = elapsed(item, now);
    if (mode === 'stopwatch') return { display: total, phase: item.status === 'running' ? 'ĐANG BẤM GIỜ' : item.status === 'paused' ? 'TẠM DỪNG' : 'SẴN SÀNG', key: 'stopwatch', progress: 0, complete: false, sub: 'Ghi từng vòng để theo dõi tiến độ tập luyện.', total };
    if (mode === 'countdown') {
      const duration = item.run?.duration || settings.duration * 1000;
      const remaining = item.run?.kind === 'absolute' && item.status === 'running' ? item.run.deadline - now : duration - total;
      const idleDeadline = settings.countdownKind === 'absolute' ? Date.parse(`${settings.alarmInput || $('#alarm-datetime')?.value}:00+07:00`) : NaN;
      const idleRemaining = settings.countdownKind === 'absolute' ? (Number.isFinite(idleDeadline) ? Math.max(0, idleDeadline - now) : 0) : settings.duration * 1000;
      return { display: Math.max(0, item.status === 'idle' ? idleRemaining : remaining), phase: item.status === 'complete' ? 'ĐÃ ĐẾN GIỜ' : item.run?.kind === 'absolute' && item.status !== 'idle' ? 'HẸN GIỜ CỤ THỂ' : 'ĐẾM NGƯỢC', key: 'countdown', progress: item.status === 'idle' ? 0 : Math.min(1, Math.max(0, 1 - remaining / duration)), complete: item.status === 'running' && remaining <= 0, sub: item.run?.kind === 'absolute' && item.status !== 'idle' ? `Hẹn lúc ${bangkokLabel(item.run.deadline)} · UTC+7` : settings.countdownKind === 'absolute' && Number.isFinite(idleDeadline) ? `Dự kiến ${bangkokLabel(idleDeadline)} · UTC+7` : 'Tập trung trong khoảng thời gian bạn đã chọn.', total };
    }
    const cfg = item.run || { work: settings.work, rest: settings.rest, rounds: settings.rounds, duration: (settings.work * settings.rounds + settings.rest * (settings.rounds - 1)) * 1000, exerciseName: settings.exerciseName, sideNote: settings.sideNote };
    const cycle = (cfg.work + cfg.rest) * 1000;
    const round = Math.min(cfg.rounds, Math.floor(total / cycle) + 1);
    const offset = total % cycle;
    const work = offset < cfg.work * 1000;
    const remaining = (work ? cfg.work * 1000 : cycle) - offset;
    const complete = total >= cfg.duration;
    return { display: complete ? 0 : remaining, phase: item.status === 'complete' || complete ? 'HOÀN THÀNH' : work ? 'TẬP' : 'NGHỈ', key: `${round}-${work ? 'work' : 'rest'}`, round, rounds: cfg.rounds, progress: Math.min(1, total / cfg.duration), complete: item.status === 'running' && complete, sub: cfg.exerciseName || 'Một hiệp tập, một nhịp nghỉ.', next: complete || item.status === 'complete' ? 'Đã hoàn thành lượt tập · không nghỉ sau hiệp cuối' : round === cfg.rounds && work ? 'Hiệp tập cuối · không nghỉ sau hiệp cuối' : work ? `Tiếp theo: nghỉ ${cfg.rest} giây` : `Tiếp theo: tập hiệp ${round + 1}`, endOfPhase: total + remaining, total, sideNote: cfg.sideNote };
  }

  $('#timer-root').innerHTML = `<div class="timer-card-heading"><div><span class="eyebrow small-eyebrow">ĐỒNG HỒ TẬP LUYỆN</span><h2 id="timer-heading">Tập trung vào từng giây.</h2></div><span class="timer-live-dot" aria-hidden="true"></span></div><div class="timer-tabs" role="tablist" aria-label="Chế độ đồng hồ">${MODES.map((mode) => `<button type="button" role="tab" id="tab-${mode}" aria-controls="timer-panel" data-tool-action="mode" data-mode="${mode}">${TITLES[mode]}</button>`).join('')}</div><div id="timer-panel" role="tabpanel" aria-labelledby="tab-stopwatch"><div id="stopwatch-settings" class="timer-settings"><p class="timer-config-copy">Bấm Bắt đầu, sau đó ghi vòng khi hoàn thành mỗi hiệp.</p></div><div id="countdown-settings" class="timer-settings" hidden><div class="countdown-kind" role="group" aria-label="Kiểu hẹn giờ"><button type="button" data-tool-action="countdown-kind" data-kind="duration">Đếm ngược</button><button type="button" data-tool-action="countdown-kind" data-kind="absolute">Hẹn giờ cụ thể</button></div><div id="duration-fields"><div class="timer-fields timer-fields-two"><div><label for="countdown-minutes">Phút</label><input id="countdown-minutes" type="number" min="0" max="360" step="1" inputmode="numeric" value="1"></div><div><label for="countdown-seconds">Giây</label><input id="countdown-seconds" type="number" min="0" max="59" step="1" inputmode="numeric" value="0"></div></div><div class="timer-presets" aria-label="Hẹn giờ nhanh">${[30,60,90,300].map((seconds) => `<button type="button" data-tool-action="countdown-preset" data-seconds="${seconds}">${shortTime(seconds)}</button>`).join('')}</div></div><div id="absolute-fields" hidden><label for="alarm-datetime">Ngày và giờ · Việt Nam/Bangkok (UTC+7)</label><input id="alarm-datetime" type="datetime-local" required><p class="timer-config-copy">Âm báo chỉ phát khi trang đang mở. Hủy hẹn trước khi thay đổi giờ.</p></div></div><div id="interval-settings" class="timer-settings" hidden><div class="exercise-timer-source"><label for="interval-exercise">Lấy thông số từ bài tập</label><div><select id="interval-exercise"><option value="">Chọn bài của ngày đang xem</option></select><button type="button" data-tool-action="load-exercise">Áp dụng</button></div></div><div class="timer-fields timer-fields-three"><div><label for="interval-work">Tập (giây)</label><input id="interval-work" type="number" min="1" max="3600" step="1" inputmode="numeric" value="25"></div><div><label for="interval-rest">Nghỉ (giây)</label><input id="interval-rest" type="number" min="0" max="3600" step="1" inputmode="numeric" value="60"></div><div><label for="interval-rounds">Số hiệp</label><input id="interval-rounds" type="number" min="1" max="50" step="1" inputmode="numeric" value="4"></div></div><div class="timer-presets"><button type="button" data-tool-action="interval-preset" data-preset="hold">25 giây / 60 giây × 4</button><button type="button" data-tool-action="interval-preset" data-preset="tabata">20 giây / 10 giây × 8</button><span>Có thể điều chỉnh</span></div><p id="interval-total" class="timer-config-copy"></p><p id="interval-side-note" class="timer-side-note" hidden></p></div><div class="timer-clock-area"><div class="timer-phase-row"><span id="timer-phase" role="status">SẴN SÀNG</span><span id="timer-round"></span></div><div class="timer-clock" role="timer" aria-live="off"><span id="timer-clock-main">00:00</span><span id="timer-clock-tenths">.0</span></div><p id="timer-subtitle"></p><div class="timer-linear-track" aria-hidden="true"><span id="timer-linear-progress"></span></div><p id="timer-next-phase"></p></div><div id="timer-alert" class="timer-alert" role="alert" hidden><div>${icon('check')}<strong id="timer-alert-text">Đã hết thời gian.</strong></div><button type="button" data-tool-action="dismiss-alert">Tắt âm báo</button></div><div class="timer-controls"><button type="button" class="button timer-secondary" data-tool-action="reset" aria-label="Đặt lại chế độ đồng hồ này">${icon('restore')}Đặt lại</button><button type="button" class="button primary timer-start" data-tool-action="toggle">${icon('play')}<span>Bắt đầu</span></button><button type="button" class="button timer-secondary" data-tool-action="lap">${icon('plus')}Ghi vòng</button><button type="button" class="button timer-secondary" data-tool-action="skip" hidden>${icon('arrow')}Bỏ qua</button></div><p id="timer-lock-hint" class="timer-lock-hint" hidden>Tạm dừng trước khi đổi chế độ. Đặt lại để chỉnh thông số.</p><div id="lap-section" class="lap-section" hidden><div class="lap-heading"><h3>Các vòng đã ghi</h3><span>Vòng / Từng vòng / Tổng</span></div><ol id="timer-laps"></ol><p class="timer-config-copy">Hiển thị tối đa 20 vòng gần nhất.</p></div></div><div class="timer-preferences"><label class="tool-switch"><input type="checkbox" id="timer-sound" checked><span></span>Âm báo</label><button type="button" class="text-button" data-tool-action="test-sound">Thử âm báo</button><label class="tool-switch wake-switch"><input type="checkbox" id="timer-wake"><span></span>Giữ màn hình sáng</label></div><p id="wake-status" class="timer-device-note"></p><p class="timer-device-note">Giữ trang mở; âm báo khi khóa màn hình phụ thuộc trình duyệt. Đồng hồ vẫn tính thời gian khi chuyển sang thẻ trình duyệt khác.</p><p id="tools-notice" class="tools-notice" role="status" aria-live="polite"></p>`;

  const dock = document.createElement('div');
  dock.id = 'training-dock'; dock.className = 'training-dock'; dock.hidden = true;
  dock.innerHTML = `<a class="dock-clock" href="#timer-card" aria-label="Mở đồng hồ tập luyện">${icon('clock')}<span><strong id="dock-clock-time">00:00</strong><small id="dock-clock-label">Đồng hồ</small></span></a><button type="button" class="dock-button" data-tool-action="dock-timer" aria-label="Tạm dừng đồng hồ">${icon('pause')}</button><span class="dock-divider"></span><div class="dock-music-info"><span class="dock-music-indicator" aria-hidden="true"><i></i><i></i><i></i></span><a href="#music" id="dock-track-title">Nhạc tập luyện</a></div><button type="button" class="dock-button" data-tool-action="music-toggle" aria-label="Phát nhạc">${icon('play')}</button><button type="button" class="dock-button dock-music-next" data-tool-action="music-next" aria-label="Bài nhạc tiếp theo">${icon('arrow')}</button>`;
  document.body.append(dock);

  function populateFields() {
    const s = state.settings;
    $('#countdown-minutes').value = Math.floor(s.duration / 60);
    $('#countdown-seconds').value = s.duration % 60;
    $('#alarm-datetime').value = s.alarmInput || bangkokInput(Date.now() + 5 * 60000);
    $('#interval-work').value = s.work; $('#interval-rest').value = s.rest; $('#interval-rounds').value = s.rounds;
    $('#timer-sound').checked = state.sound; $('#timer-wake').checked = state.wake;
  }
  function renderExercises() {
    const select = $('#interval-exercise'), selected = select.value;
    select.innerHTML = '<option value="">Chọn bài của ngày đang xem</option>' + exercises.map((item) => `<option value="${esc(item.id)}">${esc(item.name)} · ${item.sets} × ${item.hold} giây</option>`).join('');
    if (exercises.some((item) => item.id === selected)) select.value = selected;
    $('[data-tool-action="load-exercise"]').disabled = !exercises.length || isLocked(state.sessions.interval);
  }
  function renderControls() {
    const item = current(), locked = isLocked(), absolute = state.mode === 'countdown' && item.run?.kind === 'absolute' && item.status === 'running';
    MODES.forEach((mode) => { const tab = $(`#tab-${mode}`); tab.classList.toggle('selected', mode === state.mode); tab.setAttribute('aria-selected', String(mode === state.mode)); tab.tabIndex = mode === state.mode ? 0 : -1; tab.disabled = item.status === 'running' && mode !== state.mode; $(`#${mode}-settings`).hidden = mode !== state.mode; });
    $('#timer-panel').setAttribute('aria-labelledby', `tab-${state.mode}`);
    $('#duration-fields').hidden = state.settings.countdownKind !== 'duration'; $('#absolute-fields').hidden = state.settings.countdownKind !== 'absolute';
    document.querySelectorAll('[data-tool-action="countdown-kind"]').forEach((button) => { button.classList.toggle('selected', button.dataset.kind === state.settings.countdownKind); button.disabled = locked; button.setAttribute('aria-pressed', String(button.dataset.kind === state.settings.countdownKind)); });
    document.querySelectorAll('.timer-settings input, [data-tool-action="countdown-preset"], [data-tool-action="interval-preset"]').forEach((input) => input.disabled = locked);
    $('#interval-exercise').disabled = isLocked(state.sessions.interval);
    $('[data-tool-action="load-exercise"]').disabled = !exercises.length || isLocked(state.sessions.interval);
    const toggle = $('[data-tool-action="toggle"]');
    toggle.innerHTML = `${icon(item.status === 'running' && !absolute ? 'pause' : 'play')}<span>${absolute ? 'Hủy hẹn' : item.status === 'running' ? 'Tạm dừng' : item.status === 'paused' ? 'Tiếp tục' : item.status === 'complete' ? 'Chạy lại' : 'Bắt đầu'}</span>`;
    toggle.classList.toggle('cancel-alarm', absolute);
    $('[data-tool-action="reset"]').disabled = item.status === 'idle' && !item.elapsed && !item.laps.length;
    $('[data-tool-action="lap"]').hidden = state.mode !== 'stopwatch'; $('[data-tool-action="lap"]').disabled = item.status !== 'running';
    $('[data-tool-action="skip"]').hidden = state.mode !== 'interval'; $('[data-tool-action="skip"]').disabled = !locked;
    $('#timer-lock-hint').hidden = !locked;
    $('#timer-lock-hint').textContent = absolute ? 'Hủy hẹn để thay đổi mốc giờ hoặc chuyển chế độ.' : 'Tạm dừng trước khi đổi chế độ. Đặt lại để chỉnh thông số.';
    const seconds = state.settings.work * state.settings.rounds + state.settings.rest * (state.settings.rounds - 1);
    $('#interval-total').textContent = `Tổng ${clock(seconds * 1000).main} · ${state.settings.rounds} hiệp · không nghỉ sau hiệp cuối.`;
    $('#interval-side-note').textContent = state.settings.sideNote; $('#interval-side-note').hidden = !state.settings.sideNote;
    $('#timer-alert').hidden = item.status !== 'complete' || item.acknowledged;
    $('#timer-alert-text').textContent = state.mode === 'interval' ? 'Đã hoàn thành các hiệp tập và nghỉ.' : 'Đã đến giờ bạn hẹn.';
    $('.timer-live-dot').classList.toggle('running', item.status === 'running');
    $('#timer-card').classList.toggle('timer-completed', item.status === 'complete');
    renderLaps(); updateDock();
  }
  function renderLaps() {
    const item = state.sessions.stopwatch;
    $('#lap-section').hidden = state.mode !== 'stopwatch' || !item.laps.length;
    $('#timer-laps').innerHTML = [...item.laps].reverse().map((lap) => `<li><span>Vòng ${String(lap.number).padStart(2, '0')}</span><strong>${clock(lap.split, true).main}${clock(lap.split, true).tenth}</strong><span>${clock(lap.total, true).main}${clock(lap.total, true).tenth}</span></li>`).join('');
  }
  function updateClock() {
    const details = info(), item = current(), display = clock(details.display, state.mode === 'stopwatch');
    $('#timer-clock-main').textContent = display.main; $('#timer-clock-tenths').textContent = display.tenth;
    $('.timer-clock').classList.toggle('long-time', display.main.length > 8);
    $('#timer-phase').textContent = item.status === 'paused' ? 'TẠM DỪNG' : details.phase;
    $('#timer-phase').className = state.mode === 'interval' && details.phase === 'NGHỈ' ? 'rest-phase' : '';
    $('#timer-round').textContent = state.mode === 'interval' ? `Hiệp ${details.round} / ${details.rounds}` : item.status === 'paused' ? TITLES[state.mode] : '';
    $('#timer-subtitle').textContent = details.sub;
    $('#timer-linear-progress').style.width = `${details.progress * 100}%`;
    $('#timer-next-phase').textContent = state.mode === 'interval' ? `${details.next || 'Một lượt đã hoàn thành.'}${details.sideNote ? ' · Tập riêng từng bên.' : ''}` : item.status === 'paused' ? 'Đồng hồ giữ nguyên thời gian khi tạm dừng.' : item.status === 'complete' ? 'Bạn có thể tắt âm báo hoặc bắt đầu lượt mới.' : '';
    updateDock();
  }
  function activeDockMode() {
    return MODES.find((mode) => state.sessions[mode].status === 'running') || (current().status !== 'idle' ? state.mode : MODES.find((mode) => state.sessions[mode].status === 'paused')) || null;
  }
  function updateDock() {
    const mode = activeDockMode(); dockMode = mode || state.mode;
    const visible = !!mode || musicState.playing;
    dock.hidden = !visible; document.body.classList.toggle('has-training-dock', visible);
    $('.dock-clock').hidden = !mode; $('[data-tool-action="dock-timer"]').hidden = !mode;
    $('.dock-divider').hidden = !mode || !musicState.hasTracks;
    if (mode) {
      const details = info(mode), item = state.sessions[mode], display = clock(details.display, mode === 'stopwatch');
      $('#dock-clock-time').textContent = display.main;
      $('#dock-clock-label').textContent = `${TITLES[mode]}${mode === 'interval' ? ` · ${details.phase.toLocaleLowerCase('vi-VN')}` : ''}${item.status === 'paused' ? ' · tạm dừng' : item.status === 'complete' ? ' · xong' : ''}`;
      const button = $('[data-tool-action="dock-timer"]');
      const alarm = mode === 'countdown' && item.run?.kind === 'absolute' && item.status === 'running';
      button.innerHTML = icon(alarm || item.status === 'complete' ? 'close' : item.status === 'running' ? 'pause' : 'play');
      button.setAttribute('aria-label', alarm ? 'Hủy hẹn giờ' : item.status === 'complete' ? 'Tắt âm báo đồng hồ' : item.status === 'running' ? 'Tạm dừng đồng hồ' : 'Tiếp tục đồng hồ');
    }
    $('.dock-music-info').hidden = !musicState.hasTracks;
    $('#dock-track-title').textContent = musicState.title || 'Nhạc tập luyện';
    $('[data-tool-action="music-toggle"]').hidden = !musicState.hasTracks;
    $('[data-tool-action="music-next"]').hidden = !musicState.hasTracks;
    $('[data-tool-action="music-toggle"]').innerHTML = icon(musicState.playing ? 'pause' : 'play');
    $('[data-tool-action="music-toggle"]').setAttribute('aria-label', musicState.playing ? 'Tạm dừng nhạc' : 'Phát nhạc');
    $('.dock-music-indicator').classList.toggle('playing', musicState.playing);
  }

  async function unlockAudio() {
    if (!state.sound) return false;
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return false; audioContext ||= new Audio(); if (audioContext.state !== 'running') await audioContext.resume(); return audioContext.state === 'running'; }
    catch { note('Chưa phát được âm báo. Đồng hồ vẫn hiển thị trạng thái.'); return false; }
  }
  function beep(kind = 'phase') {
    if (!state.sound || !audioContext || audioContext.state !== 'running') return;
    try {
      const now = audioContext.currentTime, count = kind === 'end' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = kind === 'rest' ? 520 : kind === 'end' ? 880 : 740;
        const start = now + i * .32, duration = kind === 'end' ? .2 : .14;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.22, start + .015); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + duration + .03);
      }
    } catch { /* Visual phase labels remain available when audio is suspended. */ }
  }
  function stopAlert() { clearInterval(alertInterval); alertInterval = null; }
  function beginAlert() { stopAlert(); beep('end'); if (state.sound && audioContext?.state === 'running') alertInterval = setInterval(() => { if (current().status === 'complete' && !current().acknowledged) beep('end'); else stopAlert(); }, 6000); }
  function dismissAlert() { current().acknowledged = true; stopAlert(); save(); renderControls(); note('Đã tắt âm báo.'); }
  function reconcile(silent = false) {
    const now = Date.now(), item = current(), details = info(state.mode, now);
    if (item.status === 'running' && details.complete) {
      item.elapsed = item.run.duration; item.startedAt = null; item.status = 'complete'; item.acknowledged = false;
      save(); if (!silent) beginAlert(); renderControls(); syncWake();
    } else if (item.status === 'running' && state.mode === 'interval' && lastPhase && details.key !== lastPhase && now - lastTick < 2500 && !silent) beep(details.phase === 'NGHỈ' ? 'rest' : 'phase');
    lastPhase = details.key; lastTick = now; updateClock();
  }
  function readConfiguration() {
    const settings = state.settings;
    if (state.mode === 'countdown') {
      if (settings.countdownKind === 'absolute') {
        const input = $('#alarm-datetime'), value = input.value;
        const deadline = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? Date.parse(`${value}:00+07:00`) : NaN;
        input.setCustomValidity(Number.isFinite(deadline) && deadline > Date.now() ? '' : 'Chọn một mốc giờ trong tương lai theo UTC+7.');
        if (!input.reportValidity()) { note('Chọn ngày và giờ trong tương lai theo múi giờ Việt Nam/Bangkok.'); return null; }
        settings.alarmInput = value;
        return { kind: 'absolute', deadline, duration: deadline - Date.now() };
      }
      const mins = Number($('#countdown-minutes').value), seconds = Number($('#countdown-seconds').value);
      if (!$('#countdown-minutes').value || !$('#countdown-seconds').value || !integer(mins, 0, 360) || !integer(seconds, 0, 59) || mins * 60 + seconds <= 0 || mins * 60 + seconds > 21600) { note('Nhập thời gian từ 1 giây đến 6 giờ; ô giây từ 0 đến 59.'); return null; }
      settings.duration = mins * 60 + seconds;
      return { kind: 'duration', duration: settings.duration * 1000, deadline: null };
    }
    if (state.mode === 'interval') {
      const work = Number($('#interval-work').value), rest = Number($('#interval-rest').value), rounds = Number($('#interval-rounds').value);
      if (!$('#interval-work').value || !$('#interval-rest').value || !$('#interval-rounds').value || !integer(work, 1, 3600) || !integer(rest, 0, 3600) || !integer(rounds, 1, 50)) { note('Tập 1–3.600 giây, nghỉ 0–3.600 giây, từ 1 đến 50 hiệp.'); return null; }
      const duration = (work * rounds + rest * (rounds - 1)) * 1000;
      if (duration > 86400000) { note('Tổng thời gian của một lượt không được vượt quá 24 giờ.'); return null; }
      Object.assign(settings, { work, rest, rounds });
      return { work, rest, rounds, duration, exerciseName: settings.exerciseName, sideNote: settings.sideNote };
    }
    return null;
  }
  function toggle() {
    const item = current(); stopAlert();
    if (item.status === 'running') {
      if (state.mode === 'countdown' && item.run.kind === 'absolute') { state.sessions.countdown = blank(); note('Đã hủy hẹn giờ. Bạn có thể chọn mốc giờ mới.'); }
      else { item.elapsed = elapsed(item); item.startedAt = null; item.status = 'paused'; note('Đã tạm dừng. Thời gian được giữ lại.'); }
    } else {
      if (item.status === 'idle' || item.status === 'complete') {
        const config = readConfiguration(); if (state.mode !== 'stopwatch' && !config) return;
        const fresh = blank(); fresh.run = config; state.sessions[state.mode] = fresh;
      }
      const active = current(); active.status = 'running'; active.startedAt = Date.now(); active.acknowledged = true;
      unlockAudio().then((ok) => { if (ok) beep('phase'); });
      note(state.mode === 'interval' && state.settings.sideNote ? 'Đồng hồ chạy cho một bên. Đổi bên và chạy lại khi bạn sẵn sàng.' : 'Đồng hồ đang chạy. Bạn có thể xem lịch hoặc chuyển sang thẻ trình duyệt khác.');
    }
    lastPhase = info().key; lastTick = Date.now(); save(); renderControls(); reconcile(); syncWake();
  }
  function reset() { stopAlert(); state.sessions[state.mode] = blank(); save(); renderControls(); updateClock(); syncWake(); note('Đã đặt lại chế độ này. Các chế độ khác vẫn giữ thời gian đã lưu.'); }
  function selectMode(mode) {
    if (!MODES.includes(mode) || mode === state.mode) return;
    if (current().status === 'running') { note('Tạm dừng đồng hồ hoặc hủy hẹn trước khi đổi chế độ.'); return; }
    stopAlert(); state.mode = mode; lastPhase = ''; save(); populateFields(); renderControls(); updateClock(); note(current().status === 'paused' ? 'Lượt trước đang tạm dừng. Bạn có thể tiếp tục hoặc đặt lại.' : 'Sẵn sàng cho nhịp tập của bạn.');
  }
  function addLap() {
    if (state.mode !== 'stopwatch' || current().status !== 'running') return;
    const item = current(), total = elapsed(item), previous = item.laps.at(-1)?.total || 0;
    item.lapCount++; item.laps.push({ number: item.lapCount, total, split: total - previous }); item.laps = item.laps.slice(-20); save(); renderLaps(); note(`Đã ghi vòng ${item.lapCount}.`);
  }
  function skipPhase() {
    if (state.mode !== 'interval' || !isLocked()) return;
    const item = current(), details = info(); item.elapsed = details.endOfPhase; item.startedAt = item.status === 'running' ? Date.now() : null;
    if (item.elapsed >= item.run.duration) { item.elapsed = item.run.duration; item.status = 'complete'; item.startedAt = null; item.acknowledged = false; beginAlert(); }
    else { lastPhase = info().key; beep(info().phase === 'NGHỈ' ? 'rest' : 'phase'); }
    save(); renderControls(); updateClock(); syncWake(); note('Đã chuyển sang nhịp tiếp theo.');
  }
  function selectExercise(item) {
    window.NhipView?.open('workout', { scroll: false });
    if (!item || !integer(item.hold, 1, 3600) || !integer(item.rest, 0, 3600) || !integer(item.sets, 1, 50)) return false;
    if (running() || isLocked(state.sessions.interval)) { note('Tạm dừng và đặt lại chế độ Tập và nghỉ trước khi áp dụng bài khác.'); $('#timer-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return false; }
    stopAlert(); state.mode = 'interval'; state.sessions.interval = blank();
    Object.assign(state.settings, { work: item.hold, rest: item.rest, rounds: item.sets, exerciseName: String(item.name).slice(0, 90), sideNote: /mỗi bên|đổi bên/i.test(item.focus || '') ? 'Tính cho mỗi bên. Chạy một lượt, rồi đổi bên và chạy lại; đồng hồ không tự đánh dấu bài đã hoàn thành.' : '' });
    save(); populateFields(); renderControls(); updateClock(); $('#interval-exercise').value = item.id; note(`Đã áp dụng thông số của bài ${item.name}. Kiểm tra tư thế trước khi bắt đầu.`);
    $('#timer-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    return true;
  }

  async function syncWake() {
    const supported = 'wakeLock' in navigator && window.isSecureContext;
    $('#timer-wake').disabled = !supported;
    if (!supported) { $('#wake-status').textContent = window.isSecureContext ? 'Trình duyệt này chưa hỗ trợ giữ màn hình sáng.' : 'Giữ màn hình sáng cần HTTPS hoặc localhost; không hỗ trợ ở địa chỉ Wi-Fi HTTP.'; return; }
    if (!state.wake || !running() || document.visibilityState !== 'visible') {
      if (wakeLock) { const previous = wakeLock; wakeLock = null; try { await previous.release(); } catch {} }
      $('#wake-status').textContent = state.wake ? 'Sẽ giữ màn hình sáng khi đồng hồ chạy và trang hiển thị.' : 'Có thể bật giữ màn hình sáng khi tập.'; return;
    }
    if (wakeLock) { $('#wake-status').textContent = 'Đang giữ màn hình sáng.'; return; }
    if (wakePending) return;
    wakePending = true;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      if (!state.wake || !running() || document.visibilityState !== 'visible') { await wakeLock.release(); wakeLock = null; wakeMessage = 'Sẽ giữ màn hình sáng khi đồng hồ chạy và trang hiển thị.'; }
      else { wakeLock.addEventListener('release', () => { wakeLock = null; $('#wake-status').textContent = 'Đã tắt giữ màn hình sáng. Sẽ thử lại khi bạn quay về trang.'; }); wakeMessage = 'Đang giữ màn hình sáng.'; }
    }
    catch { wakeMessage = 'Chưa giữ được màn hình sáng. Thiết bị hoặc chế độ tiết kiệm pin có thể đang hạn chế tính năng này.'; }
    finally { wakePending = false; $('#wake-status').textContent = wakeMessage; }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool-action]'); if (!button || button.disabled) return;
    const action = button.dataset.toolAction;
    if (action === 'mode') selectMode(button.dataset.mode);
    if (action === 'toggle') toggle();
    if (action === 'reset') reset();
    if (action === 'lap') addLap();
    if (action === 'skip') skipPhase();
    if (action === 'dismiss-alert') dismissAlert();
    if (action === 'test-sound') unlockAudio().then((ok) => { if (ok) { beep('end'); note('Âm báo thử: ba tiếng chuông khi hoàn thành.'); } else note(state.sound ? 'Chưa phát được âm báo trên trình duyệt này.' : 'Bật Âm báo để nghe thử.'); });
    if (action === 'countdown-kind' && !isLocked()) { state.settings.countdownKind = button.dataset.kind; state.sessions.countdown = blank(); save(); renderControls(); updateClock(); }
    if (action === 'countdown-preset' && !isLocked()) { state.settings.duration = Number(button.dataset.seconds); state.sessions.countdown = blank(); stopAlert(); save(); populateFields(); renderControls(); updateClock(); }
    if (action === 'interval-preset' && !isLocked()) { const preset = button.dataset.preset === 'tabata' ? { work: 20, rest: 10, rounds: 8 } : { work: 25, rest: 60, rounds: 4 }; Object.assign(state.settings, preset, { exerciseName: '', sideNote: '' }); state.sessions.interval = blank(); stopAlert(); save(); populateFields(); renderControls(); updateClock(); }
    if (action === 'load-exercise') { const item = exercises.find((entry) => entry.id === $('#interval-exercise').value); if (item) selectExercise(item); else note('Chọn một bài tập của ngày đang xem.'); }
    if (action === 'dock-timer') { if (state.mode !== dockMode && !running()) { state.mode = dockMode; populateFields(); } if (current().status === 'complete') { dismissAlert(); state.sessions[state.mode] = blank(); save(); renderControls(); updateClock(); } else toggle(); }
    if (action === 'music-toggle') window.NhipMusic?.toggle();
    if (action === 'music-next') window.NhipMusic?.next();
  });
  $('#timer-sound').addEventListener('change', (event) => { state.sound = event.target.checked; if (!state.sound) stopAlert(); save(); note(state.sound ? 'Đã bật âm báo. Bấm Bắt đầu để cho phép phát âm thanh.' : 'Đã tắt âm báo. Trạng thái vẫn hiển thị trên đồng hồ.'); });
  $('#timer-wake').addEventListener('change', (event) => { state.wake = event.target.checked; save(); syncWake(); });
  $('#alarm-datetime').addEventListener('input', (event) => { event.target.setCustomValidity(''); if (!isLocked(state.sessions.countdown)) { state.settings.alarmInput = event.target.value; save(); } });
  document.querySelectorAll('#duration-fields input, .timer-fields-three input').forEach((input) => input.addEventListener('change', () => {
    if (isLocked()) return;
    const config = readConfiguration(); if (config || state.mode === 'stopwatch') { if (current().status === 'complete') state.sessions[state.mode] = blank(); save(); renderControls(); updateClock(); }
  }));
  $('.timer-tabs').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || current().status === 'running') return;
    event.preventDefault(); const index = MODES.indexOf(state.mode), next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3; selectMode(MODES[next]); $(`#tab-${state.mode}`).focus();
  });
  document.addEventListener('nhipmusic:state', (event) => { if (event.detail && typeof event.detail.playing === 'boolean') { musicState = { playing: event.detail.playing, title: String(event.detail.title || ''), hasTracks: event.detail.hasTracks === true }; updateDock(); } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { lastTick = 0; reconcile(); syncWake(); } });
  window.addEventListener('pagehide', save);
  window.NhipTimer = {
    setExercises(list) { exercises = Array.isArray(list) ? list.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string').map((item) => ({ ...item })) : []; renderExercises(); },
    selectExercise,
    getState() { const details = info(); return { mode: state.mode, status: current().status, elapsed: elapsed(current()), remaining: state.mode === 'stopwatch' ? null : details.display, phase: details.phase, round: details.round || null, rounds: details.rounds || null, sound: state.sound, laps: current().laps.map((lap) => ({ ...lap })) }; },
  };
  populateFields(); renderExercises(); renderControls(); reconcile(true); syncWake();
  if (initialNotice) note(initialNotice);
  if (window.NhipMusic?.getState) { musicState = window.NhipMusic.getState(); updateDock(); }
  setInterval(() => reconcile(), 100);
})();
