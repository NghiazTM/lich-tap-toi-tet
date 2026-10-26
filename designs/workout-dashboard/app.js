(() => {
  'use strict';
  const STORAGE_KEY = 'nhip-tap-plan-v1';
  const WEEKDAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
  const SHORT_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  // Display built-in legacy wording consistently without rewriting saved records.
  const legacyPlanTitles = new Map([
    ['Nghỉ & hồi phục', 'Nghỉ và phục hồi'],
    ['Sức mạnh & kiểm soát', 'Sức mạnh và kiểm soát'],
    ['Đi dạo & vận động nhẹ', 'Đi dạo và vận động nhẹ'],
  ]);
  const displayPlanTitle = (title) => legacyPlanTitles.get(title) || title;
  const displaySourceNote = (item) => item?.note?.replace(/slide lịch/g, 'khung lịch') || '';
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = (name, className = '') => `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const number = (value) => new Intl.NumberFormat('vi-VN').format(value);
  const uid = () => globalThis.crypto?.randomUUID?.() || `ex-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  // Visual guides are independent of saved workouts and only match known names.
  const VIDEO_FRAME = { width: 848, height: 1508, x: 0, y: 515, cropWidth: 848, cropHeight: 478 };
  const GUIDES = [
    { key: 'bottom-pushup', group: '01', name: 'Đáy chống đẩy', names: ['Đáy chống đẩy'], time: '01:30', file: 'bottom-pushup.png', frame: VIDEO_FRAME, variant: 'Giữ ở vị trí thấp khi chống đẩy', cues: ['Giữ thân người thành một đường thẳng, không để lưng bị võng.', 'Hạ người đến vị trí bạn kiểm soát được rồi giữ nguyên tư thế.', 'Thở đều; đau khớp thì dừng, không cố xuống sâu.'] },
    { key: 'deep-lunge', group: '02', name: 'Chùng chân sâu', names: ['Chùng chân sâu'], time: '02:40', file: 'deep-lunge.png', frame: VIDEO_FRAME, variant: 'Biến thể có ghế hỗ trợ', cues: ['Bước tách hai chân, hạ người vào tư thế chùng chân.', 'Có thể vịn ghế chắc chắn như hình để giữ thăng bằng.', 'Giữ tư thế trong tầm kiểm soát rồi đổi bên. Thời gian được tính cho từng bên.'] },
    { key: 'wall-press', group: '03A', name: 'Vượt lực cản · Đẩy tường', names: ['Vượt lực cản · Đẩy tường', 'Đẩy tường'], time: '12:40', file: 'wall-press.png', frame: null, supplemental: true, variant: 'Giữ lực đẩy vào tường', cues: ['Đặt hai tay lên tường vững chắc, giữ tư thế ổn định.', 'Tạo lực đẩy trong khi thân người vẫn đứng yên.', 'Điều chỉnh lực theo khả năng, tiếp tục thở đều và không nín thở.'] },
    { key: 'towel-pull', group: '03B', name: 'Vượt lực cản · Kéo khăn đứng', names: ['Vượt lực cản · Kéo khăn đứng', 'Kéo khăn đứng'], time: '04:10', file: 'towel-pull.png', frame: VIDEO_FRAME, variant: 'Tạo lực kéo tĩnh với khăn', cues: ['Dùng khăn chắc chắn, đặt chân giữ khăn như trong hình.', 'Giữ khuỷu tay gần thân, tạo lực kéo mà không giật khăn.', 'Giữ thân ổn định, không nín thở hoặc gồng đến đau.'] },
    { key: 'hollow-hold', group: '04', name: 'Thân rỗng', names: ['Thân rỗng'], time: '05:45', file: 'hollow-hold.png', frame: VIDEO_FRAME, variant: 'Biến thể dễ hơn: co gối, đưa tay về ngực', cues: ['Nằm ngửa, co gối và đưa tay về phía ngực như hình.', 'Nhấc nhẹ vai, giữ thân người ổn định và không ưỡn lưng.', 'Thở đều; giảm thời gian hoặc thả xuống khi không còn giữ được tư thế.'] },
    { key: 'wall-handstand', group: '05', name: 'Trồng chuối dựa tường', names: ['Trồng chuối dựa tường'], time: '06:40', file: 'wall-handstand.png', frame: VIDEO_FRAME, advanced: true, variant: 'Tư thế nâng cao · có tường hỗ trợ', cues: ['Chỉ chọn bài này khi bạn đã kiểm soát được tư thế trồng chuối.', 'Trong hình: tay duỗi thẳng, vai sát mang tai, tường hỗ trợ giữ thăng bằng.', 'Không cố vào tư thế khi chưa kiểm soát được. Bạn có thể chỉnh sửa hoặc bỏ bài trong lịch.'] },
    { key: 'l-sit', group: '06', name: 'L-sit', names: ['L-sit'], time: '08:20', file: 'l-sit.png', frame: VIDEO_FRAME, variant: 'Biến thể dễ hơn: chống tay lên ghế, co gối', cues: ['Dùng điểm tựa chắc chắn như ghế trong hình; giữ hai tay ổn định.', 'Co gối, giữ chân nhấc lên trong tầm bạn kiểm soát được.', 'Đây là biến thể co gối, không phải L-sit duỗi thẳng chân.'] },
  ];
  const normalizeName = (name) => String(name).normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
  const guideFor = (item) => GUIDES.find((guide) => guide.names.some((name) => normalizeName(name) === normalizeName(item.name)));
  function renderGuideImage(guide, lazy = false) {
    const frame = guide.frame;
    const style = frame ? `aspect-ratio:${frame.cropWidth}/${frame.cropHeight}` : 'aspect-ratio:16/9';
    const imageStyle = frame ? `width:${frame.width / frame.cropWidth * 100}%;left:${-frame.x / frame.cropWidth * 100}%;top:${-frame.y / frame.cropHeight * 100}%` : '';
    return `<span class="guide-image ${frame ? 'source-frame' : 'natural-frame'}" style="${style}"><img src="assets/exercises/${guide.file}" alt="${escape(guide.name)} — ${escape(guide.variant)}" ${lazy ? 'loading="lazy"' : ''} decoding="async" ${frame ? `width="${frame.width}" height="${frame.height}"` : ''} style="${imageStyle}"><span class="image-unavailable">Không tải được hình minh họa</span></span>`;
  }
  function renderExerciseVisual(item, index) {
    const guide = guideFor(item);
    return guide ? `<button class="exercise-art-button" data-action="visual-guide" data-guide="${guide.key}" aria-label="Xem hình minh họa và hướng dẫn bài ${escape(item.name)}">${renderGuideImage(guide, true)}<span class="art-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span class="art-expand" aria-hidden="true">${icon('arrow')}</span></button>` : `<span class="custom-exercise-art"><span>${String(index + 1).padStart(2, '0')}</span><small>Bài tự thêm<br>Chưa có ảnh</small></span>`;
  }
  const bangkokParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (name) => bangkokParts.find((item) => item.type === name).value;
  const TODAY = `${part('year')}-${part('month')}-${part('day')}`;
  const asDate = (key) => new Date(`${key}T12:00:00Z`);
  const dateKey = (date) => date.toISOString().slice(0, 10);
  const addDays = (key, count) => { const date = asDate(key); date.setUTCDate(date.getUTCDate() + count); return dateKey(date); };
  const dayIndex = (key) => (asDate(key).getUTCDay() + 6) % 7;
  const monday = (key) => addDays(key, -dayIndex(key));
  const formatDate = (key, options = {}) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', ...options }).format(asDate(key));
  const exercise = (id, name, focus, sets, hold, rest, note = '') => ({ id, name, focus, sets, hold, rest, note });
  const mondayExercises = () => [
    exercise('bottom-pushup', 'Đáy chống đẩy', 'Ngực · vai · tay sau', 4, 25, 60, 'Theo video: 4 hiệp × 20–30 giây, mức gắng sức khoảng 7/10. Nghỉ 60 giây là gợi ý thêm.'),
    exercise('deep-lunge', 'Chùng chân sâu', 'Đùi trước · mông · mỗi bên', 4, 25, 60, 'Theo video: 4 hiệp × 20–30 giây mỗi bên. Có thể dùng ghế chắc chắn để hỗ trợ. Chọn độ sâu bạn kiểm soát được.'),
    exercise('l-sit', 'L-sit', 'Bụng · cơ gập hông', 4, 25, 60, 'Biến thể dễ hơn trong video: chống tay lên ghế chắc chắn, co gối.'),
  ];
  const wednesdayExercises = () => [
    exercise('wall-press', 'Vượt lực cản · Đẩy tường', 'Vai · ngực · giữ lực đẩy', 5, 4, 60, 'Video: 5 hiệp × 3–5 giây với lực tối đa. Hãy tự chỉnh mức lực phù hợp, giữ nhịp thở; không cần cố theo mức tối đa.'),
    exercise('towel-pull', 'Vượt lực cản · Kéo khăn đứng', 'Tay trước · lực kéo tĩnh', 5, 4, 60, 'Video: 5 hiệp × 3–5 giây. Dùng khăn chắc chắn, tạo lực phù hợp với khả năng và không nín thở.'),
    exercise('hollow-hold', 'Thân rỗng', 'Bụng · giữ thân người', 2, 15, 60, '2 hiệp × 15 giây là gợi ý của ứng dụng, không được ghi trong khung lịch tuần. Biến thể dễ: co gối, đưa tay về ngực.'),
    exercise('wall-handstand', 'Trồng chuối dựa tường', 'Nâng cao · vai · kiểm soát thân', 2, 10, 60, 'Động tác nâng cao. Chỉ tập nếu bạn đã kiểm soát được tư thế; có thể sửa hoặc bỏ bài. 2 hiệp × 10 giây là gợi ý thêm, không phải thông số trong khung lịch.'),
  ];
  const defaultTemplates = () => [
    { training: true, title: 'Giữ tĩnh toàn thân', exercises: mondayExercises() },
    { training: false, title: 'Nghỉ và phục hồi', exercises: [] },
    { training: true, title: 'Sức mạnh và kiểm soát', exercises: wednesdayExercises() },
    { training: false, title: 'Nghỉ và phục hồi', exercises: [] },
    { training: true, title: 'Giữ tĩnh toàn thân', exercises: mondayExercises() },
    { training: false, title: 'Đi dạo và vận động nhẹ', exercises: [] },
    { training: false, title: 'Nghỉ ngơi trọn vẹn', exercises: [] },
  ];
  const defaults = () => ({ version: 1, templates: defaultTemplates(), records: {}, waterGoal: 2000 });
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const text = (value, limit) => typeof value === 'string' && value.trim() && value.length <= limit;
  const validStoredExercise = (item) => item && text(item.id, 100) && text(item.name, 90) && typeof item.focus === 'string' && item.focus.length <= 100 && integer(item.sets, 1, 10) && integer(item.hold, 1, 300) && integer(item.rest, 5, 600);
  const validDay = (day) => day && typeof day.training === 'boolean' && text(day.title, 70) && Array.isArray(day.exercises) && day.exercises.length <= 30 && day.exercises.every(validStoredExercise) && new Set(day.exercises.map((item) => item.id)).size === day.exercises.length;
  const copyDay = (day) => ({ training: day.training, title: day.title, exercises: day.exercises.map((item) => ({ id: item.id, name: item.name, focus: item.focus, sets: item.sets, hold: item.hold, rest: item.rest, note: typeof item.note === 'string' ? item.note.slice(0, 600) : '' })) });
  let storageWarning = '';
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults();
      const stored = JSON.parse(raw);
      if (stored?.version !== 1 || !Array.isArray(stored.templates) || stored.templates.length !== 7 || !stored.templates.every(validDay)) throw new Error('invalid-data');
      const clean = defaults();
      clean.templates = stored.templates.map(copyDay);
      if (stored.records && typeof stored.records === 'object' && !Array.isArray(stored.records)) {
        Object.entries(stored.records).forEach(([key, value]) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(asDate(key).getTime()) && value && typeof value === 'object') {
            clean.records[key] = { checked: Array.isArray(value.checked) ? [...new Set(value.checked.filter((id) => typeof id === 'string' && id.length <= 100))].slice(0, 30) : [], finished: value.finished === true, water: integer(value.water, 0, 20000) ? value.water : 0 };
            if (validDay(value.session)) clean.records[key].session = copyDay(value.session);
          }
        });
      }
      if (integer(stored.waterGoal, 250, 6000) && stored.waterGoal % 250 === 0) clean.waterGoal = stored.waterGoal;
      return clean;
    } catch (error) {
      storageWarning = error.message === 'invalid-data' || error instanceof SyntaxError ? 'Dữ liệu đã lưu không hợp lệ. Ứng dụng đang dùng lịch mặc định.' : 'Trình duyệt chưa cho phép lưu dữ liệu. Bạn vẫn có thể tập và tải dữ liệu dự phòng.';
      return defaults();
    }
  };
  let data = load();
  let selected = TODAY;
  let week = monday(TODAY);
  let toastTimeout;
  const toast = (message) => { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 4200); };
  let storageWarned = false;
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { if (!storageWarned) { toast('Chưa lưu được dữ liệu trên trình duyệt. Hãy tải một bản sao dự phòng.'); storageWarned = true; } }
  };
  const template = (key = selected) => data.records[key]?.session || data.templates[dayIndex(key)];
  const record = (key = selected) => data.records[key] || { checked: [], finished: false, water: 0 };
  const writableRecord = (key = selected) => data.records[key] ||= { checked: [], finished: false, water: 0 };
  // Freeze logged sessions before changing a recurring template, preserving history.
  const preserveRecordedSessions = () => Object.entries(data.records).forEach(([key, item]) => {
    if (!item.session && (item.checked.length || item.finished)) item.session = copyDay(data.templates[dayIndex(key)]);
  });
  const editableSession = () => {
    preserveRecordedSessions();
    const item = writableRecord();
    item.session ||= copyDay(data.templates[dayIndex(selected)]);
    return item.session;
  };
  const updateRecurringTemplate = () => {
    if (selected >= TODAY) data.templates[dayIndex(selected)] = copyDay(template());
  };
  const checkedCount = (key) => template(key).exercises.filter((item) => record(key).checked.includes(item.id)).length;
  const isFinished = (key) => template(key).training && template(key).exercises.length > 0 && record(key).finished && checkedCount(key) === template(key).exercises.length;
  const weekDates = () => Array.from({ length: 7 }, (_, index) => addDays(week, index));

  function renderWeek() {
    const end = addDays(week, 6);
    $('#week-label').textContent = `${formatDate(week, { day: 'numeric', month: 'long' })} – ${formatDate(end, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    $('#today-label').textContent = formatDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' });
    $('#week-days').innerHTML = weekDates().map((key, index) => {
      const day = template(key);
      const exerciseNames = day.training ? day.exercises.slice(0, 2).map(item => `<span>${escape(item.name)}</span>`).join('') : `<span>${index === 5 ? 'Đi dạo hoặc chơi thể thao' : 'Để cơ thể phục hồi'}</span>`;
      return `<button class="day-button ${key === selected ? 'selected' : ''} ${day.training ? '' : 'is-rest'} ${key === TODAY ? 'is-today' : ''}" data-date="${key}" aria-pressed="${key === selected}" aria-label="${escape(WEEKDAYS[index])}, ${escape(formatDate(key, { day: 'numeric', month: 'long' }))}, ${escape(displayPlanTitle(day.title))}${isFinished(key) ? ', đã hoàn thành' : ''}"><span class="day-top"><span class="day-name">${WEEKDAYS[index]}</span><span class="day-number">${asDate(key).getUTCDate().toString().padStart(2, '0')}</span></span><span class="day-session"><i class="day-dot"></i>${day.training ? 'Tập luyện' : index === 5 ? 'Vận động nhẹ' : 'Phục hồi'}</span><strong class="day-title">${escape(displayPlanTitle(day.title))}</strong><span class="day-exercises">${exerciseNames}</span><span class="day-footer">${day.training ? `${checkedCount(key)}/${day.exercises.length} bài hoàn thành` : 'Ngày thả lỏng'}${isFinished(key) ? icon('check') : icon('arrow')}</span>${key === TODAY ? '<span class="today-tag">Hôm nay</span>' : ''}</button>`;
    }).join('');
    $('.nav-count').textContent = data.templates.filter((day) => day.training).length;
  }

  function renderChart() {
    const dates = weekDates();
    const largestCount = Math.max(4, ...dates.map((key) => template(key).training ? template(key).exercises.length : 0));
    const step = Math.max(1, Math.ceil(largestCount / 4));
    const max = step * 4;
    const axis = [4, 3, 2, 1, 0].map((tick) => tick * step);
    $('#weekly-chart').innerHTML = `<div class="chart-grid" aria-hidden="true">${axis.map((value) => `<div class="grid-line"><span>${value}</span></div>`).join('')}</div><div class="chart-columns">${dates.map((key, index) => {
      const planned = template(key).training ? template(key).exercises.length : 0;
      const done = template(key).training ? checkedCount(key) : 0;
      return `<button class="chart-column ${selected === key ? 'selected' : ''}" data-date="${key}" aria-label="${WEEKDAYS[index]}: hoàn thành ${done} trên ${planned} bài" aria-pressed="${selected === key}"><span class="bar-count" aria-hidden="true">${done}/${planned}</span><span class="bar-area" aria-hidden="true"><span class="bar-plan" style="height:${planned / max * 100}%"></span><span class="bar-actual" style="height:${done / max * 100}%"></span></span><span class="bar-label">${SHORT_DAYS[index]}</span></button>`;
    }).join('')}</div>`;
    const total = dates.reduce((sum, key) => sum + (template(key).training ? checkedCount(key) : 0), 0);
    $('#chart-message').textContent = total ? `Bạn đã hoàn thành ${total} bài trong tuần. Mỗi bài tập là một bước tiến.` : 'Bắt đầu từ một bài tập. Tiến độ của bạn sẽ xuất hiện tại đây.';
  }

  function renderProgress() {
    const planned = weekDates().filter((key) => template(key).training && template(key).exercises.length).length;
    const finished = weekDates().filter(isFinished).length;
    const percent = planned ? Math.round(finished / planned * 100) : 0;
    $('#week-progress').innerHTML = `${finished}<span>/${planned}</span>`;
    $('#progress-percent').textContent = `${percent}%`;
    $('#overview-planned').textContent = `${planned} buổi`;
    $('#overview-finished').textContent = `${finished}/${planned}`;
    $('#overview-exercises').textContent = `${weekDates().reduce((sum, key) => sum + (template(key).training ? checkedCount(key) : 0), 0)} bài`;
    $('#ring-fill').style.strokeDashoffset = 414.7 * (1 - percent / 100);
    $('#progress-bar').style.width = `${percent}%`;
    $('#progress-caption').textContent = finished === planned && planned ? 'Một tuần giữ trọn nhịp tập!' : finished ? 'Bạn đang giữ nhịp rất tốt.' : planned ? 'Tuần mới, khởi đầu mới.' : 'Chọn ngày tập để bắt đầu.';
  }

  function renderSession() {
    const day = template();
    const count = checkedCount(selected);
    $('#session-date').textContent = `${selected === TODAY ? 'HÔM NAY' : WEEKDAYS[dayIndex(selected)].toLocaleUpperCase('vi-VN')} · ${formatDate(selected, { day: 'numeric', month: 'long' }).toLocaleUpperCase('vi-VN')}`;
    $('#exercise-title').textContent = displayPlanTitle(day.title);
    $('#session-type').textContent = day.training ? 'Tại nhà · Không cần tạ' : 'Nạp lại năng lượng';
    if (!day.training) {
      window.NhipTimer?.setExercises([], selected);
      const saturday = dayIndex(selected) === 5;
      $('#session-content').innerHTML = `<div class="empty-session"><span class="rest-icon">${icon(saturday ? 'sun' : 'leaf')}</span><h3>${saturday ? 'Vận động theo cách bạn thích.' : 'Nghỉ ngơi cũng là một phần của quá trình tiến bộ.'}</h3><p>${saturday ? 'Theo lịch video: đi dạo hoặc chơi thể thao phù hợp. Hôm nay không có buổi tập giữ tĩnh trong lịch.' : 'Cho cơ thể thời gian phục hồi. Đi lại nhẹ nhàng nếu bạn muốn, ăn đủ và dành thời gian nghỉ.'}</p><button class="button" data-action="settings">Tùy chỉnh lịch tập${icon('arrow')}</button></div>`;
      return;
    }
    const holds = day.exercises.reduce((sum, item) => sum + item.sets * item.hold * (/mỗi bên/i.test(item.focus) ? 2 : 1), 0);
    const minutes = Math.max(1, Math.round(holds / 60));
    $('#session-content').innerHTML = `<div class="session-meta"><span>${icon('dumbbell')}${day.exercises.length} bài tập</span><span>${icon('clock')}~${minutes} phút giữ tư thế</span><span class="session-hint">${count}/${day.exercises.length} bài hoàn thành</span></div><p class="session-guide">Giữ tư thế đúng, thở đều. Thời gian nghỉ là gợi ý và có thể điều chỉnh.</p><div class="exercise-list">${day.exercises.map((item, index) => `<div class="exercise-row ${record().checked.includes(item.id) ? 'is-done' : ''}"><label class="exercise-check-target"><input class="exercise-checkbox" type="checkbox" data-exercise="${escape(item.id)}" ${record().checked.includes(item.id) ? 'checked' : ''} aria-label="Hoàn thành ${escape(item.name)}"></label>${renderExerciseVisual(item, index)}<div><div class="exercise-name">${escape(item.name)}</div><div class="exercise-focus">${escape(item.focus)}</div></div><div class="exercise-prescription">${item.sets} × ${item.hold} giây<span>Nghỉ ${item.rest} giây (gợi ý)</span></div><button class="edit-exercise" data-action="edit-exercise" data-id="${escape(item.id)}" aria-label="Chỉnh sửa bài ${escape(item.name)}">${icon('edit')}</button></div>`).join('')}</div><button class="add-exercise" data-action="add-exercise">${icon('plus')}Thêm bài tập</button>${day.exercises.length ? `<div class="timer-bridge"><span class="bridge-icon">${icon('clock')}</span><div><strong>Tập và nghỉ theo bài</strong><span>Giữ trọn nhịp bằng đồng hồ tự động.</span></div><select id="bridge-exercise" aria-label="Chọn bài để mở đồng hồ">${day.exercises.map((item,index)=>`<option value="${escape(item.id)}">${index+1}. ${escape(item.name)}</option>`).join('')}</select><button class="button" data-action="use-exercise-timer">Mở đồng hồ${icon('arrow')}</button></div>` : ''}<div class="session-actions">${isFinished(selected) ? `<div class="session-complete">${icon('check')}Đã hoàn thành buổi tập và lưu kết quả.</div>` : `<span class="completion-hint">${count === day.exercises.length && day.exercises.length ? 'Sẵn sàng lưu buổi tập!' : 'Đánh dấu sau khi hoàn thành đủ hiệp.'}</span><button class="button primary" data-action="finish-session" ${count === day.exercises.length && day.exercises.length ? '' : 'disabled'}>Hoàn thành buổi tập${icon('check')}</button>`}</div>`;
    window.NhipTimer?.setExercises(day.exercises, selected);
  }

  function renderWater() {
    const water = record().water;
    const ratio = water / data.waterGoal;
    $('#water-goal-button').textContent = `Mục tiêu: ${number(data.waterGoal / 1000)} L`;
    $('#water-value').textContent = `${number(water)} / ${number(data.waterGoal)} mL`;
    $('#water-dots').innerHTML = Array.from({ length: 8 }, (_, index) => `<span class="water-dot ${ratio >= (index + 1) / 8 ? 'filled' : ''}"></span>`).join('');
    $('[data-action="water-minus"]').disabled = water === 0;
    $('[data-action="water-plus"]').disabled = water >= 20000;
  }
  function renderAll() { renderWeek(); renderChart(); renderProgress(); renderSession(); renderWater(); }
  function selectDate(key) { selected = key; renderAll(); }
  function openDialog(selector) { $(selector).showModal(); }
  let visualOpener = null;
  function showVisualDialog() {
    const dialog = $('#visual-dialog');
    if (!dialog.open) { visualOpener = document.activeElement; dialog.showModal(); }
    dialog.scrollTop = 0;
  }
  function openVisualLibrary() {
    const returning = $('#visual-dialog').open;
    $('#visual-eyebrow').textContent = 'HIỂU TƯ THẾ · TẬP ĐÚNG NHỊP';
    $('#visual-title').textContent = 'Thư viện tư thế';
    $('#visual-content').innerHTML = `<p class="visual-intro">6 nhóm tư thế · 7 hình minh họa. Chọn một hình để xem lớn và đọc gợi ý thực hiện.</p><div class="visual-library">${GUIDES.map((guide) => `<button class="visual-library-card" data-action="visual-guide" data-guide="${guide.key}" data-from-library="true">${renderGuideImage(guide)}<span class="library-card-title"><span class="library-number">${guide.group}</span><strong>${escape(guide.name)}</strong>${icon('arrow')}</span><span class="library-variant">${escape(guide.variant)}</span><span class="library-source">${guide.supplemental ? 'Minh họa bổ sung (AI) · Mốc video ' : 'Prime Form · '}${guide.time}${guide.advanced ? ' · Nâng cao' : ''}</span></button>`).join('')}</div><div class="visual-attribution"><p>6 hình trích từ video Prime Form. Hình đẩy tường là minh họa bổ sung bằng AI; động tác xuất hiện trong lịch của video ở 12:40.</p><a href="https://web.facebook.com/reel/3500844863420320" target="_blank" rel="noopener noreferrer">Xem video gốc${icon('arrow')}</a></div>`;
    showVisualDialog();
    if (returning) $('#visual-content [data-guide]')?.focus({ preventScroll: true });
  }
  function openVisualGuide(key, fromLibrary = false) {
    const guide = GUIDES.find((item) => item.key === key);
    if (!guide) return;
    const current = template().exercises.find((item) => guideFor(item)?.key === key);
    const recurring = current || data.templates.flatMap((day) => day.exercises).find((item) => guideFor(item)?.key === key);
    $('#visual-eyebrow').textContent = `NHÓM TƯ THẾ ${guide.group}${guide.advanced ? ' · NÂNG CAO' : ''}`;
    $('#visual-title').textContent = guide.name;
    $('#visual-content').innerHTML = `${fromLibrary ? `<button class="text-button visual-back" data-action="visual-library">${icon('arrow', 'flip')}Tất cả tư thế</button>` : ''}<figure class="guide-large">${renderGuideImage(guide)}<figcaption>${escape(guide.variant)}<span>${guide.supplemental ? 'Minh họa bổ sung (AI) · Mốc trong lịch video ' : 'Hình trích từ video Prime Form · '}${guide.time}</span></figcaption></figure>${guide.advanced ? '<div class="advanced-note">Tư thế nâng cao. Bạn có thể chỉnh sửa hoặc bỏ bài nếu chưa kiểm soát được tư thế.</div>' : ''}<div class="guide-detail-layout"><section class="guide-cues" aria-label="Gợi ý thực hiện"><h3>Gợi ý thực hiện</h3><ol>${guide.cues.map((cue) => `<li>${escape(cue)}</li>`).join('')}</ol></section><section class="guide-config" aria-label="Thông số tập luyện"><h3>${current ? 'Ngày đang chọn' : 'Trong lịch của bạn'}</h3>${recurring ? `<div class="guide-prescription"><strong>${recurring.sets} × ${recurring.hold}<span>giây${/mỗi bên/i.test(recurring.focus) ? ' mỗi bên' : ''}</span></strong><span>Thời gian nghỉ gợi ý: ${recurring.rest} giây</span></div><p>Thông số hiện tại của bạn, có thể chỉnh trong danh sách bài tập.</p>` : '<p>Bài này chưa có trong lịch của bạn. Bạn có thể thêm từ danh sách bài tập.</p>'}</section></div><div class="visual-attribution"><p>Thở đều, không nín thở; đau khớp thì dừng. Hình dùng để đối chiếu tư thế với video.</p><a href="https://web.facebook.com/reel/3500844863420320" target="_blank" rel="noopener noreferrer">Đối chiếu video gốc${icon('arrow')}</a></div>`;
    showVisualDialog();
    if (fromLibrary) $('.visual-back')?.focus({ preventScroll: true });
  }

  function openExercise(id = '') {
    const item = template().exercises.find((entry) => entry.id === id);
    $('#edit-title').textContent = item ? 'Chỉnh sửa bài tập' : 'Thêm bài tập';
    $('#exercise-id').value = item?.id || '';
    $('#exercise-name').value = item?.name || '';
    $('#exercise-focus').value = item?.focus || '';
    $('#exercise-sets').value = item?.sets || 2;
    $('#exercise-hold').value = item?.hold || 20;
    $('#exercise-hold').min = '1';
    $('#exercise-rest').value = item?.rest || 60;
    $('#delete-exercise').hidden = !item;
    let note = $('#exercise-source-note');
    if (!note) { note = document.createElement('p'); note.id = 'exercise-source-note'; note.className = 'exercise-source-note'; $('#exercise-focus').after(note); }
    note.textContent = item?.note ? `Thông tin tham khảo ban đầu: ${displaySourceNote(item)} Thông số hiện tại có thể đã được bạn điều chỉnh.` : '';
    note.hidden = !item?.note;
    openDialog('#exercise-dialog');
  }
  function openSettings() {
    $('#training-day-options').innerHTML = data.templates.map((day, index) => `<label class="day-option"><input type="checkbox" name="trainingDays" value="${index}" ${day.training ? 'checked' : ''}><span>${SHORT_DAYS[index]}</span></label>`).join('');
    $('#session-name-input').value = displayPlanTitle(template().title);
    openDialog('#settings-dialog');
  }

  document.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close]');
    if (close) { close.closest('dialog').close(); return; }
    const dateButton = event.target.closest('[data-date]');
    if (dateButton) { selectDate(dateButton.dataset.date); return; }
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.action;
    if (action === 'settings') openSettings();
    if (action === 'sources') openDialog('#sources-dialog');
    if (action === 'visual-library') openVisualLibrary();
    if (action === 'visual-guide') openVisualGuide(target.dataset.guide, target.dataset.fromLibrary === 'true');
    if (action === 'prev-week' || action === 'next-week') { week = addDays(week, action === 'prev-week' ? -7 : 7); selected = addDays(week, dayIndex(selected)); renderAll(); }
    if (action === 'today') { week = monday(TODAY); selectDate(TODAY); }
    if (action === 'add-exercise') {
      if (template().exercises.length >= 30) toast('Tối đa 30 bài trong một buổi tập.'); else openExercise();
    }
    if (action === 'edit-exercise') openExercise(target.dataset.id);
    if (action === 'finish-session') {
      if (!template().exercises.length || checkedCount(selected) !== template().exercises.length) return;
      writableRecord().finished = true; save(); renderAll(); toast('Đã lưu kết quả buổi tập.');
    }
    if (action === 'water-plus' || action === 'water-minus') { writableRecord().water = Math.max(0, Math.min(20000, record().water + (action === 'water-plus' ? 250 : -250))); save(); renderWater(); }
    if (action === 'water-goal') { $('#water-goal-input').value = data.waterGoal; openDialog('#water-dialog'); }
    if (action === 'use-exercise-timer') { const item = template().exercises.find((entry) => entry.id === $('#bridge-exercise')?.value); if (item) window.NhipTimer?.selectExercise(item); }
    if (action === 'export') {
      const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString(), source: 'https://web.facebook.com/reel/3500844863420320' }, null, 2)], { type: 'application/json;charset=utf-8' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `nhip-tap-${TODAY}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); toast('Đã tải bản sao dữ liệu dự phòng.');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-exercise]')) {
      const id = event.target.dataset.exercise;
      editableSession();
      const current = writableRecord();
      current.checked = event.target.checked ? [...new Set([...current.checked, id])] : current.checked.filter((value) => value !== id);
      if (!event.target.checked) current.finished = false;
      const focusId = id;
      save(); renderWeek(); renderChart(); renderProgress(); renderSession();
      const checkbox = Array.from(document.querySelectorAll('[data-exercise]')).find((input) => input.dataset.exercise === focusId);
      checkbox?.focus({ preventScroll: true });
    }
  });
  $('#settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#session-name-input').value.trim();
    if (!title) { $('#session-name-input').setCustomValidity('Nhập tên buổi tập.'); $('#session-name-input').reportValidity(); return; }
    const training = Array.from(document.querySelectorAll('[name=trainingDays]:checked')).map((input) => Number(input.value));
    const selectedIndex = dayIndex(selected);
    preserveRecordedSessions();
    data.templates.forEach((day, index) => {
      day.training = training.includes(index);
      if (day.training && !day.exercises.length) day.exercises = index === 2 ? wednesdayExercises() : mondayExercises();
      if (day.training && /Nghỉ|Đi dạo/.test(day.title)) day.title = 'Giữ tĩnh toàn thân';
      if (!day.training && !/Nghỉ|Đi dạo/.test(day.title)) day.title = 'Nghỉ và phục hồi';
    });
    data.templates[selectedIndex].title = title;
    if (data.records[selected]?.session) data.records[selected].session.title = title;
    save(); $('#settings-dialog').close(); renderAll(); toast('Lịch của bạn đã được cập nhật.');
  });
  $('#session-name-input').addEventListener('input', () => $('#session-name-input').setCustomValidity(''));
  $('#exercise-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('#exercise-name').value.trim();
    if (!name) { $('#exercise-name').setCustomValidity('Nhập tên bài tập.'); $('#exercise-name').reportValidity(); return; }
    const id = $('#exercise-id').value;
    const day = editableSession();
    const old = day.exercises.find((item) => item.id === id);
    const updated = { id: id || uid(), name, focus: $('#exercise-focus').value.trim(), sets: Number($('#exercise-sets').value), hold: Number($('#exercise-hold').value), rest: Number($('#exercise-rest').value), note: old?.note || 'Bài tập do bạn thêm vào kế hoạch.' };
    if (!validStoredExercise(updated)) { toast('Kiểm tra lại số hiệp và thời gian.'); return; }
    if (old) day.exercises[day.exercises.indexOf(old)] = updated; else day.exercises.push(updated);
    // Only the edited date needs rerecording. Other logged sessions retain snapshots.
    writableRecord().checked = record().checked.filter((value) => value !== updated.id);
    writableRecord().finished = false;
    updateRecurringTemplate();
    save(); $('#exercise-dialog').close(); renderAll(); toast(old ? 'Đã cập nhật bài tập.' : 'Đã thêm bài tập vào lịch.');
  });
  $('#exercise-name').addEventListener('input', () => $('#exercise-name').setCustomValidity(''));
  $('#delete-exercise').addEventListener('click', () => {
    const id = $('#exercise-id').value;
    const day = editableSession();
    day.exercises = day.exercises.filter((item) => item.id !== id);
    writableRecord().checked = record().checked.filter((value) => value !== id);
    writableRecord().finished = false;
    updateRecurringTemplate();
    save(); $('#exercise-dialog').close(); renderAll(); toast('Đã xóa bài tập khỏi lịch của ngày đang chọn.');
  });
  $('#water-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const goal = Number($('#water-goal-input').value);
    if (!integer(goal, 250, 6000) || goal % 250) return;
    data.waterGoal = goal; save(); $('#water-dialog').close(); renderWater(); toast('Đã lưu mục tiêu cá nhân.');
  });
  document.querySelectorAll('[data-nav]').forEach((link) => link.addEventListener('click', () => {
    document.querySelectorAll('[data-nav]').forEach((item) => { item.classList.remove('active'); item.removeAttribute('aria-current'); });
    link.classList.add('active'); link.setAttribute('aria-current', 'page');
  }));
  document.querySelectorAll('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }));
  $('#visual-dialog').addEventListener('close', () => { if (visualOpener?.isConnected) visualOpener.focus({ preventScroll: true }); });
  document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement && event.target.closest('.guide-image')) event.target.closest('.guide-image').classList.add('image-missing');
  }, true);
  renderAll();
  if (storageWarning) setTimeout(() => toast(storageWarning), 300);
})();
