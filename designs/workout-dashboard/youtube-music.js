(() => {
  'use strict';

  const SOURCE_URL = 'https://www.youtube.com/watch?v=BEg93DzKBjw&list=RDBEg93DzKBjw&start_radio=1';
  // Observed public Mix on 26/10/2026. YouTube may personalize or reorder the original Mix.
  const TRACKS = [
    { id: 'BEg93DzKBjw', title: 'HAI CHÚNG TA KHÔNG CÓ NGÀY CHIA TAY | DJ BIN BIN', author: 'DJ BIN BIN' },
    { id: 'MjE3Yxrv5NY', title: 'SƠN THUỶ TRÙNG MÂY x THUỶ CHUNG x YẾN VÔ HIẾT (VIETZ x WI. REMIX) - JENA, ANH RỒNG, THƯƠNG VÕ, MÂY BAE', author: 'VietZ' },
    { id: 'ZeTk2L-BXT8', title: 'SAD_ ក្នុងចិត្តអូនបន់ស្រន់❤️😊 Really Remix sad ( សន្យាឲថ្លៃ ) Really ReMix sad 🥀', author: 'VìK SRS KH 🇰🇭' },
    { id: 'oztACMUWcxA', title: 'BÔNG HOA CHẲNG TỒN TẠI (TN x VIETZ REMIX) - HUY VẠC | XA NHAU ANH BIẾT EM CHẲNG CÒN YÊU CÒN THƯƠNG..', author: 'VietZ' },
    { id: 'eXxCihBmaCA', title: 'TƯƠNG TƯ NÀNG CA SĨ REMIX (Bản Hot TikTok) - Trần Phương Ý | Gặp Em Từ Buổi Xem Nhạc Hot TikTok 2025', author: 'Nhạc Sàn Remix' },
    { id: 'IASmtZIwGsY', title: 'បេះដូងអើយបេះដូង❤️😢 ReMix 2021 Sad song Tik Tok 🎶 vai lerng Zea Eng official😔', author: 'Bii NhaMusic' },
    { id: 'bFmJryximNA', title: 'San NeVerCare - ทิ้ง A Rai Rue 🙂💔 Remix Sad 🖤🥀(Dee Sebtember & Thona & Pong)បទល្បីក្នុង Tik Tok 2022', author: 'Hea Jea' },
    { id: 'mxTQT10RMsc', title: 'នារីកំសត់ម្នាក់នេះមិនអាចត្រឡប់រកពិសី x អង្វរ 😪💔 | Remix Funky Sad🥀•Michael ( កុំទៅបានទេមាសស្ងួន )', author: '𝑻𝒊𝒊 𝑩𝒐𝒚' },
    { id: '-szKV-Z6d6E', title: 'មិនព្រមនៅក្បែរអូនឲយូរជាងនេះ_remix ♥️😁🎶2023', author: 'BoY_Din ツ' },
    { id: 'dafZ-2X6-Yg', title: '中國人 (End less Love)💔😔 |Remix sad😢 Dara-Remix បទចិនល្បីក្នុង Tik tok |MENG DY REMIX SadRemix 2024', author: 'M-engdy' },
    { id: 'SYHrmPkxUfg', title: 'Lý Nhân Sầu Remix - TSB REMIX | Nhạc Nền Remix Hot TikTok', author: 'Việt Đức Music' },
    { id: 'I8MSwEUJN-w', title: '#Votha Sad Remix - ចិត្តនៅតែមិនស្អប់💔🥀ចិត្តនៅតែស្រលាញ់ស្រី - REMIX 2026 by Votha RMX', author: 'VOTHA RMX' },
    { id: '1DWqJ90E2to', title: 'GẶP EM ĐÚNG LÚC x BÀI NÀY CHILL PHẾT (VIETZ x WIRARWR REMIX) - PHÙNG ĐỀ MẠC ft. ĐEN', author: 'VietZ' },
    { id: 'kMndAaasXz4', title: 'Nguyệt Hồng Phai (AIR Remix) - Huy TK x NH4T x Pha ♫ Bóng Trăng Đã Phai Tàn Rồi Remix TikTok', author: 'Air Remix' },
    { id: 'z_6KKh8LEVo', title: 'Tìm Em Remix (Chuẩn Hot TikTok)💊 Hngle ft Bảo Anh x Kai Remix | Anh Hãy Thôi Chờ Em Đi Anh Nhé', author: 'Kai Musix' },
    { id: '_jgNgmhb-zs', title: 'Listen to ✈️ Buồn Thì Cứ Khóc Đi Remix by Yzein', author: 'QLA Music' },
    { id: 'Z5HpfNHzTko', title: 'Em Cưới Rồi À Remix (Đông x Thazh) - Thanh Hưng x H2O | Em Cưới Rồi À Không Đợi Anh Nữa À Remix', author: 'H2O Remix' },
    { id: 'kFM6C-M7zmo', title: 'Một Tình Yêu Hai Thử Thách (MiniC x Sado Remix) - Luân Ken 🎼 Lòng Người Khó Nói Em Ơi Remix Tik Tok', author: '9C Media' },
    { id: 'xk1OZea5x5E', title: 'Sad__អានសំបុត្រអូនចប់បងថប់ដង្ហើម x ចាំទាំងត្រដរ 😴💔 | Remix Sad🥀 •TING [ ឆនសុវណ្ណរាជ ] Remix 2024', author: 'Pon Toch' },
    { id: 'TS04y03CEsI', title: 'Mở Lòng Vì Ai (Thazh x Đông Remix) - Inso Cover ♫ Em Một Lòng Vì Anh Nhưng Anh Mở Lòng Vì Ai Remix', author: 'Air Remix' },
    { id: 'N2L9aml1-BE', title: 'Vở Kịch Của Em - Vây Giữ REMIX (HuyN - Trường Alex) | Chạy Theo Những Cuộc Vui Tình Ta Giờ Phai Nhoà', author: 'BD MUSIC TRENDING' },
    { id: 'usBJRm0DNl0', title: 'Lo Người Ướt Áo Remix (Đông x Thazh) - Nguyễn Thạc Bảo Ngọc x H2O | Sao Thấy Đôi Mi Em Buồn Remix', author: 'H2O Remix' },
    { id: 'McdNHDQ4Xag', title: '1 លានឆ្នាំ 🛸🚀SAL ZER II FT SEY HAK 🎬🚀', author: 'SAL ZER II' },
    { id: '0HWMaUHk3d4', title: 'Quên Người Đã Quá Yêu (Tuấn Smile Remix) - Hà Duy Thái ♫ Đã Quá Xa Vời Con Đường Anh Đi Remix 2025', author: 'Trang Xinh Music' },
    { id: 'PF-Y5Z_BtYg', title: 'BAD BOY x មនុស្សល្អ (Remix)', author: 'Pea Run' },
  ];
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${({ play: '<path d="m8 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>', next: '<path d="M19 5v14M5 5l11 7-11 7Z"/>', previous: '<path d="M5 5v14m14-14L8 12l11 7Z"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', external: '<path d="M14 4h6v6M20 4l-9 9M10 4H4v16h16v-6"/>' })[name] || ''}</svg>`;

  function initialize() {
    const music = document.getElementById('music');
    const local = window.NhipMusic;
    if (!music || !local || document.getElementById('youtube-music-root')) return;
    const panel = document.createElement('section');
    panel.id = 'youtube-music-root';
    panel.className = 'youtube-music-panel';
    panel.setAttribute('aria-labelledby', 'youtube-music-title');
    panel.innerHTML = `<div class="youtube-heading"><div><span class="music-eyebrow">ÂM NHẠC CHO BUỔI TẬP</span><h2 id="youtube-music-title">Bật nhạc. Vào nhịp.</h2></div><span class="youtube-source-badge">YouTube Mix · ${TRACKS.length} bài</span></div>
      <div class="youtube-cinema-layout"><div class="youtube-main-stage"><div class="youtube-screen"><div class="youtube-preview" id="youtube-preview"><img class="youtube-cover" src="assets/music/youtube-mix-cover.jpg" alt="Ảnh bìa bài Hai chúng ta không có ngày chia tay của DJ BIN BIN"><div class="youtube-cover-shade"></div><span class="youtube-preview-tag">DANH SÁCH BẠN ĐÃ CHỌN</span><button type="button" class="youtube-cover-play" data-youtube-action="open" aria-label="Mở trình phát YouTube">${icon('play')}</button><div class="youtube-preview-caption"><span>DJ BIN BIN</span><strong>HAI CHÚNG TA KHÔNG CÓ NGÀY CHIA TAY</strong><small>Bấm phát để mở YouTube Mix</small></div></div><div class="youtube-frame-wrapper" id="youtube-frame-wrapper" hidden></div></div>
      <div class="youtube-bottom-bar"><div class="youtube-now-copy"><span id="youtube-now-author">DJ BIN BIN</span><h3 id="youtube-now-title">${escape(TRACKS[0].title)}</h3></div><div class="youtube-controls" id="youtube-controls"><button type="button" class="music-control" data-youtube-action="previous" aria-label="Bài YouTube trước">${icon('previous')}</button><button type="button" class="music-control music-play" data-youtube-action="toggle" aria-label="Phát nhạc YouTube">${icon('play')}</button><button type="button" class="music-control" data-youtube-action="next" aria-label="Bài YouTube tiếp theo">${icon('next')}</button><button type="button" class="music-control" data-youtube-action="expand" aria-label="Mở rộng khung nhạc" aria-pressed="false">${icon('expand')}</button><button type="button" class="music-control youtube-close" data-youtube-action="close" aria-label="Đóng trình phát YouTube" hidden>${icon('close')}</button></div></div><p id="youtube-status" class="youtube-status" role="status" aria-live="polite">Chọn Phát để nghe nhạc. Bạn vẫn có thể dùng đồng hồ trong lúc nghe.</p></div>
      <aside class="youtube-queue" aria-label="Danh sách YouTube Mix"><div class="youtube-queue-heading"><h3>Tiếp theo</h3><span>${TRACKS.length} bài trong Mix</span></div><div class="youtube-track-list" role="list" aria-label="Các bài ghi nhận từ danh sách Mix">${TRACKS.map((track, index) => `<div class="youtube-track-entry" role="listitem"><button type="button" class="youtube-track" data-youtube-track="${index}" aria-label="Phát ${escape(track.title)}"><span class="youtube-track-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${escape(track.title)}</strong><small>${escape(track.author)}</small></span>${icon('play')}</button></div>`).join('')}</div></aside></div>
      <div class="youtube-source-footer"><a class="youtube-original-link" href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">Mở danh sách gốc trên YouTube${icon('external')}</a><p class="youtube-list-note">YouTube Mix có thể thay đổi theo người nghe. Danh sách 25 bài được ghi nhận ngày 26/10/2026.</p></div>`;
    music.setAttribute('aria-labelledby', 'youtube-music-title');
    const localCard = document.createElement('section');
    localCard.className = 'card local-music-card';
    localCard.setAttribute('aria-label', 'Nhạc trên thiết bị');
    const localDetails = document.createElement('details');
    localDetails.className = 'local-music-details';
    localDetails.open = true;
    localDetails.innerHTML = '<summary><span>NHẠC CỦA BẠN</span>Nghe từ thiết bị<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>';
    localDetails.append(document.getElementById('music-player-root'));
    localCard.append(localDetails);
    music.parentElement.append(localCard);
    music.append(panel);
    const $ = selector => panel.querySelector(selector);
    const status = message => { $('#youtube-status').textContent = message; };
    let source = 'local';
    let selectedIndex = 0;
    let player = null;
    let playerReady = false;
    let youtubePlaying = false;
    let requestedPlay = false;
    let apiPromise = null;
    let playerVersion = 0;
    let fallbackTimer = null;
    const ownState = () => ({ playing: youtubePlaying, title: `YouTube · ${TRACKS[selectedIndex].title}`, hasTracks: true, source: 'youtube' });
    const combinedState = () => source === 'youtube' ? ownState() : { ...local.getState(), source: 'local' };
    const emit = () => document.dispatchEvent(new CustomEvent('nhipmusic:state', { detail: combinedState() }));
    function render() {
      panel.classList.toggle('youtube-is-playing', youtubePlaying);
      $('#youtube-now-title').textContent = TRACKS[selectedIndex].title;
      $('#youtube-now-author').textContent = TRACKS[selectedIndex].author;
      const track = TRACKS[selectedIndex];
      const cover = $('.youtube-cover');
      const coverSource = selectedIndex === 0 ? 'assets/music/youtube-mix-cover.jpg' : `assets/music/${track.id}.jpg`;
      if (cover.getAttribute('src') !== coverSource) cover.src = coverSource;
      cover.alt = `Ảnh bìa bài ${track.title}`;
      $('.youtube-preview-caption>span').textContent = track.author;
      $('.youtube-preview-caption>strong').textContent = track.title;
      panel.querySelectorAll('[data-youtube-track]').forEach(button => {
        const active = Number(button.dataset.youtubeTrack) === selectedIndex;
        button.classList.toggle('is-current', active);
        if (active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
      });
      const toggle = $('[data-youtube-action="toggle"]');
      toggle.innerHTML = icon(youtubePlaying ? 'pause' : 'play');
      toggle.setAttribute('aria-label', youtubePlaying ? 'Tạm dừng nhạc YouTube' : 'Phát nhạc YouTube');
      toggle.setAttribute('aria-pressed', String(youtubePlaying));
    }
    function loadAPI() {
      if (window.YT?.Player) return Promise.resolve(window.YT);
      if (apiPromise) return apiPromise;
      apiPromise = new Promise((resolve, reject) => {
        const previous = window.onYouTubeIframeAPIReady;
        const timeout = setTimeout(() => reject(new Error('timeout')), 15000);
        window.onYouTubeIframeAPIReady = () => {
          try { if (typeof previous === 'function') previous(); } catch { /* Preserve an unrelated callback without blocking this player. */ }
          clearTimeout(timeout);
          if (window.YT?.Player) resolve(window.YT); else reject(new Error('unavailable'));
        };
        let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          document.head.append(script);
        }
        script.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('network')); }, { once: true });
      });
      return apiPromise;
    }
    function syncTrackFromPlayer() {
      try {
        const id = player?.getVideoData?.().video_id;
        const index = TRACKS.findIndex(track => track.id === id);
        if (index >= 0) selectedIndex = index;
      } catch { /* Metadata can arrive after the first state event. */ }
    }
    function pauseYouTube() {
      requestedPlay = false;
      try { player?.pauseVideo?.(); } catch { /* The native player remains available. */ }
    }
    function unavailableMessage(code) {
      if ([101, 150].includes(code)) return 'Bài này không cho phát nhúng. Bạn có thể chọn bài khác hoặc mở danh sách trên YouTube.';
      if ([100, 153].includes(code)) return 'YouTube chưa cho phát bài này tại đây. Hãy chọn bài khác hoặc mở danh sách gốc trên YouTube.';
      return 'Không kết nối được trình phát YouTube. Bạn vẫn có thể mở danh sách gốc bằng liên kết bên dưới.';
    }
    function embedURL(index) {
      const url = new URL(`https://www.youtube.com/embed/${TRACKS[index].id}`);
      url.searchParams.set('enablejsapi', '1');
      url.searchParams.set('playsinline', '1');
      url.searchParams.set('controls', '1');
      url.searchParams.set('hl', 'vi');
      url.searchParams.set('rel', '0');
      // Native controls keep the observed queue available if the JavaScript API is blocked.
      url.searchParams.set('playlist', TRACKS.slice(index).concat(TRACKS.slice(0, index)).map(track => track.id).join(','));
      if (/^https?:$/.test(location.protocol)) url.searchParams.set('origin', location.origin);
      return url.href;
    }
    async function ensurePlayer(autoplay = false) {
      source = 'youtube';
      requestedPlay = autoplay;
      local.pause();
      render(); emit();
      if (playerReady && player) {
        if (autoplay) { try { player.playVideoAt(selectedIndex); } catch { status('Bấm Phát trong khung YouTube để nghe bài đã chọn.'); } }
        return;
      }
      if ($('#youtube-player')) { status('Bấm Phát trong khung YouTube để nghe bài đã chọn.'); return; }
      const version = ++playerVersion;
      const frame = document.createElement('iframe');
      frame.id = 'youtube-player';
      frame.title = 'Danh sách Mix YouTube của bạn';
      frame.src = embedURL(selectedIndex);
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.width = '640'; frame.height = '360';
      $('#youtube-frame-wrapper').replaceChildren(frame);
      $('#youtube-frame-wrapper').hidden = false;
      $('[data-youtube-action="close"]').hidden = false;
      $('#youtube-preview').hidden = true;
      status('Đang kết nối YouTube. Khi khung phát hiện ra, bạn có thể bấm Phát để nghe.');
      fallbackTimer = setTimeout(() => {
        if (version === playerVersion && !playerReady) status('Nếu khung phát không hoạt động, hãy mở danh sách gốc trên YouTube ở bên dưới.');
      }, 18000);
      try {
        const api = await loadAPI();
        if (version !== playerVersion || !$('#youtube-player')) return;
        player = new api.Player(frame, {
          events: {
            onReady: () => {
              if (version !== playerVersion) return;
              playerReady = true;
              clearTimeout(fallbackTimer);
              try { player.cuePlaylist(TRACKS.map(track => track.id), selectedIndex, 0); } catch { /* Native embed still has the observed queue. */ }
              status('Sẵn sàng. Bấm Phát để nghe; danh sách gốc luôn có ở bên dưới.');
              if (requestedPlay) { try { player.playVideo(); } catch { status('Bấm Phát trong khung YouTube để bắt đầu.'); } }
            },
            onStateChange: event => {
              if (version !== playerVersion) return;
              syncTrackFromPlayer();
              youtubePlaying = event.data === 1;
              if (youtubePlaying) { source = 'youtube'; local.pause(); status(`Đang phát: ${TRACKS[selectedIndex].title}`); }
              else if (event.data === 2) status('Đã tạm dừng nhạc YouTube.');
              else if (event.data === 0) status('Bài đã kết thúc. YouTube sẽ chuyển bài khi danh sách cho phép.');
              render(); emit();
            },
            onError: event => {
              if (version !== playerVersion) return;
              youtubePlaying = false; requestedPlay = false;
              status(unavailableMessage(Number(event.data))); render(); emit();
            },
            onAutoplayBlocked: () => { requestedPlay = false; youtubePlaying = false; status('Bấm Phát ngay trong khung YouTube để cho phép phát nhạc.'); render(); emit(); },
          },
        });
      } catch {
        if (version === playerVersion) status('Bạn có thể dùng nút Phát trong khung YouTube. Nếu không phát được, hãy mở danh sách gốc bên dưới.');
      }
    }
    function closePlayer() {
      ++playerVersion; clearTimeout(fallbackTimer);
      requestedPlay = false; youtubePlaying = false; playerReady = false;
      try { player?.destroy?.(); } catch { /* Remove the iframe below even if API cleanup fails. */ }
      player = null;
      $('#youtube-frame-wrapper').replaceChildren();
      $('#youtube-frame-wrapper').hidden = true;
      $('[data-youtube-action="close"]').hidden = true;
      $('#youtube-preview').hidden = false;
      $('[data-youtube-action="toggle"]').focus({ preventScroll: true });
      source = 'local';
      status('Đã đóng trình phát YouTube. Bạn vẫn có thể chọn bài hoặc mở danh sách gốc.');
      render(); emit();
    }
    async function selectTrack(index, autoplay = true) {
      if (!Number.isInteger(index) || index < 0 || index >= TRACKS.length) return;
      selectedIndex = index;
      source = 'youtube';
      local.pause();
      if (playerReady && player) {
        requestedPlay = autoplay;
        try { if (autoplay) player.playVideoAt(index); else player.cuePlaylist(TRACKS.map(track => track.id), index, 0); }
        catch { status('Bấm Phát trong khung YouTube để nghe bài đã chọn.'); }
      } else if ($('#youtube-player')) {
        // A blocked API should not make selecting another observed video unusable.
        $('#youtube-player').src = embedURL(index);
        requestedPlay = autoplay;
        status('Đã chọn bài. Bấm Phát trong khung YouTube để nghe.');
      } else await ensurePlayer(autoplay);
      render(); emit();
    }
    function toggleYouTube() {
      if (!playerReady || !player) { ensurePlayer(true); return; }
      if (youtubePlaying) pauseYouTube();
      else { source = 'youtube'; local.pause(); requestedPlay = true; try { player.playVideo(); } catch { status('Bấm Phát trong khung YouTube để nghe.'); } }
    }
    function nextYouTube(direction = 1) {
      const index = (selectedIndex + direction + TRACKS.length) % TRACKS.length;
      selectTrack(index, youtubePlaying);
    }
    panel.addEventListener('click', event => {
      const track = event.target.closest('[data-youtube-track]');
      if (track) { selectTrack(Number(track.dataset.youtubeTrack), true); return; }
      const action = event.target.closest('[data-youtube-action]')?.dataset.youtubeAction;
      if (action === 'open') ensurePlayer(false);
      if (action === 'toggle') toggleYouTube();
      if (action === 'next') nextYouTube(1);
      if (action === 'previous') nextYouTube(-1);
      if (action === 'close') closePlayer();
      if (action === 'expand') {
        const expanded = panel.classList.toggle('youtube-theater');
        const button = $('[data-youtube-action="expand"]');
        button.setAttribute('aria-pressed', String(expanded));
        button.setAttribute('aria-label', expanded ? 'Thu gọn khung nhạc' : 'Mở rộng khung nhạc');
      }
    });
    document.addEventListener('nhipmusic:localrequest', () => {
      source = 'local'; pauseYouTube(); emit();
    });
    document.addEventListener('nhipmusic:state', event => {
      if (event.detail?.source) return;
      if (event.detail?.playing) { source = 'local'; pauseYouTube(); }
      if (source === 'youtube') emit();
    });
    window.NhipMusic = {
      toggle() { if (source === 'youtube') toggleYouTube(); else local.toggle(); },
      next() { if (source === 'youtube') nextYouTube(1); else local.next(); },
      pause() { local.pause(); pauseYouTube(); },
      getState: combinedState,
    };
    window.NhipYouTube = {
      open: () => ensurePlayer(false),
      pause: pauseYouTube,
      close: closePlayer,
      select: selectTrack,
      getState: () => ({ source, ready: playerReady, playing: youtubePlaying, selectedIndex, title: TRACKS[selectedIndex].title, count: TRACKS.length, sourceUrl: SOURCE_URL }),
    };
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true }); else initialize();
})();
