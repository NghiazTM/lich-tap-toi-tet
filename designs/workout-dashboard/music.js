(() => {
  'use strict';
  const initialize = () => {
    const host = document.getElementById('music-player-root');
    if (!host) return;
    const PREF_KEY = 'nhip-tap-music-v1';
    const presets = [
      { id: 'beat-100', title: 'Vào nhịp', subtitle: 'Nhạc không lời · 100 BPM', bpm: 100, duration: 57.6, src: 'assets/audio/vao-nhip-100.wav', builtin: true },
      { id: 'beat-120', title: 'Giữ nhịp', subtitle: 'Nhạc không lời · 120 BPM', bpm: 120, duration: 48, src: 'assets/audio/giu-nhip-120.wav', builtin: true },
      { id: 'beat-140', title: 'Bứt tốc', subtitle: 'Nhạc không lời · 140 BPM', bpm: 140, duration: 96 * 60 / 140, src: 'assets/audio/but-toc-140.wav', builtin: true },
    ];
    const glyphs = {
      play: '<path d="m8 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
      previous: '<path d="M5 5v14m14-14L8 12l11 7Z"/>', next: '<path d="M19 5v14M5 5l11 7-11 7Z"/>',
      shuffle: '<path d="M3 6h3l12 12h3m-4-4 4 4-4 4M3 18h3l4-4m4-4 4-4h3m-4-4 4 4-4 4"/>',
      repeat: '<path d="m17 2 4 4-4 4M3 10V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3"/>',
      volume: '<path d="M11 5 6 9H3v6h3l5 4Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
      mute: '<path d="M11 5 6 9H3v6h3l5 4Zm5 4 5 6m0-6-5 6"/>',
      add: '<path d="M12 4v16M4 12h16"/>', remove: '<path d="m7 7 10 10M7 17 17 7"/>',
      headphones: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v8H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 1-2Zm16 0h-3v8h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-1-2Z"/>',
      note: '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="5.5" cy="18.5" rx="3.5" ry="2.5"/><ellipse cx="16.5" cy="16.5" rx="3.5" ry="2.5"/>',
    };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${glyphs[name] || glyphs.note}</svg>`;
    const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const defaults = { version: 1, volume: 0.65, muted: false, shuffle: false, repeat: 'all', selectedId: 'beat-100' };
    let prefs = { ...defaults };
    try {
      const stored = JSON.parse(localStorage.getItem(PREF_KEY));
      if (stored?.version === 1) {
        if (Number.isFinite(stored.volume) && stored.volume >= 0 && stored.volume <= 1) prefs.volume = stored.volume;
        if (typeof stored.muted === 'boolean') prefs.muted = stored.muted;
        if (typeof stored.shuffle === 'boolean') prefs.shuffle = stored.shuffle;
        if (['off', 'all', 'one'].includes(stored.repeat)) prefs.repeat = stored.repeat;
        if (typeof stored.selectedId === 'string' && stored.selectedId.length < 150) prefs.selectedId = stored.selectedId;
      }
    } catch { /* Settings are optional when browser storage is unavailable. */ }
    const preferredInitialTrack = prefs.selectedId;
    const tracks = presets.map(track => ({ ...track }));
    const blobUrls = new Set();
    let selectedId = tracks.some(track => track.id === preferredInitialTrack) ? preferredInitialTrack : tracks[0].id;
    let playing = false;
    let loading = false;
    let userInteracted = false;
    let loadVersion = 0;
    let shuffleQueue = [];
    let draggingSeek = false;
    let databasePromise;
    let storageNoticeShown = false;
    const audio = document.createElement('audio');
    audio.id = 'nhip-music-audio';
    audio.preload = 'metadata';
    audio.hidden = true;
    audio.volume = prefs.volume;
    audio.muted = prefs.muted;

    host.innerHTML = `<div class="music-heading"><div><span class="music-eyebrow">MỘT NHỊP ĐIỆU ĐỒNG HÀNH</span><h2 id="music-title">Nhạc tập luyện</h2></div><span class="music-heading-icon">${icon('headphones')}</span></div>
      <div class="music-now"><span class="music-record" aria-hidden="true"><span></span>${icon('note')}</span><div class="music-now-copy"><span class="music-now-label" id="music-now-label">SẴN SÀNG VÀO NHỊP</span><strong id="music-track-title"></strong><span id="music-track-subtitle"></span></div><span id="music-bpm" class="music-bpm"></span></div>
      <div class="music-seek-area"><label class="music-visually-hidden" for="music-seek">Vị trí phát nhạc</label><input type="range" id="music-seek" min="0" max="100" step="0.1" value="0" disabled><div class="music-times"><span id="music-current-time">0:00</span><span id="music-duration">--:--</span></div></div>
      <div class="music-transport"><button class="music-control music-secondary" type="button" data-music-action="shuffle" aria-label="Bật phát ngẫu nhiên" aria-pressed="false">${icon('shuffle')}</button><button class="music-control" type="button" data-music-action="previous" aria-label="Bài nhạc trước">${icon('previous')}</button><button class="music-control music-play" type="button" data-music-action="toggle" aria-label="Phát nhạc">${icon('play')}</button><button class="music-control" type="button" data-music-action="next" aria-label="Bài nhạc tiếp theo">${icon('next')}</button><button class="music-control music-secondary music-repeat" type="button" data-music-action="repeat" aria-label="Lặp: Cả danh sách" aria-pressed="true">${icon('repeat')}<span class="music-repeat-one" hidden>1</span></button></div>
      <div class="music-volume-row"><button class="music-control music-volume-button" type="button" data-music-action="mute" aria-label="Tắt tiếng nhạc" aria-pressed="false">${icon('volume')}</button><label class="music-visually-hidden" for="music-volume">Âm lượng nhạc</label><input type="range" id="music-volume" min="0" max="100" step="1" value="65"><span id="music-volume-value">65%</span></div>
      <div class="music-list-heading"><strong>Danh sách của bạn</strong><span id="music-count">3 bài</span></div><div id="music-playlist" class="music-playlist" role="list" aria-label="Danh sách nhạc tập luyện"></div>
      <button class="music-upload" type="button" data-music-action="upload">${icon('add')}Thêm nhạc từ thiết bị</button><input id="music-files" type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm" multiple hidden>
      <p class="music-storage-note">3 bản nhạc không lời có sẵn · Bạn có thể thêm nhạc riêng.</p><p id="music-status" class="music-status" role="status" aria-live="polite">Nhạc trên thiết bị này, không tải lên máy chủ.</p>`;
    host.append(audio);
    const $ = selector => host.querySelector(selector);
    const currentTrack = () => tracks.find(track => track.id === selectedId);
    const status = (message, error = false) => { $('#music-status').textContent = message; $('#music-status').classList.toggle('is-error', error); };
    const formatTime = seconds => Number.isFinite(seconds) && seconds >= 0 ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '--:--';
    const getState = () => ({ playing, title: currentTrack()?.title || 'Chưa có nhạc', hasTracks: tracks.length > 0 });
    const emit = () => document.dispatchEvent(new CustomEvent('nhipmusic:state', { detail: getState() }));
    const savePreferences = () => {
      try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs, selectedId })); }
      catch { if (!storageNoticeShown) { storageNoticeShown = true; status('Tùy chọn nhạc chỉ được giữ trong phiên này vì trình duyệt chưa cho phép lưu dữ liệu.'); } }
    };
    const shuffle = values => {
      for (let index = values.length - 1; index > 0; index--) { const other = Math.floor(Math.random() * (index + 1)); [values[index], values[other]] = [values[other], values[index]]; }
      return values;
    };
    const resetShuffleQueue = () => { shuffleQueue = shuffle(tracks.filter(track => track.id !== selectedId).map(track => track.id)); };
    function renderPlaylist() {
      const focused = document.activeElement?.closest('[data-music-track], [data-music-remove]');
      const focusedTrack = focused?.dataset.musicTrack;
      const focusedRemove = focused?.dataset.musicRemove;
      $('#music-playlist').innerHTML = tracks.map((track, index) => `<div class="music-track-row ${track.id === selectedId ? 'is-current' : ''}" role="listitem"><button type="button" class="music-track-choice" data-music-track="${escape(track.id)}" aria-label="Chọn và phát ${escape(track.title)}" ${track.id === selectedId ? 'aria-current="true"' : ''}><span class="music-track-index">${track.id === selectedId && playing ? '<span class="music-equalizer" aria-hidden="true"><i></i><i></i><i></i></span>' : String(index + 1).padStart(2, '0')}</span><span class="music-track-copy"><strong>${escape(track.title)}</strong><span>${escape(track.subtitle || (track.persisted ? 'Nhạc của bạn · Đã lưu trên thiết bị' : 'Nhạc của bạn · Chỉ lưu trong phiên này'))}</span></span><span class="music-track-duration" data-duration-for="${escape(track.id)}">${formatTime(track.duration)}</span></button>${track.builtin ? '' : `<button class="music-remove" type="button" data-music-remove="${escape(track.id)}" aria-label="Xóa ${escape(track.title)} khỏi danh sách">${icon('remove')}</button>`}</div>`).join('');
      $('#music-count').textContent = `${tracks.length} bài`;
      if (focusedTrack) host.querySelector(`[data-music-track="${CSS.escape(focusedTrack)}"]`)?.focus({ preventScroll: true });
      if (focusedRemove) host.querySelector(`[data-music-remove="${CSS.escape(focusedRemove)}"]`)?.focus({ preventScroll: true });
    }
    function renderCurrent() {
      const track = currentTrack();
      $('#music-track-title').textContent = track?.title || 'Chọn một bài nhạc';
      $('#music-track-subtitle').textContent = track?.subtitle || 'Nhạc riêng của bạn';
      $('#music-bpm').textContent = track?.bpm ? `${track.bpm} BPM` : 'Tệp riêng';
      $('#music-bpm').hidden = !track;
      updateProgress();
      updatePlayback();
    }
    function updatePlayback() {
      const intentToPlay = playing || loading;
      const playButton = $('[data-music-action="toggle"]');
      playButton.innerHTML = icon(intentToPlay ? 'pause' : 'play');
      playButton.setAttribute('aria-label', intentToPlay ? 'Tạm dừng nhạc' : 'Phát nhạc');
      playButton.setAttribute('aria-pressed', String(playing));
      host.classList.toggle('music-is-playing', playing);
      $('#music-now-label').textContent = loading && !playing ? 'ĐANG TẢI NHẠC' : playing ? 'ĐANG PHÁT' : 'SẴN SÀNG VÀO NHỊP';
      $('[data-music-action="shuffle"]').setAttribute('aria-pressed', String(prefs.shuffle));
      $('[data-music-action="shuffle"]').setAttribute('aria-label', prefs.shuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên');
      const repeatLabel = { off: 'tắt', all: 'cả danh sách', one: 'một bài' }[prefs.repeat];
      $('[data-music-action="repeat"]').setAttribute('aria-label', `Lặp: ${repeatLabel}`);
      $('[data-music-action="repeat"]').setAttribute('aria-pressed', String(prefs.repeat !== 'off'));
      $('.music-repeat-one').hidden = prefs.repeat !== 'one';
      $('[data-music-action="mute"]').innerHTML = icon(audio.muted || audio.volume === 0 ? 'mute' : 'volume');
      $('[data-music-action="mute"]').setAttribute('aria-label', audio.muted ? 'Bật tiếng nhạc' : 'Tắt tiếng nhạc');
      $('[data-music-action="mute"]').setAttribute('aria-pressed', String(audio.muted));
      $('#music-volume').value = Math.round(audio.volume * 100);
      $('#music-volume-value').textContent = audio.muted ? 'Tắt' : `${Math.round(audio.volume * 100)}%`;
      try { if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch { /* Optional device integration. */ }
    }
    function updateProgress() {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : currentTrack()?.duration;
      $('#music-current-time').textContent = formatTime(audio.currentTime);
      $('#music-duration').textContent = formatTime(duration);
      const seek = $('#music-seek');
      seek.disabled = !Number.isFinite(duration) || duration <= 0;
      if (!draggingSeek) seek.value = Number.isFinite(duration) && duration > 0 ? Math.min(100, audio.currentTime / duration * 100) : 0;
      seek.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} trên ${formatTime(duration)}`);
      try {
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration) && audio.duration > 0) navigator.mediaSession.setPositionState({ duration: audio.duration, position: Math.max(0, Math.min(audio.currentTime, audio.duration)), playbackRate: audio.playbackRate });
      } catch { /* Some mobile browsers support only part of Media Session. */ }
    }
    function updateMediaMetadata() {
      if (!('mediaSession' in navigator) || !('MediaMetadata' in window)) return;
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: currentTrack()?.title || 'Nhịp Tập', artist: currentTrack()?.builtin ? 'Nhịp Tập · Nhạc không lời' : 'Nhạc trên thiết bị', album: 'Nhạc tập luyện' }); } catch { /* Optional. */ }
    }
    async function play() {
      if (!currentTrack()) return;
      document.dispatchEvent(new CustomEvent('nhipmusic:localrequest'));
      userInteracted = true;
      const version = loadVersion;
      loading = true; updatePlayback();
      try { await audio.play(); }
      catch (error) {
        if (version !== loadVersion || error.name === 'AbortError') return;
        loading = false; playing = false; updatePlayback(); emit();
        status(error.name === 'NotAllowedError' ? 'Bấm nút Phát để cho phép trình duyệt phát âm thanh.' : 'Không phát được tệp này. Hãy chọn bài khác hoặc thử tệp MP3/WAV.', true);
      }
    }
    function pause() { loading = false; audio.pause(); playing = false; updatePlayback(); emit(); }
    function toggle() { if (!audio.paused || loading) pause(); else play(); }
    function selectTrack(id, autoplay = false, preserveQueue = false, persist = true) {
      const track = tracks.find(item => item.id === id);
      if (!track) return;
      ++loadVersion;
      audio.pause(); playing = false; loading = false;
      selectedId = track.id;
      audio.src = track.src;
      audio.load();
      if (!preserveQueue) resetShuffleQueue();
      if (persist) savePreferences();
      renderCurrent(); renderPlaylist(); updateMediaMetadata(); emit();
      if (autoplay) play();
    }
    function advance(direction = 1, manual = true) {
      if (!tracks.length) return;
      const shouldPlay = manual ? !audio.paused || playing || loading : true;
      if (direction < 0 && audio.currentTime > 3) { audio.currentTime = 0; updateProgress(); return; }
      if (direction > 0 && prefs.shuffle) {
        shuffleQueue = shuffleQueue.filter(id => tracks.some(track => track.id === id));
        if (!shuffleQueue.length && (manual || prefs.repeat === 'all')) resetShuffleQueue();
        const nextId = shuffleQueue.shift();
        if (nextId) selectTrack(nextId, shouldPlay, true);
        else if (tracks.length === 1 && (manual || prefs.repeat === 'all')) { audio.currentTime = 0; if (shouldPlay) play(); }
        return;
      }
      let index = tracks.findIndex(track => track.id === selectedId) + direction;
      if (index >= tracks.length || index < 0) {
        if (!manual && prefs.repeat === 'off') return;
        index = (index + tracks.length) % tracks.length;
      }
      selectTrack(tracks[index].id, shouldPlay);
    }
    function database() {
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
        let done = false;
        const request = indexedDB.open('nhip-tap-music', 1);
        request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('tracks')) request.result.createObjectStore('tracks', { keyPath: 'id' }); };
        request.onsuccess = () => { if (done) { request.result.close(); return; } done = true; request.result.onversionchange = () => request.result.close(); resolve(request.result); };
        request.onerror = () => { done = true; reject(request.error); };
        request.onblocked = () => { done = true; reject(new Error('IndexedDB blocked')); };
      });
      return databasePromise;
    }
    async function storedFiles() {
      const db = await database();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('tracks', 'readonly');
        const request = transaction.objectStore('tracks').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.onabort = () => reject(transaction.error);
      });
    }
    async function writeStoredFile(record, remove = false) {
      const db = await database();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('tracks', 'readwrite');
        const store = transaction.objectStore('tracks');
        if (remove) store.delete(record.id); else store.put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    }
    function makeFileTrack(record, persisted) {
      const src = URL.createObjectURL(record.blob); blobUrls.add(src);
      return { id: record.id, title: record.title, src, builtin: false, persisted, addedAt: record.addedAt, duration: Number.isFinite(record.duration) && record.duration > 0 ? record.duration : undefined };
    }
    async function addFiles(fileList) {
      userInteracted = true;
      let added = 0, rejected = 0, saved = 0;
      const jobs = [];
      for (const file of Array.from(fileList || [])) {
        if (!(file instanceof Blob) || !file.size || !(file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name || ''))) { rejected++; continue; }
        const record = { id: `file-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, title: String(file.name || 'Nhạc của tôi').slice(0, 180), blob: file, addedAt: Date.now() };
        const track = makeFileTrack(record, false); tracks.push(track); added++;
        jobs.push(writeStoredFile(record).then(() => { track.persisted = true; saved++; const row = host.querySelector(`[data-music-track="${CSS.escape(track.id)}"] .music-track-copy>span`); if (row) row.textContent = 'Nhạc của bạn · Đã lưu trên thiết bị'; }).catch(() => {}));
      }
      $('#music-files').value = '';
      if (!added) { status('Chọn tệp âm thanh hợp lệ, chẳng hạn MP3, WAV, M4A hoặc OGG.', true); return; }
      resetShuffleQueue(); renderPlaylist(); emit();
      status(`Đã thêm ${added} bài. Đang lưu trên thiết bị…`);
      await Promise.all(jobs);
      status(`${saved === added ? `Đã lưu ${added} bài trên thiết bị này.` : `Đã thêm ${added} bài; ${added - saved} bài chỉ dùng trong phiên này vì trình duyệt chưa cho phép lưu.`}${rejected ? ` Đã bỏ qua ${rejected} tệp không phải âm thanh.` : ''}`, saved !== added);
    }
    async function removeTrack(id) {
      userInteracted = true;
      const index = tracks.findIndex(track => track.id === id && !track.builtin);
      if (index < 0) return;
      const [track] = tracks.splice(index, 1);
      if (selectedId === id) selectTrack(tracks[Math.min(index, tracks.length - 1)].id, false);
      if (blobUrls.has(track.src)) { URL.revokeObjectURL(track.src); blobUrls.delete(track.src); }
      resetShuffleQueue(); renderPlaylist(); emit();
      try { await writeStoredFile({ id }, true); status('Đã xóa bài nhạc khỏi danh sách trên thiết bị.'); }
      catch { status('Đã bỏ bài khỏi phiên này, nhưng chưa xóa được bản lưu trong trình duyệt.', true); }
    }
    host.addEventListener('click', event => {
      const trackButton = event.target.closest('[data-music-track]');
      if (trackButton) { userInteracted = true; selectTrack(trackButton.dataset.musicTrack, true); return; }
      const remove = event.target.closest('[data-music-remove]');
      if (remove) { removeTrack(remove.dataset.musicRemove); return; }
      const action = event.target.closest('[data-music-action]')?.dataset.musicAction;
      if (!action) return;
      userInteracted = true;
      if (action === 'toggle') toggle();
      if (action === 'upload') $('#music-files').click();
      if (action === 'next') advance(1);
      if (action === 'previous') advance(-1);
      if (action === 'shuffle') { prefs.shuffle = !prefs.shuffle; resetShuffleQueue(); savePreferences(); updatePlayback(); status(prefs.shuffle ? 'Đã bật phát ngẫu nhiên.' : 'Phát theo thứ tự danh sách.'); }
      if (action === 'repeat') { prefs.repeat = { off: 'all', all: 'one', one: 'off' }[prefs.repeat]; savePreferences(); updatePlayback(); status({ off: 'Dừng khi hết danh sách.', all: 'Lặp lại cả danh sách.', one: 'Lặp lại bài đang chọn.' }[prefs.repeat]); }
      if (action === 'mute') { audio.muted = !audio.muted; prefs.muted = audio.muted; savePreferences(); updatePlayback(); }
    });
    $('#music-files').addEventListener('change', event => addFiles(event.target.files));
    $('#music-volume').addEventListener('input', event => {
      userInteracted = true; audio.volume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
      if (audio.volume > 0) audio.muted = false;
      prefs.volume = audio.volume; prefs.muted = audio.muted; savePreferences(); updatePlayback();
    });
    $('#music-seek').addEventListener('pointerdown', () => { draggingSeek = true; });
    $('#music-seek').addEventListener('input', event => { if (Number.isFinite(audio.duration) && audio.duration > 0) { audio.currentTime = audio.duration * Number(event.target.value) / 100; $('#music-current-time').textContent = formatTime(audio.currentTime); } });
    ['change', 'pointerup', 'pointercancel', 'blur'].forEach(type => $('#music-seek').addEventListener(type, () => { draggingSeek = false; updateProgress(); }));
    host.addEventListener('dragover', event => { event.preventDefault(); host.classList.add('music-drop-active'); });
    host.addEventListener('dragleave', event => { if (!host.contains(event.relatedTarget)) host.classList.remove('music-drop-active'); });
    host.addEventListener('drop', event => { event.preventDefault(); host.classList.remove('music-drop-active'); addFiles(event.dataTransfer?.files); });
    audio.addEventListener('playing', () => { playing = true; loading = false; updatePlayback(); renderPlaylist(); emit(); });
    audio.addEventListener('pause', () => { playing = false; loading = false; updatePlayback(); renderPlaylist(); emit(); });
    audio.addEventListener('waiting', () => { loading = true; updatePlayback(); });
    audio.addEventListener('loadedmetadata', () => {
      const track = currentTrack();
      if (track && Number.isFinite(audio.duration) && audio.duration > 0) { track.duration = audio.duration; const element = host.querySelector(`[data-duration-for="${CSS.escape(track.id)}"]`); if (element) element.textContent = formatTime(audio.duration); }
      updateProgress();
    });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('durationchange', updateProgress);
    audio.addEventListener('volumechange', updatePlayback);
    audio.addEventListener('ended', () => {
      playing = false; loading = false; updatePlayback(); emit();
      if (prefs.repeat === 'one') { audio.currentTime = 0; play(); } else advance(1, false);
    });
    audio.addEventListener('error', () => { playing = false; loading = false; updatePlayback(); emit(); status('Không đọc được bài nhạc này. Hãy chọn bài khác hoặc thử tệp MP3/WAV.', true); });
    if ('mediaSession' in navigator) {
      const actions = { play, pause, nexttrack: () => advance(1), previoustrack: () => advance(-1), seekto: details => { if (Number.isFinite(details.seekTime) && Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, Math.max(0, details.seekTime)); }, seekbackward: details => { audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10)); }, seekforward: details => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset || 10)); } };
      Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Feature detection is per action. */ } });
    }
    window.addEventListener('pagehide', event => { if (!event.persisted) blobUrls.forEach(url => URL.revokeObjectURL(url)); });
    window.NhipMusic = { toggle, next: () => advance(1), pause, getState };
    selectTrack(selectedId, false, false, false);
    storedFiles().then(records => {
      const valid = records.filter(record => record && typeof record.id === 'string' && record.id.startsWith('file-') && record.id.length < 150 && typeof record.title === 'string' && record.title.length <= 180 && record.blob instanceof Blob && record.blob.size > 0);
      valid.sort((a, b) => (Number(a.addedAt) || 0) - (Number(b.addedAt) || 0)).forEach(record => { if (!tracks.some(track => track.id === record.id)) tracks.push(makeFileTrack(record, true)); });
      if (!userInteracted && tracks.some(track => track.id === preferredInitialTrack)) selectTrack(preferredInitialTrack, false, false, false);
      else { renderPlaylist(); resetShuffleQueue(); emit(); }
    }).catch(() => status('Bạn vẫn có thể thêm và nghe nhạc; tệp riêng có thể chỉ được giữ trong phiên này.'));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true }); else initialize();
})();
