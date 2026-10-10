// A navigation overlay, not another game state. Opening it only holds playback.
(function (global) {
  "use strict";
  const model = global.PipCourseMapModel, controls = document.querySelector(".topbar-controls");
  if (!model || !controls) { global.PipReleaseWelcome?.(); return; }
  const locale = () => global.PipLocale === "hu" ? "hu" : "en";
  const t = (en, hu) => locale() === "hu" ? hu : en;
  const ns = "http://www.w3.org/2000/svg";
  const paths = {
    map: '<path d="M5 18V6m0 0h8m0 0v12h6"/><circle cx="5" cy="6" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="19" cy="18" r="2"/>',
    commands: '<path d="M4 18h6V6h10m-4-4 4 4-4 4"/>',
    repeat: '<path d="M19 8a8 8 0 1 0 1 8M19 3v5h-5"/>',
    choice: '<path d="M12 21v-8M12 13 5 6m7 7 7-7M2 6h6V1m8 0v5h6"/>',
    while: '<path d="M19 7a8 8 0 1 0 1 9M19 2v5h-5"/><path d="M10 10h4v4h-4z"/>',
    function: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M7 9h10M7 13h10M7 17h5M7 2v3m10-3v3"/>',
    variable: '<path d="m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v11"/>',
    parameter: '<rect x="10" y="4" width="11" height="16" rx="3"/><path d="M2 12h13m-4-4 4 4-4 4"/>',
    directions: '<path d="M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4"/>',
    boolean: '<circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/><path d="m9 12 2 2 4-5"/>',
    nested: '<path d="M20 7a9 9 0 1 0 1 8M20 2v5h-5M15 10a4 4 0 1 0 1 5m-1-8v3h-3"/>',
    break: '<path d="M3 5h8v14m-4-4 4 4 4-4M15 8h6V2h-6z"/>',
    mixed: '<rect x="2" y="3" width="7" height="7" rx="2"/><circle cx="18" cy="6" r="4"/><path d="m12 14 5 7H7l5-7Z"/>',
    read: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    build: '<rect x="3" y="12" width="8" height="8" rx="2"/><rect x="13" y="12" width="8" height="8" rx="2"/><rect x="8" y="2" width="8" height="8" rx="2"/>',
    write: '<path d="m3 21 5-1L21 7l-4-4L4 16l-1 5Zm11-15 4 4M3 21h18"/>',
    hybrid: '<path d="M3 7h18m-4-4 4 4-4 4M21 17H3m4-4-4 4 4 4"/>',
    python: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-17-2 20"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  };
  function icon(name) {
    const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = paths[name] || paths.mixed; return svg;
  }
  const dialog = document.createElement('dialog'); dialog.id = 'course-map-dialog';
  dialog.setAttribute('aria-labelledby', 'course-map-title');
  dialog.innerHTML = `
    <header class="course-map-header"><div class="course-map-brand"><span class="course-map-brand-icon"></span><div><h2 id="course-map-title"></h2></div></div><div class="course-map-header-tools"><button type="button" id="course-map-practice-toggle" aria-expanded="false"></button><div class="course-map-languages" role="group"><button type="button" data-map-language="en">English</button><button type="button" data-map-language="hu">Magyar</button></div><button type="button" id="course-map-close"></button></div></header>
    <div class="course-map-body"><section class="knowledge-map"><div class="knowledge-track-headings"><h3 id="course-map-blocks-heading"></h3><span id="course-map-transfer-heading"></span><h3 id="course-map-python-heading"></h3></div><div id="course-map-chart"><svg id="course-map-edges" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg><div id="course-map-lessons" role="group"></div><div id="course-map-bridges" role="group"></div><p id="course-map-empty" hidden></p></div><div id="course-map-inspector" class="knowledge-map-inspector" aria-live="polite"><span id="course-map-focus-icon"></span><div><strong id="course-map-focus-title"></strong><p id="course-map-focus-copy"></p></div><button type="button" id="course-map-prerequisite" hidden></button></div></section><aside class="course-map-practice-panel"><div class="course-map-practice-heading"><div><h3 id="course-map-practice-title"></h3></div><button type="button" id="course-map-practice-dismiss">×</button></div><div id="course-map-practice-track" role="group"><button type="button" data-map-practice-track="blocks"></button><button type="button" data-map-practice-track="python"></button></div><div id="course-map-practice-list"></div></aside></div>
    <footer class="course-map-footer"><span id="course-map-count"></span><div class="course-map-legend"><span data-map-legend="complete"></span><span data-map-legend="available"></span><span data-map-legend="locked"></span></div><p id="course-map-message" role="status" aria-live="polite"></p><div class="course-map-footer-actions"><button type="button" id="course-map-reset"><span></span></button></div></footer>`;
  document.body.append(dialog);
  const q = selector => dialog.querySelector(selector);
  q('.course-map-brand-icon').append(icon('map'));
  q('#course-map-reset').prepend(icon('reset'));
  let practiceTrack = 'blocks', opener = null, release = [], navigating = false;
  let rows = [], catalog = { blocks: [], python: [] }, graph = { nodes: [], edges: [], bridges: [] }, selectedKey = null;
  let scrollBeforeMap = { x: 0, y: 0 };
  const entryButtons = [];
  function entry(host, id) {
    const button = document.createElement('button'); button.type = 'button'; button.id = id; button.className = 'course-map-entry';
    button.append(icon('map'), document.createElement('span')); host.append(button); entryButtons.push(button);
    button.addEventListener('click', event => { event.stopPropagation(); open(button); }); return button;
  }
  controls.before(entry(document.createDocumentFragment(), 'course-map-open'));
  const sourceTrack = () => global.PipLearningStage?.current?.() === 'hybrid' ? global.PipLearningStage?.origin?.() || 'blocks'
    : global.PipLearningStage?.isBlocks?.() ? 'blocks' : 'python';
  function snapshot(track) { return track === 'blocks' ? global.PipBlocksNavigation?.snapshot?.() || {} : global.PipTutorial?.map?.snapshot?.() || {}; }
  function refreshEntry() {
    for (const button of entryButtons) {
      button.querySelector('span').textContent = t('Map', 'Térkép');
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', String(dialog.open));
    }
  }
  const isReady = node => ['available', 'complete'].includes(node.status);
  function refreshReset() {
    const button = q('#course-map-reset'), label = t('Reset everything', 'Mindent újrakezd');
    button.querySelector('span').textContent = label;
  }
  function lessonButton(node) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'course-map-node';
    button.dataset.openLesson = node.id; button.dataset.track = node.track; button.dataset.lessonId = node.id; button.dataset.key = node.key;
    button.dataset.status = node.status; button.dataset.current = String(node.current);
    button.style.left = node.x + '%'; button.style.top = node.y + '%';
    if (node.current) button.setAttribute('aria-current', 'step');
    const ring = document.createElement('span'); ring.className = 'course-map-ring'; ring.style.setProperty('--map-progress', String(node.progress || 0));
    const glyph = document.createElement('span'); glyph.className = 'course-map-glyph'; glyph.dataset.concept = node.id;
    const keywords = { commands: '↑ ↱', for: 'for', if: 'if', while: 'while', functions: 'def', variables: 'x =', parameters: 'f(n)', directions: t('whats', 'mit_lát'), boolean: 'and/or', 'nested-for': 'for²', 'loop-choices': 'for/if', break: 'break', 'nested-while': 'while²', mixed: '{ }' };
    glyph.textContent = keywords[node.id] || '{ }';
    if (node.track === 'blocks') {
      glyph.textContent = ({ commands: '↑ ↱', for: '⟳ ×3', if: '? ▤', while: '⟳ ?', 'nested-for': '⟳²' })[node.id] || '↑';
      glyph.dataset.blockType = node.referenceTypes?.find(type => /^(FOR_|IF_|WHILE_)/.test(type)) || 'FORWARD';
    }
    const badge = document.createElement('span'); badge.className = 'course-map-badge'; badge.setAttribute('aria-hidden', 'true');
    if (node.status === 'complete') badge.append(icon('check'));
    else badge.textContent = isReady(node) ? '→' : '·';
    ring.append(glyph, badge);
    button.append(ring);
    if (node.track === 'blocks') {
      const label = document.createElement('strong'); label.className = 'course-map-node-label'; label.textContent = node.label[locale()];
      button.append(label);
    }
    return button;
  }
  function drawEdge(from, to, bridge = false) {
    const path = document.createElementNS(ns, 'path');
    const x1 = from.x * 10, y1 = from.y * 10, x2 = to.x * 10, y2 = to.y * 10;
    const middle = (y1 + y2) / 2;
    // Route long branches beside the Blocks spine, not through unrelated lessons.
    const lane = to.id === 'while' ? 10 : 210;
    const skipsBlocks = !bridge && from.track === 'blocks' && to.track === 'blocks' && y2 - y1 > 210;
    path.setAttribute('d', bridge ? `M${x1},${y1} L${x2},${y2}` : skipsBlocks
      ? `M${x1},${y1} C${lane},${y1} ${lane},${y2} ${x2},${y2}`
      : `M${x1},${y1} C${x1},${middle} ${x2},${middle} ${x2},${y2}`);
    path.dataset.from = from.key; path.dataset.to = to.key;
    path.dataset.state = from.status === 'complete' ? 'complete' : 'new';
    path.dataset.bridge = String(bridge); q('#course-map-edges').append(path);
  }
  function bridgeButton(bridge, x, y) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'course-map-bridge';
    button.dataset.bridgeFrom = bridge.from; button.dataset.bridgeTo = bridge.to; button.dataset.bridgeTopic = bridge.topic;
    button.dataset.status = bridge.status; button.style.left = x + '%'; button.style.top = y + '%';
    const arrow = bridge.from === 'blocks' ? '→' : '←';
    button.textContent = bridge.status === 'complete' ? '✓' : arrow;
    return button;
  }
  function renderGraph() {
    q('#course-map-lessons').replaceChildren(...graph.nodes.map(lessonButton));
    q('#course-map-edges').replaceChildren(); q('#course-map-bridges').replaceChildren();
    const byKey = new Map(graph.nodes.map(node => [node.key, node]));
    for (const edge of graph.edges) {
      const from = byKey.get(edge.source), to = byKey.get(edge.target); if (from && to) drawEdge(from, to);
    }
    for (const block of graph.nodes.filter(node => node.track === 'blocks')) {
      const counterpart = graph.nodes.find(node => node.track === 'python' && node.id === block.id);
      if (!counterpart) continue;
      const transfers = graph.bridges.filter(item => item.topic === block.id);
      if (!transfers.length) continue;
      const centre = { x: 27, y: block.y, key: 'bridge:' + block.id };
      drawEdge(block, centre, true); drawEdge(centre, counterpart, true);
      for (const bridge of transfers) q('#course-map-bridges').append(bridgeButton(bridge, 27, block.y + (bridge.from === 'blocks' ? -2 : 2)));
    }
    q('#course-map-empty').hidden = graph.nodes.length > 0;
    q('#course-map-empty').textContent = t('Loading lessons…', 'Leckék betöltése…');
    inspect(graph.nodes.find(node => node.key === selectedKey), true);
  }
  function inspect(node, force = false) {
    const key = node?.key || null;
    if (!force && key === selectedKey) return;
    selectedKey = key;
    q('#course-map-focus-icon').replaceChildren(icon(node?.icon || 'map'));
    q('#course-map-focus-title').textContent = node ? node.title[locale()] : t('Choose a lesson', 'Válassz leckét!');
    const missing = node ? (node.unmetPrerequisites || []).map(key => graph.nodes.find(item => item.key === key)).filter(Boolean) : [];
    const description = node?.description?.[locale()] || '';
    // Lesson copy is plain text with optional backtick-delimited code terms.
    // Build DOM nodes, never interpret authored copy as HTML.
    q('#course-map-focus-copy').replaceChildren(...description.split(/`([^`]+)`/g).map((text, index) => {
      if (index % 2 === 0) return document.createTextNode(text);
      const code = document.createElement('code'); code.textContent = text; return code;
    }));
    const next = q('#course-map-prerequisite'); next.hidden = isReady(node || {}) || !missing.length;
    if (missing[0]) {
      next.dataset.focusKey = missing[0].key;
      next.textContent = '↖ ' + missing[0].label[locale()];
    }
    for (const edge of q('#course-map-edges').children) edge.classList.toggle('graph-related', Boolean(node && (edge.dataset.to === node.key || edge.dataset.from === node.key)));
    for (const button of q('#course-map-lessons').children) button.dataset.selected = String(button.dataset.key === selectedKey);
  }
  function practiceTitle(kind) { return kind === 'read' ? t('Read', 'Olvasás') : kind === 'write' ? practiceTrack === 'blocks' ? t('Build', 'Építés') : t('Write', 'Írás') : t('Translate', 'Átfordítás'); }
  function renderPractice() {
    const groups = model.practiceGroups(rows, practiceTrack);
    const host = q('#course-map-practice-list'); host.replaceChildren();
    const tiers = { commands: t('Commands', 'Parancsok'), actions: t('Commands', 'Parancsok'), loops: 'for', for: 'for', choices: 'if', if: 'if', while: 'while', mixed: t('Mixed', 'Vegyes'), easy: t('Easy', 'Könnyű'), medium: t('Medium', 'Közepes'), hard: t('Hard', 'Nehéz'), mastery: t('Advanced', 'Haladó') };
    for (const kind of ['read', 'write', 'hybrid']) {
      const section = document.createElement('section'); section.className = 'course-map-practice-section';
      const heading = document.createElement('h4'); heading.append(icon(kind === 'write' && practiceTrack === 'blocks' ? 'build' : kind), document.createTextNode(practiceTitle(kind))); section.append(heading);
      const grid = document.createElement('div'); grid.className = 'course-map-practice-grid';
      const unique = [...new Map(groups.filter(group => group.kind === kind).map(group => [group.difficulty, group])).values()];
      for (const group of unique) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'course-map-practice-task';
        button.dataset.mapPractice = kind; button.dataset.topic = group.topicIds[0]; button.dataset.track = practiceTrack; button.dataset.difficulty = group.difficulty;
        const complete = global.PipLearningProgress?.practiceCompleted(kind === 'hybrid' ? 'shared' : practiceTrack, kind, group.difficulty) === true;
        const projected = graph.practice.find(item => item.track === (kind === 'hybrid' ? 'shared' : practiceTrack) && item.kind === kind && item.difficulty === group.difficulty);
        const ready = projected?.status === 'available';
        button.dataset.status = complete ? 'complete' : ready ? 'available' : 'locked';
        const badge = document.createElement('span'); badge.className = 'practice-status'; badge.textContent = complete ? '✓' : ready ? '→' : '·';
        button.append(badge, document.createTextNode(tiers[group.difficulty] || group.difficulty));
        grid.append(button);
      }
      section.append(grid); host.append(section);
    }
  }
  function render() {
    refreshEntry(); refreshReset(); if (!dialog.open) return;
    const focused = document.activeElement;
    const focusKey = focused?.dataset.openLesson ? [focused.dataset.track, focused.dataset.openLesson] : null;
    const snapshots = { blocks: snapshot('blocks'), python: snapshot('python'), progress: global.PipLearningProgress?.snapshot() };
    graph = model.graph(snapshots); catalog = { blocks: graph.nodes.filter(node => node.track === 'blocks'), python: graph.nodes.filter(node => node.track === 'python') };
    rows = model.rows(snapshots);
    q('#course-map-title').textContent = t('Learning map', 'Tanulási térkép');
    q('#course-map-close').replaceChildren(icon('play'), document.createTextNode(t('Back to game', 'Vissza a játékhoz')));
    for (const button of q('.course-map-languages').children) button.setAttribute('aria-pressed', String(button.dataset.mapLanguage === locale()));
    q('#course-map-blocks-heading').replaceChildren(icon('build'), document.createTextNode(t('Blocks', 'Blokkok')));
    q('#course-map-python-heading').replaceChildren(icon('python'), document.createTextNode('Python'));
    q('#course-map-transfer-heading').textContent = t('TRANSFER', 'ÁTLÉPÉS');
    q('#course-map-practice-title').textContent = t('Practice', 'Gyakorlás');
    q('#course-map-practice-toggle').replaceChildren(icon('read'), document.createTextNode(t('Practice', 'Gyakorlás')));
    for (const button of q('#course-map-practice-track').children) { button.textContent = button.dataset.mapPracticeTrack === 'blocks' ? t('Blocks', 'Blokkok') : 'Python'; button.setAttribute('aria-pressed', String(button.dataset.mapPracticeTrack === practiceTrack)); }
    q('#course-map-count').textContent = `${graph.nodes.filter(node => node.status === 'complete').length} / ${graph.nodes.length} ` + t('lessons', 'lecke');
    q('[data-map-legend="complete"]').textContent = '✓ ' + t('Done', 'Kész');
    q('[data-map-legend="available"]').textContent = '→ ' + t('Suggested', 'Ajánlott');
    q('[data-map-legend="locked"]').textContent = '· ' + t('Explore', 'Felfedezhető');
    renderGraph(); renderPractice();
    if (focusKey) [...q('#course-map-lessons').children].find(button => button.dataset.track === focusKey[0] && button.dataset.openLesson === focusKey[1])?.focus({ preventScroll: true });
  }
  function open(from = entryButtons[0]) {
    if (dialog.open || global.PipResetInProgress) return;
    opener = from; navigating = false; release = []; scrollBeforeMap = { x: global.scrollX || 0, y: global.scrollY || 0 };
    for (const owner of [global.PipNativeNavigation, global.PipTutorial?.map, global.PipBlocksNavigation, global.PipHybrid]) {
      const resume = owner?.pauseForMap?.(); if (typeof resume === 'function') release.push(resume);
    }
    practiceTrack = sourceTrack(); q('#course-map-message').textContent = '';
    dialog.showModal(); document.documentElement.classList.add('course-map-visible'); render();
    requestAnimationFrame(() => { if (dialog.open) q('#course-map-close').focus({ preventScroll: true }); });
  }
  function close() { if (dialog.open) dialog.close(); }
  function navigate(kind, track, id, rowId, targetDifficulty) {
    const row = rows.find(item => item.id === rowId);
    const node = kind === 'lesson' ? catalog[track].find(item => item.id === id) : null;
    const match = row?.practice[track];
    if (global.PipResetInProgress || kind === 'lesson' && !node || kind !== 'lesson' && (!match || !match[kind])) return;
    // Knowledge status guides the colours, never permission to open a lesson.
    const difficulty = targetDifficulty || match?.[kind];
    if (track === 'python' && ['read', 'write'].includes(kind) && !global.PipNativeNavigation?.confirmPractice?.(kind, difficulty)) {
      q('#course-map-message').textContent = t('Nothing changed. Your current task is still here.', 'Nem változott semmi. A mostani feladatod megmaradt.'); return;
    }
    let ok = false;
    try {
      if (kind === 'hybrid') ok = global.PipLearningStage?.openHybrid?.(track, difficulty) === true;
      else if (track === 'blocks') {
        global.PipLearningStage?.switchStage('blocks');
        ok = kind === 'lesson' ? global.PipBlocksNavigation?.openChapter(id) : global.PipBlocksNavigation?.openPractice(kind === 'write' ? 'build' : 'read', difficulty);
      } else {
        global.PipLearningStage?.switchStage('python');
        const chapterId = row?.python[0]?.id;
        ok = kind === 'lesson' ? global.PipTutorial?.map?.openChapter(id)
          : chapterId ? global.PipTutorial?.map?.openPractice(kind, chapterId, { confirmed: true })
          : global.PipNativeNavigation?.openPractice(kind, difficulty, { confirmed: true });
      }
    } catch (error) { console.warn('Map navigation could not finish', error); }
    if (ok) { navigating = true; close(); }
    else q('#course-map-message').textContent = t('Your work is safe. Wait until the game is ready, or choose another activity.', 'A munkád megmaradt. Várd meg, amíg betölt a játék, vagy válassz másik feladatot!');
  }
  function navigateBridge(button) {
    const { bridgeFrom: from, bridgeTo: to, bridgeTopic: topic } = button.dataset;
    const bridge = graph.bridges.find(item => item.from === from && item.to === to && item.topic === topic);
    if (!bridge) return;
    if (!isReady(bridge)) {
      inspect(graph.nodes.find(node => node.track === from && node.id === topic));
      q('#course-map-message').textContent = t('Finish this lesson first to try its translation checkpoint.', 'Az átvezető feladathoz előbb fejezd be ezt a leckét.'); return;
    }
    if (global.PipHybrid?.openBridge?.({ from, to, topic })) { navigating = true; close(); }
    else q('#course-map-message').textContent = t('The checkpoint is not ready yet. Your work is safe.', 'Az átvezető feladat még nem áll készen. A munkád megmaradt.');
  }
  q('#course-map-close').addEventListener('click', close);
  // Use the same confirmation, save guards and reset as the game header.
  // Cancelling leaves this map and its paused game exactly as they are.
  q('#course-map-reset').addEventListener('click', () => global.PipResetEverything());
  const showPractice = open => { dialog.dataset.practiceOpen = String(open); q('#course-map-practice-toggle').setAttribute('aria-expanded', String(open)); if (open) q('#course-map-practice-dismiss').focus({ preventScroll: true }); };
  q('#course-map-practice-toggle').addEventListener('click', () => showPractice(dialog.dataset.practiceOpen !== 'true'));
  q('#course-map-practice-dismiss').addEventListener('click', () => { showPractice(false); q('#course-map-practice-toggle').focus({ preventScroll: true }); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (dialog.dataset.practiceOpen === 'true') showPractice(false); else close(); });
  dialog.addEventListener('close', () => {
    showPractice(false); global.PipWelcomePending = false; document.documentElement.classList.remove('course-map-visible', 'course-map-loading');
    global.scrollTo?.({ left: scrollBeforeMap.x, top: scrollBeforeMap.y, behavior: 'instant' });
    const callbacks = release; release = []; for (const resume of callbacks) { try { resume(); } catch (error) { console.warn('Map playback resume failed', error); } }
    refreshEntry(); if (!navigating && opener?.isConnected) opener.focus({ preventScroll: true });
  });
  dialog.addEventListener('focusin', event => { const node = graph.nodes.find(node => node.key === event.target.dataset?.key); if (node) inspect(node); });
  dialog.addEventListener('pointerover', event => { const button = event.target.closest('.course-map-node'); if (button) inspect(graph.nodes.find(node => node.key === button.dataset.key)); });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.dataset.openLesson) navigate('lesson', button.dataset.track, button.dataset.openLesson);
    else if (button.dataset.mapPractice) navigate(button.dataset.mapPractice, button.dataset.track, null, button.dataset.topic, button.dataset.difficulty);
    else if (button.dataset.bridgeTopic) navigateBridge(button);
    else if (button.dataset.mapPracticeTrack) { practiceTrack = button.dataset.mapPracticeTrack; renderPractice(); for (const sibling of button.parentElement.children) sibling.setAttribute('aria-pressed', String(sibling === button)); }
    else if (button.dataset.focusKey) { const target = [...q('#course-map-lessons').children].find(item => item.dataset.key === button.dataset.focusKey); target?.focus({ preventScroll: true }); }
    else if (button.dataset.mapLanguage) {
      if (button.dataset.mapLanguage === locale()) return;
      const changed = global.PipSetLanguage?.(button.dataset.mapLanguage);
      if (changed === false && button.dataset.mapLanguage !== locale()) q('#course-map-message').textContent = t('A custom name prevents this language change. Your code is unchanged.', 'Egy saját név miatt most nem váltható a nyelv. A kódod megmaradt.');
    }
  });
  const switchLanguage = global.PipSetLanguage;
  global.PipSetLanguage = next => { if (next === locale()) return true; const result = switchLanguage(next); if (result !== false) render(); return result; };
  global.addEventListener('pip-learning-progress-change', () => { if (dialog.open) render(); });
  global.PipCourseMap = Object.freeze({ open, close, isOpen: () => dialog.open, refresh: render });
  refreshEntry(); open(entryButtons[0]);
  document.documentElement.classList.remove('course-map-loading');
  document.querySelector('#course-map-loading-screen')?.remove();
})(window);
