// The tile interpreter and checkpoints are independent; tasks are strict
// counterparts derived from the existing Python course and practice sources.
(function (global) {
  "use strict";
  const engine = global.PipBlocksScope, lessons = global.PipBlocksLessons, model = global.PipBlocksState;
  const chapters = global.PipBlocksChapters || [];
  const goals = global.PipBlocksCourseGoals, paletteTools = global.PipBlockPalette;
  if (!engine || !lessons?.length || !model || !goals || !paletteTools) return;
  const practice = global.PipBlocksPractice, practiceModel = global.PipBlocksPracticeState;
  const practiceKey = "pip-python-lab.blocks-practice.v1";
  let practiceRaw; try { practiceRaw = JSON.parse(localStorage.getItem(practiceKey)); } catch { /* New practice. */ }
  const practiceState = practiceModel.restore(practiceRaw), tasks = new Map();
  function recordPracticeCompletion(saved, mode = practiceState.mode, difficulty = practiceState.difficulties[mode]) {
    if (!saved.solved || saved.revealed) return;
    global.PipLearningProgress?.recordPractice({ track: "blocks", kind: mode === "build" ? "write" : "read",
      difficulty, taskId: "seed:" + saved.seed, generatorVersion: practice.VERSION });
  }
  // Only the restored, current generator's proved successes are migratable.
  // Old wallets and retired tasks cannot establish knowledge in a new tier.
  for (const [sessionId, saved] of Object.entries(practiceState.sessions)) {
    const [mode, difficulty] = sessionId.split(":");
    recordPracticeCompletion(saved, mode, difficulty);
  }
  const isPractice = () => practiceState.mode !== "course";
  const isRead = () => practiceState.mode === "read" || !isPractice() && current().kind === "predict";
  const isWatch = () => !isPractice() && current().kind === "watch";
  const isReadOnly = () => isRead() || isWatch();
  const readActions = () => isPractice() ? session().actions : (state.routes[current().id] ||= []);
  const setReadActions = actions => { if (isPractice()) session().actions = actions; else state.routes[current().id] = actions; };
  const difficultyOptions = mode => practice.difficultiesFor(mode);
  const sessionKey = () => practiceState.mode + ":" + practiceState.difficulties[practiceState.mode];
  const randomSeed = () => global.crypto?.getRandomValues(new Uint32Array(1))[0] ?? Math.floor(Math.random() * 4294967296);
  const session = () => practiceState.sessions[sessionKey()] ||= practiceModel.fresh(randomSeed());
  function practiceTask() {
    const saved = session(), id = sessionKey() + ":" + saved.seed;
    if (!tasks.has(id)) tasks.set(id, practice.generate(saved.seed, practiceState.difficulties[practiceState.mode], practiceState.mode));
    return tasks.get(id);
  }
  const key = "pip-python-lab.blocks.v1", stageKey = "pip-python-lab.learning-stage";
  let raw; try { raw = JSON.parse(localStorage.getItem(key)); } catch { /* New player. */ }
  const state = model.restore(raw, lessons);
  const revealed = new Set((Array.isArray(raw?.revealed) ? raw.revealed : []).filter(id => lessons.some(lesson => lesson.id === id)));
  const shell = document.querySelector(".app-shell"), main = shell.querySelector("main");
  const picker = document.createElement("div");
  picker.className = "learning-stage-switch"; picker.setAttribute("role", "group");
  picker.innerHTML = '<button type="button" data-learning-stage="blocks"></button><button type="button" data-learning-stage="python">Python</button>';
  shell.querySelector(".topbar-controls").before(picker);
  const header = document.createElement("nav"); header.className = "blocks-header"; header.hidden = true;
  header.innerHTML = '<div class="blocks-heading-copy"><small id="blocks-chapter"></small><strong id="blocks-title"></strong></div><div class="blocks-mode-switch" role="group"><button type="button" data-blocks-mode="course"></button><button type="button" data-blocks-mode="read"></button><button type="button" data-blocks-mode="build"></button><button type="button" data-blocks-mode="hybrid"></button></div><div class="blocks-navigation"><button type="button" id="blocks-previous">‹</button><select id="blocks-level"></select><button type="button" id="blocks-next">›</button></div><div class="blocks-practice-options" hidden><select id="blocks-difficulty"></select><button type="button" id="blocks-new"></button></div>';
  shell.querySelector(".topbar").after(header);
  const workspace = document.createElement("section"); workspace.className = "blocks-workspace"; workspace.hidden = true;
  workspace.innerHTML = `
    <section class="course-checkpoint blocks-checkpoint" hidden aria-labelledby="blocks-checkpoint-title">
      <span class="course-finish-mark" aria-hidden="true">✓</span><p class="panel-eyebrow" id="blocks-checkpoint-eyebrow"></p>
      <h2 id="blocks-checkpoint-title" tabindex="-1"></h2>
      <div class="course-chapter-options">
        <button id="blocks-recap-next" class="button primary" type="button"></button>
        <button data-blocks-practice="read" class="button ghost" type="button"></button>
        <button data-blocks-practice="build" class="button ghost" type="button"></button>
      </div><button id="blocks-recap-back" type="button"></button>
    </section>
    <article class="editor-panel blocks-editor">
      <div class="blocks-editor-heading"><strong id="blocks-program-title"></strong><div class="blocks-controls"><button class="button primary" type="button" id="blocks-run"></button><button class="button ghost" type="button" id="blocks-reset"></button></div></div>
      <div class="blocks-lesson-guide"><div id="blocks-phases" role="group"></div></div>
      <div class="blocks-program-section"><div class="blocks-strip-label"><span id="blocks-order"></span><button type="button" id="blocks-clear"></button></div><div id="blocks-program" class="blocks-strip" role="group"></div></div>
      <div class="blocks-pile-section"><div class="blocks-strip-label"><strong id="blocks-pile-title"></strong></div><div id="blocks-pile" class="blocks-strip" role="group"></div><div class="blocks-read-controls" hidden><div class="blocks-arrow-controls"><button type="button" data-blocks-action="left">←</button><button type="button" data-blocks-action="forward">↑</button><button type="button" data-blocks-action="right">→</button><button type="button" id="blocks-read-undo"></button></div><small id="blocks-read-count"></small></div></div>
    </article>
    <aside class="world-panel blocks-world"><div class="world-head"><div><p class="panel-eyebrow" id="blocks-world-label"></p><h2 id="blocks-world-title"></h2></div></div><div class="board-stage"><div id="blocks-board" class="board" role="img"></div></div><div class="blocks-board-dock"><div class="blocks-wallet-row"><strong id="blocks-wallet"></strong><button type="button" id="blocks-shop"></button></div><div id="blocks-feedback" role="status" aria-live="polite"></div><div class="blocks-result-actions"><button type="button" class="blocks-practice-link" id="blocks-practice-link" hidden></button><button class="button primary" type="button" id="blocks-continue" hidden></button></div></div></aside>`;
  main.append(workspace);
  const q = selector => workspace.querySelector(selector) || header.querySelector(selector);
  const program = q("#blocks-program"), pile = q("#blocks-pile"), board = q("#blocks-board");
  const locale = () => global.PipLocale === "hu" ? "hu" : "en";
  const t = (en, hu) => locale() === "hu" ? hu : en;
  const palette = paletteTools.attach({ pile, toolbar: q(".blocks-pile-section .blocks-strip-label"),
    createTile: type => tile({ type, id: "free-" + type }, "pile", "∞") });
  const current = () => isPractice() ? practiceTask() : lessons[state.index];
  const currentChapter = () => chapters.find(chapter => chapter.id === lessons[state.index].sourceChapterId);
  const chapterLessons = chapter => lessons.filter(lesson => lesson.sourceChapterId === chapter.id);
  const chapterComplete = chapter => chapterLessons(chapter).every(lesson => state.awards[lesson.id]);
  const phaseLabel = kind => ({ watch: t("Watch", "Figyeld"), complete: t("Complete", "Egészítsd ki"),
    predict: t("Act out", "Játszd el"), create: t("Write", "Írd meg") })[kind];
  function nextCoursePhase() {
    const chapter = currentChapter(), members = chapterLessons(chapter);
    const phase = members.findIndex(lesson => lesson.id === lessons[state.index].id);
    return members[phase + 1] || members.find(lesson => !state.awards[lesson.id]) || null;
  }
  function advanceCourse() {
    if (busy || isPractice() || !state.awards[current().id]) return;
    if (isRecap()) { continueAfterRecap(); return; }
    const next = nextCoursePhase();
    if (next) changeLevel(lessons.indexOf(next));
    else showRecap();
  }
  function chapterPractice(mode) {
    const authored = chapterLessons(currentChapter())[0]?.practice || {};
    const difficulty = mode === "read" ? { actions: "commands", for: "loops", if: "choices", while: "while" }[authored.read] : authored.write;
    return difficultyOptions(mode).some(item => item.id === difficulty) ? difficulty : null;
  }
  function showRecap() {
    if (busy || isPractice() || !chapterComplete(currentChapter())) return;
    recapChapter = currentChapter().id; persist(); render();
    q("#blocks-checkpoint-title").focus({ preventScroll: true });
  }
  function continueAfterRecap() {
    if (!isRecap() || busy) return;
    const next = chapters[chapters.indexOf(currentChapter()) + 1];
    if (next) openChapter(next.id);
    else global.PipCourseMap?.open();
  }
  function startChapterPractice(mode) {
    if (!isRecap() || busy) return;
    const difficulty = chapterPractice(mode);
    if (!difficulty) return;
    // Keep the completed chapter parked here. Course returns to this card;
    // choosing practice neither grants rewards nor replaces a saved draft.
    persist(); saveView(); practiceState.mode = mode;
    practiceState.difficulties[mode] = difficulty; loadLevel(); persist();
  }
  function renderRecap() {
    const visible = isRecap();
    workspace.dataset.courseScreen = visible ? "recap" : "lesson";
    q(".blocks-checkpoint").hidden = !visible;
    q("#blocks-checkpoint-eyebrow").textContent = t("Lesson complete", "Lecke kész");
    q("#blocks-checkpoint-title").textContent = currentChapter().label[locale()];
    const last = chapters.indexOf(currentChapter()) === chapters.length - 1;
    q("#blocks-recap-next").textContent = last ? t("Back to the map · Enter →", "Vissza a térképhez · Enter →") : t("Next lesson · Enter →", "Következő lecke · Enter →");
    for (const button of workspace.querySelectorAll("[data-blocks-practice]")) {
      const mode = button.dataset.blocksPractice;
      button.textContent = mode === "read" ? t("Practise reading", "Olvasást gyakorlok") : t("Practise building", "Építést gyakorlok");
      button.hidden = !chapterPractice(mode);
    }
    q("#blocks-recap-back").textContent = t("View my program", "Megnézem a programomat");
  }
  function openChapter(id) {
    const index = model.recommendedStage(state, id, lessons);
    if (index < 0) return false;
    if (!isPractice() && index === state.index) return true;
    if (busy) stop();
    persist(); saveView(); practiceState.mode = "course"; state.index = index;
    if (recapChapter !== id) recapChapter = null;
    loadLevel(); persist(); return true;
  }
  function renderPhases() {
    const strip = q("#blocks-phases"); strip.hidden = isPractice();
    strip.replaceChildren();
    if (isPractice()) return;
    chapterLessons(currentChapter()).forEach((lesson, index) => {
      const button = document.createElement("button"); button.type = "button";
      button.className = "blocks-phase-button"; button.dataset.blocksPhase = lesson.kind;
      const done = Boolean(state.awards[lesson.id]), selected = lesson.id === current().id;
      button.dataset.state = done ? "done" : selected ? "current" : "new";
      button.setAttribute("aria-pressed", String(selected));
      if (selected) button.setAttribute("aria-current", "step");
      const number = document.createElement("span"); number.className = "blocks-phase-number";
      number.textContent = done ? "✓" : String(index + 1);
      button.append(number, document.createTextNode(phaseLabel(lesson.kind)));
      button.disabled = busy; button.addEventListener("click", () => changeLevel(lessons.indexOf(lesson)));
      strip.append(button);
    });
  }
  let hybridOrigin = "blocks";
  try { if (localStorage.getItem("pip-python-lab.hybrid-origin") === "python") hybridOrigin = "python"; } catch { /* Optional preference. */ }
  let learningStage = "python", active = false, busy = false, serial = 0, token = 0, sequence = [], pileOrder = [], robot, position, angle = 0;
  let cells = [], coins = new Set(), message = { kind: "ready" }, highlighted = -1, loopHighlights = [], drag = null, touch = null, suppressClick = false;
  const views = new Map(), parked = new Map();
  const autoWatched = new Set(); let selectedGap = null;
  // Recaps are navigation state only; awards remain the source of completion.
  let recapChapter = raw?.recapChapter === currentChapter()?.id && chapterComplete(currentChapter()) ? raw.recapChapter : null;
  const isRecap = () => !isPractice() && recapChapter === currentChapter()?.id && chapterComplete(currentChapter());
  // The map parks playback without stopping it or replacing a child's work.
  let mapPauseCount = 0;
  const mapWaiters = new Set();
  function releaseMapWaiters() { for (const resolve of mapWaiters) resolve(); mapWaiters.clear(); }
  async function waitForMap(ticket) {
    while (mapPauseCount && ticket === token && active) await new Promise(resolve => mapWaiters.add(resolve));
    return ticket === token && active;
  }
  const mapAnimations = new Map(), playbackWaits = new Set();
  function resumePlaybackWait(waiter) {
    if (mapPauseCount || waiter.timer !== null) return;
    waiter.started = performance.now();
    waiter.timer = setTimeout(() => {
      waiter.timer = null; playbackWaits.delete(waiter); waiter.resolve();
    }, waiter.remaining);
  }
  function waitForPlayback(milliseconds) {
    return new Promise(resolve => {
      const waiter = { remaining: milliseconds, started: 0, timer: null, resolve };
      playbackWaits.add(waiter); resumePlaybackWait(waiter);
    });
  }
  function pauseForMap() {
    mapPauseCount++;
    for (const waiter of playbackWaits) {
      if (waiter.timer === null) continue;
      waiter.remaining = Math.max(0, waiter.remaining - (performance.now() - waiter.started));
      clearTimeout(waiter.timer); waiter.timer = null;
    }
    for (const animation of workspace.getAnimations?.({ subtree: true }) || []) {
      if (animation.playState !== "running") continue;
      mapAnimations.set(animation, token); animation.pause();
    }
    let released = false;
    return () => {
      if (released) return;
      released = true; mapPauseCount--;
      if (!mapPauseCount) {
        for (const [animation, ticket] of mapAnimations) {
          if (active && ticket === token && animation.playState === "paused" && animation.effect?.target?.isConnected) animation.play();
        }
        mapAnimations.clear();
        for (const waiter of playbackWaits) resumePlaybackWait(waiter);
        releaseMapWaiters(); maybeAutoWatch();
      }
    };
  }
  const handledPointerClicks = new WeakMap();
  const availableTypes = () => isPractice() ? practice.types(practiceState.difficulties[practiceState.mode], practiceState.mode) : current().inventory;
  const netEarnings = () => model.earnings(state, lessons) - model.spending(state) + practiceState.earned + (global.PipHybrid?.getEarnings() || 0);
  const signature = cards => cards.slice(0, engine.scoreSize(cards)).map(card => typeof card === "string" ? card : card.type).join("|");
  global.PipSkins.setAdditionalEarningsProvider(netEarnings);
  if (!global.PipTutorial) global.PipSkins.createShop({ getEarned: () => 0, getLocale: locale, onChange() {} });
  function persist() {
    if (global.PipResetInProgress) return false;
    state.lessonId = lessons[state.index].id;
    (state.chapterStages ||= {})[lessons[state.index].sourceChapterId] = state.lessonId;
    if (!isPractice() && !isReadOnly()) state.drafts[current().id] = sequence.map(card => card.type);
    else if (isPractice() && !isRead()) session().draft = sequence.map(card => card.type);
    state.revealed = [...revealed];
    try { localStorage.setItem(practiceKey, JSON.stringify(practiceState)); localStorage.setItem(key, JSON.stringify({ ...state, recapChapter })); return true; }
    catch { return false; }
  }
  function saveView() {
    const indexes = name => cells.flatMap((cell, i) => cell.classList.contains(name) ? [i] : []);
    views.set(current().id, { position: { ...position }, coins: [...coins], trails: indexes("trail"), mistakes: indexes("blocks-mistake"), expected: indexes("blocks-expected"), message });
  }
  function loadLevel() {
    const lesson = current();
    // Like Python, authored tasks do not ration commands. Keep every palette
    // position stable while the learner fills gaps or rearranges indentation.
    const available = availableTypes();
    pileOrder = [...new Set(available.filter(type => type !== "END"))];
    if (available.some(engine.isOpener)) pileOrder.push("END");
    selectedGap = null;
    const draft = isReadOnly() ? lesson.solution : isPractice() ? session().draft : state.drafts[lesson.id] ?? lesson.starter ?? [];
    sequence = draft.filter(type => type === "GAP" || type === "END" || engine.definition(type)).map(type => ({ type, id: ++serial }));

    highlighted = -1; loopHighlights = []; drawBoard();
    if (isRead() && !views.has(lesson.id)) replayRead();
    render(); maybeAutoWatch();
  }
  function drawBoard() {
    const scenario = current().scenario; board.replaceChildren(); cells = [];
    for (let row = 0; row < 5; row++) for (let column = 0; column < 5; column++) {
      const cell = document.createElement("div"); cell.className = "cell";
      cell.classList.toggle("start", scenario.start.row === row && scenario.start.column === column);
      cell.classList.toggle("goal", scenario.goal?.row === row && scenario.goal?.column === column);
      cell.classList.toggle("obstacle", scenario.obstacles.some(([r, c]) => r === row && c === column));
      if ((scenario.coins || []).some(([r, c]) => r === row && c === column)) {
        const coin = document.createElement("span"); coin.className = "tutorial-coin"; coin.textContent = "●"; coin.setAttribute("aria-hidden", "true"); cell.append(coin);
      }
      board.append(cell); cells.push(cell);
    }
    robot = document.createElement("div"); robot.className = "robot"; robot.innerHTML = "<span>•‿•</span>"; board.append(robot);
    const view = views.get(current().id); coins = new Set(view?.coins || []); message = view?.message || { kind: "ready" };
    for (const i of view?.trails || []) cells[i].classList.add("trail");
    for (const i of view?.mistakes || []) cells[i].classList.add("blocks-mistake");
    for (const i of view?.expected || []) cells[i].classList.add("blocks-expected");
    place(view?.position || scenario.start, true); renderWallet();
  }
  function place(next, instant = false) {
    const directions = ["up", "right", "down", "left"], target = directions.indexOf(next.direction) * 90;
    if (instant || !position) angle = target;
    else { let delta = target - directions.indexOf(position.direction) * 90; if (delta > 180) delta -= 360; if (delta < -180) delta += 360; angle += delta; }
    position = { row: next.row, column: next.column, direction: next.direction };
    const cell = cells[next.row * 5 + next.column]; if (!cell) return;
    robot.style.transition = instant ? "none" : "";
    robot.style.transform = `translate(${cell.offsetLeft + (cell.offsetWidth - robot.offsetWidth) / 2}px, ${cell.offsetTop + (cell.offsetHeight - robot.offsetHeight) / 2}px)`;
    robot.style.setProperty("--angle", angle + "deg");
    board.dataset.row = next.row; board.dataset.column = next.column; board.dataset.direction = next.direction;
  }
  function renderWallet() {
    const total = global.PipSkins.getBalance();
    q("#blocks-wallet").textContent = t("Wallet: ", "Persely: ") + total + " ◉";
    q("#blocks-wallet").dataset.total = total;
    for (const [r, c] of current().scenario.coins || []) cells[r * 5 + c]?.classList.toggle("coin-collected", coins.has(r + "," + c));
  }
  function tile(card, source, count) {
    const definition = card.type === "GAP" ? { color: "#c8bbdf", icon: "…", label: t("Fill this gap", "Ide tegyél egy lapkát!") } : engine.definition(card.type, locale());
    const button = document.createElement("button"); button.type = "button"; button.className = "block-tile";
    button.dataset.cardId = card.id; button.dataset.type = card.type; button.dataset.source = source;
    button.style.setProperty("--tile-color", definition.color); button.draggable = !busy; button.disabled = busy;
    const icon = document.createElement("span"); icon.className = "block-tile-icon"; icon.textContent = definition.icon;
    const label = document.createElement("span"); label.className = "block-tile-label"; label.textContent = definition.label;
    button.append(icon, label);
    if (count !== undefined) { const badge = document.createElement("span"); badge.className = "block-tile-count"; badge.textContent = count; button.append(badge); }
    if (isReadOnly()) { button.draggable = false; button.classList.add("block-readonly"); }
    return button;
  }
  function renderTiles() {
    const scroll = program.scrollLeft;
    program.replaceChildren();
    const gapType = current().solution[current().starter?.indexOf("GAP")] || "FORWARD";
    const depths = engine.depths(sequence.map(card => card.type === "GAP" ? { type: gapType } : card));
    sequence.forEach((card, i) => {
      const button = tile(card, "program"); button.dataset.index = i; button.dataset.depth = depths[i];
      button.style.setProperty("--depth", depths[i]);
      button.classList.toggle("block-active", highlighted === i); button.classList.toggle("block-loop-active", loopHighlights.includes(i));
      button.classList.toggle("block-error", message.index === i);
      if (card.type === "END") button.classList.add("block-end");
      if (card.type === "GAP") {
        button.classList.add("block-gap"); button.draggable = false;
        button.setAttribute("aria-pressed", String(selectedGap === card.id));
      }
      program.append(button);
    });
    // The compact shelf is task-specific, while More retains every permitted
    // learned tile. Taking a copy never changes its fixed palette position.
    palette.update({ available: pileOrder, reference: current().solution,
      starter: current().starter || [], completion: !isPractice() && current().kind === "complete",
      key: current().id, locale: locale(), hidden: isReadOnly(), disabled: busy });
    program.scrollLeft = scroll;
  }
  function renderFeedback() {
    const copy = {
      ready: "",
      "read-success": t("Correct!", "Helyes!"),
      "read-mismatch": t(`Action ${(message.actionIndex ?? 0) + 1} differs. See the marked block and square.`, `A(z) ${(message.actionIndex ?? 0) + 1}. lépés eltér. Nézd meg a jelölt lapkát és mezőt!`),
      "read-long": t("That is a very long route. Check it or undo a few actions.", "Ez már nagyon hosszú útvonal. Ellenőrizd, vagy vonj vissza néhány lépést!"),
      "practice-success": t("You did it!", "Sikerült!"),
      "watch-complete": t("Example complete.", "Vége a példának."),
      "missing-gap": t("Put a tile in the empty spot first.", "Előbb tegyél lapkát az üres helyre!"),
      "missing-concept": t("You reached the star. ", "Elérted a csillagot. ") + goals.instruction(current(), locale()),
      running: t("Running…", "Fut…"),
      stopped: t("Stopped.", "Leállítva."),
      unfinished: t("Not at the star yet.", "Még nincs a csillagnál."),
      obstacle: t("That step is blocked.", "Arra nem tud lépni."),
      "missing-coins": t("Some coins are still on the board. Collect them before the star.", "Maradt érme a táblán. Gyűjtsd össze a csillag előtt!"),
      "extra-end": t("This END has no opening tile.", "Ehhez a VÉGE lapkához nem tartozik csoport."),
      "operation-limit": t("The loop did not finish.", "A ciklus nem ért véget."),
      "event-limit": t("That is a very long route. Try a shorter program.", "Ez nagyon hosszú útvonal. Próbálj rövidebb programot!"),
      revealed: t("Example shown. Build your own solution to earn rewards.", "Ez a mintamegoldás. Saját programmal szerezhetsz jutalmat."),
      storage: t("Your browser could not save this. Your wallet was not charged.", "A böngésző nem tudta menteni. Nem vontunk le érmét."),
    };
    const feedback = q("#blocks-feedback"); feedback.dataset.kind = message.kind;
    if (message.kind === "success") {
      feedback.textContent = "★".repeat(message.stars) + "  " + t("You did it!", "Sikerült!") + (message.earned ? "  +" + message.earned + " ◉" : "");
    } else { feedback.textContent = copy[message.kind] ?? t("Check your tiles and try again.", "Nézd át a lapkákat, és próbáld újra!"); }
    if (["read-success", "practice-success"].includes(message.kind) && message.earned) feedback.textContent += "  +" + message.earned + " ◉";
    q("#blocks-practice-link").hidden = !isPractice() || !["practice-success", "read-success"].includes(message.kind);
    q("#blocks-practice-link").textContent = isRead() ? t("Try building →", "Építs te is →") : t("Practice reading →", "Gyakorold az olvasást →");
    if (!isPractice() && current().kind === "create" && chapterComplete(currentChapter()) && message.kind === "success") {
      feedback.textContent = t("Lesson complete! ", "Kész a lecke! ") + feedback.textContent;
    }
    q("#blocks-continue").hidden = isPractice() ? !["read-success", "practice-success"].includes(message.kind) : busy || !state.awards[current().id];
    if (!isPractice()) {
      const next = nextCoursePhase();
      q("#blocks-continue").textContent = next ? phaseLabel(next.kind) + " · Enter →"
        : t("Lesson complete · Enter →", "Lecke kész · Enter →");
    }
  }
  function render() {
    picker.querySelector('[data-learning-stage="blocks"]').textContent = t("Blocks", "Blokkok");
    picker.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.learningStage === (learningStage === "hybrid" ? hybridOrigin : learningStage))));
    renderHybridNavigation();
    workspace.dataset.blocksMode = practiceState.mode; workspace.dataset.courseKind = !isPractice() ? current().kind : "";
    for (const button of header.querySelectorAll("[data-blocks-mode]")) {
      button.textContent = ({ course: t("Course", "Tanfolyam"), read: t("Read", "Olvasás"), build: t("Build", "Építés"), hybrid: t("Hybrid", "Hibrid") })[button.dataset.blocksMode];
      button.setAttribute("aria-pressed", String(button.dataset.blocksMode === practiceState.mode));
      if (button.dataset.blocksMode === "hybrid") button.hidden = !global.PipHybrid;
    }
    q(".blocks-navigation").hidden = isPractice(); q(".blocks-practice-options").hidden = !isPractice();
    const difficulty = q("#blocks-difficulty");
    difficulty.replaceChildren(...difficultyOptions(isPractice() ? practiceState.mode : "read").map(level => { const option = document.createElement("option"); option.value = level.id; option.textContent = level.label[locale()]; return option; }));
    difficulty.value = practiceState.difficulties[practiceState.mode] || "commands"; difficulty.disabled = busy;
    q("#blocks-new").textContent = t("New task", "Új feladat"); q("#blocks-new").disabled = busy;
    q("#blocks-chapter").textContent = t("BLOCKS · ", "BLOKKOK · ") + (isPractice() ? t("PRACTICE", "GYAKORLÁS") : t("LESSON ", "LECKE ") + (chapters.indexOf(currentChapter()) + 1) + " / " + chapters.length);
    q("#blocks-title").textContent = isPractice() ? current().title[locale()] : currentChapter().label[locale()];
    const select = q("#blocks-level"); select.replaceChildren(...chapters.map((chapter, i) => {
      const option = document.createElement("option"); option.value = chapter.id;
      option.textContent = (chapterComplete(chapter) ? "✓ " : "") + (i + 1) + ". " + chapter.label[locale()]; return option;
    })); select.value = currentChapter().id; select.disabled = busy;
    q("#blocks-previous").disabled = busy || chapters.indexOf(currentChapter()) === 0; q("#blocks-next").disabled = busy || chapters.indexOf(currentChapter()) === chapters.length - 1;
    renderPhases();
    const texts = {
      "#blocks-program-title": isReadOnly() ? t("Program", "Program") : t("Your program", "A programod"),
      "#blocks-run": isRead() ? t("✓ Check · Enter", "✓ Ellenőrzés ↵") : busy ? t("■ Stop", "■ Megállítom") : t("▶ Run", "▶ Futtatás"), "#blocks-reset": t("↺ To start", "↺ A rajthoz"),
      "#blocks-order": t("START →", "KEZDET →"), "#blocks-clear": t("Return all", "Mind vissza"),
      "#blocks-pile-title": isRead() ? t("Your turn", "Te következel") : t("Available tiles", "Lapkáim"),
      "#blocks-world-label": "KOJA", "#blocks-world-title": t("Koja’s world", "Koja pályája"),
      "#blocks-shop": t("Shop", "Bolt"),
    };
    for (const [selector, text] of Object.entries(texts)) q(selector).textContent = text;
    if (isPractice()) q("#blocks-continue").textContent = t("New task →", "Új feladat →");
    pile.hidden = isReadOnly(); q(".blocks-read-controls").hidden = !isRead(); q("#blocks-clear").hidden = isReadOnly();
    q("#blocks-read-undo").textContent = t("↶ Undo", "↶ Vissza");
    q("#blocks-read-undo").disabled = !isRead() || !readActions().length;
    q("#blocks-read-count").textContent = isRead() ? t("Actions: ", "Lépések: ") + readActions().length : "";
    q("#blocks-run").disabled = !isRead() && !busy && !sequence.length;
    q("#blocks-clear").disabled = busy || !sequence.length;
    renderTiles(); renderWallet(); renderFeedback(); renderRecap();
  }
  function editDone(focusIndex) {
    message = { kind: "ready" }; highlighted = -1; loopHighlights = []; persist(); render(); saveView();
    if (focusIndex !== undefined) program.children[Math.max(0, focusIndex)]?.focus({ preventScroll: true });
  }
  function add(cardId, index) {
    if (busy || isReadOnly() || sequence.length >= 160) return;
    const type = String(cardId).startsWith("free-") ? String(cardId).slice(5) : cardId === "end" ? "END" : null;
    if (!type || !pileOrder.includes(type)) return;
    if (index === undefined) {
      index = sequence.findIndex(card => card.type === "GAP" && (selectedGap === null || card.id === selectedGap));
      if (index < 0) index = sequence.length;
    }
    if (sequence[index]?.type === "GAP") sequence.splice(index, 1);
    sequence.splice(index, 0, { type, id: ++serial }); selectedGap = null; editDone();
    program.children[index]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }
  function remove(cardId) {
    const index = sequence.findIndex(card => card.id === Number(cardId)); if (busy || isReadOnly() || index < 0) return;
    if (sequence[index].type === "GAP") { selectedGap = sequence[index].id; renderTiles(); return; }
    sequence.splice(index, 1); editDone();
  }
  function move(cardId, targetIndex) {
    const from = sequence.findIndex(card => card.id === Number(cardId)); if (busy || isReadOnly() || from < 0) return;
    const [card] = sequence.splice(from, 1); if (from < targetIndex) targetIndex--;
    sequence.splice(targetIndex, 0, card); editDone(targetIndex);
  }
  function dropAt(source, target, x) {
    if (!source || busy) return;
    if (target?.closest("#blocks-pile")) { if (source.source === "program") remove(source.id); return; }
    if (!target?.closest("#blocks-program")) return;
    const card = target.closest("[data-index]");
    let index = card ? Number(card.dataset.index) + (card.dataset.type !== "GAP" && x > card.getBoundingClientRect().left + card.offsetWidth / 2 ? 1 : 0) : sequence.length;
    if (source.source === "pile") add(source.id, index); else move(source.id, index);
  }
  function clearDrop() { workspace.querySelectorAll(".block-drop-before,.block-drop-after,.blocks-drop").forEach(el => el.classList.remove("block-drop-before", "block-drop-after", "blocks-drop")); }
  function indicateDrop(target, x) {
    clearDrop(); const strip = target?.closest(".blocks-strip"); if (!strip) return; strip.classList.add("blocks-drop");
    const tile = target.closest('#blocks-program [data-index]');
    if (tile) tile.classList.add(x > tile.getBoundingClientRect().left + tile.offsetWidth / 2 ? "block-drop-after" : "block-drop-before");
    if (strip === program) { const bounds = strip.getBoundingClientRect(); if (x > bounds.right - 35) strip.scrollLeft += 18; if (x < bounds.left + 35) strip.scrollLeft -= 18; }
  }
  workspace.addEventListener("click", event => {
    const card = event.target.closest(".block-tile"); if (!card || card.disabled || busy) return;
    if (suppressClick || event.pointerType === "touch" || event.pointerType === "pen" || (handledPointerClicks.get(card) || 0) > performance.now()) { suppressClick = false; return; }
    if (card.dataset.source === "pile") add(card.dataset.cardId); else remove(card.dataset.cardId);
  });
  workspace.addEventListener("dragstart", event => {
    const card = event.target.closest(".block-tile"); if (!card || card.disabled || busy || isReadOnly()) { event.preventDefault(); return; }
    drag = { id: card.dataset.cardId, source: card.dataset.source }; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", card.dataset.cardId);
  });
  workspace.addEventListener("dragover", event => { if (!drag || !event.target.closest(".blocks-strip")) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; indicateDrop(event.target, event.clientX); });
  workspace.addEventListener("drop", event => { if (!drag) return; event.preventDefault(); const source = drag; drag = null; clearDrop(); dropAt(source, event.target, event.clientX); });
  workspace.addEventListener("dragend", () => { drag = null; clearDrop(); });
  workspace.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || busy || isReadOnly()) return;
    const card = event.target.closest(".block-tile"); if (!card || card.disabled) return;
    touch = { pointerId: event.pointerId, element: card, id: card.dataset.cardId, source: card.dataset.source, x: event.clientX, y: event.clientY, ghost: null };
    if (card.dataset.source === "pile") palette.pointerDown(event);
    card.setPointerCapture(event.pointerId);
  });
  workspace.addEventListener("pointermove", event => {
    if (!touch || touch.pointerId !== event.pointerId) return;
    if (palette.pointerMove(event)) return;
    if (!touch.ghost && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 8) {
      touch.ghost = workspace.querySelector(`[data-card-id="${touch.id}"]`).cloneNode(true); touch.ghost.classList.add("block-drag-ghost"); touch.ghost.removeAttribute("data-card-id"); document.body.append(touch.ghost);
    }
    if (touch.ghost) { event.preventDefault(); touch.ghost.style.left = event.clientX - 34 + "px"; touch.ghost.style.top = event.clientY - 34 + "px"; indicateDrop(document.elementFromPoint(event.clientX, event.clientY), event.clientX); }
  });
  workspace.addEventListener("pointerup", event => {
    if (!touch || touch.pointerId !== event.pointerId) return;
    const source = touch; touch = null;
    // Touch browsers may omit the compatibility click after captured dragging.
    // Handle the tap here and ignore a later synthetic click on this old node.
    event.preventDefault(); handledPointerClicks.set(source.element, performance.now() + 600);
    if (palette.pointerUp(event)) { clearDrop(); return; }
    if (source.ghost) { source.ghost.remove(); suppressClick = true; dropAt(source, document.elementFromPoint(event.clientX, event.clientY), event.clientX); setTimeout(() => { suppressClick = false; }, 0); }
    else if (source.source === "pile") add(source.id);
    else remove(source.id);
    clearDrop();
  });
  workspace.addEventListener("pointercancel", () => { palette.pointerCancel(); touch?.ghost?.remove(); touch = null; clearDrop(); });
  program.addEventListener("keydown", event => {
    if (isWatch() && event.key === "Enter" && !event.repeat && !event.isComposing
      && !event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      if (state.awards[current().id]) advanceCourse();
      else void run();
      return;
    }
    const card = event.target.closest(".block-tile"); if (!card || busy || !event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault(); const index = Number(card.dataset.index);
    move(card.dataset.cardId, event.key === "ArrowLeft" ? Math.max(0, index - 1) : Math.min(sequence.length, index + 2));
  });
  function showPair(target) {
    program.querySelectorAll(".block-paired").forEach(card => card.classList.remove("block-paired"));
    const card = target?.closest("[data-index]"); if (!card || busy) return;
    const pair = engine.structure(sequence).pairs.find(pair => pair.includes(Number(card.dataset.index)));
    if (pair) pair.forEach(index => program.children[index]?.classList.add("block-paired"));
  }
  program.addEventListener("pointerover", event => showPair(event.target));
  program.addEventListener("pointerleave", () => showPair(null));
  program.addEventListener("focusin", event => showPair(event.target));
  program.addEventListener("focusout", () => showPair(null));
  function resetBoard() {
    stop(false); coins.clear(); cells.forEach(cell => cell.classList.remove("trail", "coin-collected", "blocks-mistake", "blocks-expected"));
    if (isRead()) setReadActions([]);
    highlighted = -1; loopHighlights = []; message = { kind: "ready" }; place(current().scenario.start, true); render(); saveView(); persist();
  }
  function stop(feedback = true) { token++; releaseMapWaiters(); busy = false; if (feedback) message = { kind: "stopped" }; render(); saveView(); }
  async function run() {
    if (isRecap()) return;
    if (isRead()) { evaluateRead(); return; }
    if (busy) { stop(); return; }
    if (!sequence.length) return;
    const gap = sequence.findIndex(card => card.type === "GAP");
    if (gap >= 0) { message = { kind: "missing-gap", index: gap }; render(); return; }
    resetBoard(); const result = engine.execute(sequence, current().scenario, { maxEvents: 160, maxOperations: 3000 });
    if (!result.ok) { message = { kind: result.error.code, index: result.error.index }; render(); program.children[result.error.index]?.scrollIntoView({ block: "nearest", inline: "nearest" }); return; }
    busy = true; message = { kind: "running" }; const ticket = ++token; render();
    // Give the child time to see the original program before Koja moves.
    if (isWatch()) await waitForPlayback(current().exampleStepDuration || 1800);
    for (const event of result.events) {
      if (!await waitForMap(ticket)) return;
      highlighted = event.index; loopHighlights = event.loops || [];
      renderTiles(); program.children[highlighted]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      if (event.type === "obstacle") { busy = false; message = { kind: "obstacle", index: event.index }; render(); saveView(); return; }
      if (event.type !== "goal") {
        place(event);
        if (event.type === "forward") {
          cells[event.row * 5 + event.column].classList.add("trail");
          const coin = [event.row, event.column].join(",");
          if ((current().scenario.coins || []).some(cell => cell.join(",") === coin)) coins.add(coin);
          renderWallet();
        }
        await waitForPlayback(isWatch() ? current().exampleStepDuration || 1800 : global.PipPlayback?.delay("run") ?? 700);
      }
    }
    if (!await waitForMap(ticket)) return;
    busy = false; highlighted = -1; loopHighlights = [];
    if (isWatch()) { finishCourse("watch-complete", false); }
    else if (!result.state.goal_reached) message = { kind: "unfinished" };
    else if (coins.size < (current().scenario.coins || []).length) message = { kind: "missing-coins" };
    else if (!isPractice() && !goals.check(current(), sequence, result.events)) message = { kind: "missing-concept" };
    else if (isPractice()) { finishPractice("practice-success"); }
    else if (revealed.has(current().id) && signature(sequence) === signature(current().solution)) message = { kind: "revealed" };
    else finishCourse("success", true);
    persist(); render(); saveView();
  }
  function finishCourse(kind, withCelebration = true) {
    const before = model.earnings(state, lessons), previous = state.awards[current().id];
    const count = engine.scoreSize(sequence.filter(card => card.type !== "GAP"));
    model.award(state, current(), count, [...coins]);
    if (!persist()) { if (previous) state.awards[current().id] = previous; else delete state.awards[current().id]; message = { kind: "storage" }; }
    else {
      message = { kind, stars: model.summary(count, engine.scoreSize(current().solution)).stars, earned: model.earnings(state, lessons) - before };
      if (withCelebration) celebrate();
    }
    global.PipSkins.refreshWallet();
  }
  function maybeAutoWatch() {
    const canStart = () => active && isWatch() && !isRecap() && !busy && !mapPauseCount && !global.PipWelcomePending
      && !document.querySelector("dialog[open]") && !autoWatched.has(current().id) && !state.awards[current().id];
    if (!canStart()) return;
    const id = current().id, ticket = token;
    requestAnimationFrame(() => {
      // A pending paint must not start a different lesson or consume the
      // autoplay opportunity while the welcome/map/dialog is covering it.
      if (ticket !== token || current().id !== id || !canStart()) return;
      autoWatched.add(id); void run();
    });
  }
  function celebrate() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const confetti = document.createElement("div"); confetti.className = "blocks-confetti";
    for (let i = 0; i < 18; i++) { const bit = document.createElement("i"); bit.style.cssText = `--x:${(Math.random() - .5) * 260}px;--r:${Math.random() * 720}deg;background:${["#7357d9", "#e9b749", "#57ae92"][i % 3]};animation-delay:${Math.random() * .18}s`; confetti.append(bit); }
    q(".blocks-board-dock").append(confetti); setTimeout(() => confetti.remove(), 1500);
  }
  function changeLevel(index) {
    if (busy || !lessons[index] || index === state.index && !isRecap()) return;
    persist(); saveView(); recapChapter = null; state.index = index; loadLevel(); persist();
  }

  q("#blocks-run").addEventListener("click", () => void run());
  q("#blocks-reset").addEventListener("click", resetBoard);
  q("#blocks-clear").addEventListener("click", () => { if (busy || isReadOnly()) return; sequence = []; editDone(); });
  q("#blocks-previous").addEventListener("click", () => { const chapter = chapters[chapters.indexOf(currentChapter()) - 1]; if (chapter) openChapter(chapter.id); });
  q("#blocks-next").addEventListener("click", () => { const chapter = chapters[chapters.indexOf(currentChapter()) + 1]; if (chapter) openChapter(chapter.id); });
  q("#blocks-continue").addEventListener("click", () => isPractice() ? newTask() : advanceCourse());
  q("#blocks-level").addEventListener("change", event => openChapter(event.target.value));
  q("#blocks-recap-next").addEventListener("click", continueAfterRecap);
  q("#blocks-recap-back").addEventListener("click", () => {
    recapChapter = null; persist(); render(); q("#blocks-run").focus({ preventScroll: true });
  });
  workspace.querySelectorAll("[data-blocks-practice]").forEach(button => button.addEventListener("click", () => startChapterPractice(button.dataset.blocksPractice)));
  q("#blocks-shop").addEventListener("click", () => { if (busy) stop(); global.PipSkins.openShop(); });
  function switchStage(next) {
    if (!["blocks", "hybrid", "python"].includes(next) || next === learningStage || (next === "hybrid" && !global.PipHybrid)) return;
    if (active) { if (busy) stop(); persist(); saveView(); }
    if (learningStage === "hybrid") global.PipHybrid?.setActive(false);
    if (learningStage === "python" && next !== "python") {
      global.PipSuspendNative?.(); global.PipTutorial?.setParked(true);
      for (const element of [...main.children, ...shell.querySelectorAll(":scope > .campaign-slot, :scope > .tutorial-header")]) {
        if (element !== workspace && !element.classList.contains("hybrid-workspace")) { parked.set(element, element.inert); element.inert = true; }
      }
    }
    learningStage = next; active = next === "blocks";
    if (next === "python") {
      delete shell.dataset.learningStage;
      for (const [element, wasInert] of parked) element.inert = wasInert;
      parked.clear(); global.PipTutorial?.setParked(false);
    } else shell.dataset.learningStage = next;
    header.hidden = workspace.hidden = !active;
    if (next === "hybrid") global.PipHybrid.setActive(true);
    render(); if (active) { place(position, true); maybeAutoWatch(); }
    global.dispatchEvent(new Event("resize"));
    if (!global.PipResetInProgress) try { localStorage.setItem(stageKey, next); } catch { /* Optional preference. */ }
  }
  picker.addEventListener("click", event => { const button = event.target.closest("[data-learning-stage]"); if (button) switchStage(button.dataset.learningStage); });
  const nativeHybridButtons = [...main.querySelectorAll(".mode-switch")].map(group => {
    const button = document.createElement("button"); button.type = "button"; button.className = "native-hybrid-entry";
    button.setAttribute("aria-pressed", "false"); group.append(button);
    button.addEventListener("click", () => openHybrid("python")); return button;
  });
  function openHybrid(origin, difficulty) {
    if (!global.PipHybrid || !["blocks", "python"].includes(origin)
      || (difficulty !== undefined && !difficultyOptions("read").some(level => level.id === difficulty))) return false;
    hybridOrigin = origin;
    if (!global.PipResetInProgress) try { localStorage.setItem("pip-python-lab.hybrid-origin", origin); } catch { /* Optional preference. */ }
    switchStage("hybrid");
    global.PipHybrid.openPractice(difficulty);
    render();
    return true;
  }
  function renderHybridNavigation() {
    nativeHybridButtons.forEach(button => { button.textContent = t("Hybrid", "Hibrid"); button.hidden = !global.PipHybrid; });
    const nav = shell.querySelector(".hybrid-activity-nav"); if (!nav) return;
    nav.setAttribute("role", "group");
    const labels = { course: t("Course", "Tanfolyam"), read: t("Read", "Olvasás"), build: hybridOrigin === "python" ? t("Write", "Írás") : t("Build", "Építés"), hybrid: t("Hybrid", "Hibrid") };
    if (!nav.children.length) {
      for (const value of ["course", "read", "build", "hybrid"]) { const button = document.createElement("button"); button.type = "button"; button.dataset.hybridActivity = value; nav.append(button); }
      nav.addEventListener("click", event => {
        const activity = event.target.closest("[data-hybrid-activity]")?.dataset.hybridActivity;
        if (!activity || activity === "hybrid") return;
        if (hybridOrigin === "blocks") { switchStage("blocks"); changeMode(activity); }
        else {
          switchStage("python");
          if (activity === "course") document.querySelector("#tutorial-mode")?.click();
          else {
            const nativeMode = activity === "build" ? "write" : "read";
            if (global.PipTutorial?.isActive()) document.querySelector(`[data-tutorial-tab="${nativeMode}"]`)?.click();
            else document.querySelector(`#${nativeMode}-mode`)?.click();
          }
        }
      });
    }
    for (const button of nav.children) { button.textContent = labels[button.dataset.hybridActivity]; button.setAttribute("aria-pressed", String(button.dataset.hybridActivity === "hybrid")); }
  }

  const switchLanguage = global.PipSetLanguage;
  global.PipSetLanguage = next => { const result = switchLanguage(next); if (result !== false) { render(); if (active) { place(position, true); maybeAutoWatch(); } global.PipHybrid?.refreshLanguage(); } return result; };
  // Native Python keyboard handlers stay parked in either visual stage.
  global.PipLearningStage = Object.freeze({
    isBlocks: () => learningStage !== "python", current: () => learningStage,
    origin: () => learningStage === "hybrid" ? hybridOrigin : learningStage,
    switchStage, openHybrid,
  });
  global.PipSkins.onWalletChange(() => { renderWallet(); });
  function handleBlocksKeydown(event) {
    if (!active || isRead() || mapPauseCount || global.PipWelcomePending || event.defaultPrevented || event.isComposing
      || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey || document.querySelector("dialog[open]")) return;
    if (event.target.closest("a,select,summary,input,textarea,[contenteditable=true],.monaco-editor")) return;
    const button = event.target.closest("button");
    if (button && button.id !== "blocks-run") return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.repeat || busy) return;
      if (isPractice() && message.kind === "practice-success") newTask();
      else if (!isPractice() && state.awards[current().id]) advanceCourse();
      else void run();
    }
    if (event.key === "Escape" && busy && !button) { event.preventDefault(); stop(); }
  }
  document.addEventListener("keydown", handleBlocksKeydown);

  // Practice uses the same editor and board, but never spends course tiles.
  function finishPractice(kind) {
    const saved = session(), before = practiceState.earned, solved = saved.solved;
    const earned = practiceModel.award(practiceState, saved);
    if (!persist()) { practiceState.earned = before; saved.solved = solved; message = { kind: "storage" }; }
    else { recordPracticeCompletion(saved); message = { kind, earned }; celebrate(); }
    global.PipSkins.refreshWallet();
  }
  function replayRead() {
    place(current().scenario.start, true);
    cells.forEach(cell => cell.classList.remove("trail", "blocks-mistake", "blocks-expected"));
    for (const action of readActions()) {
      const next = practice.step(position, action, current().scenario); place(next, true);
      if (action === "forward" && !next.blocked) cells[next.row * 5 + next.column].classList.add("trail");
    }
  }
  function readAction(action) {
    if (!active || !isRead() || isRecap() || global.PipWelcomePending || document.querySelector("dialog[open]")) return;
    if (action === "undo") { readActions().pop(); replayRead(); }
    else {
      if (readActions().length >= 1000) { message = { kind: "read-long" }; renderFeedback(); return; }
      readActions().push(action);
      const next = practice.step(position, action, current().scenario); place(next);
      if (action === "forward" && !next.blocked) cells[next.row * 5 + next.column].classList.add("trail");
    }
    cells.forEach(cell => cell.classList.remove("blocks-mistake", "blocks-expected"));
    highlighted = -1; loopHighlights = []; message = { kind: "ready" }; render(); saveView(); persist();
  }
  function evaluateRead() {
    const expected = practice.actions(current().solution, current().scenario);
    const result = practice.evaluate(expected, readActions(), current().scenario);
    cells.forEach(cell => cell.classList.remove("blocks-mistake", "blocks-expected"));
    if (result.ok) {
      if (isPractice()) finishPractice("read-success");
      else {
        for (const event of expected) if (event.type === "forward" && (current().scenario.coins || []).some(([r, c]) => r === event.row && c === event.column)) coins.add(event.row + "," + event.column);
        finishCourse("read-success");
      }
    }
    else {
      message = { kind: "read-mismatch", index: result.codeIndex, actionIndex: result.index };
      const point = result.position || position;
      cells[point.row * 5 + point.column]?.classList.add("blocks-mistake");
      const wanted = expected[result.index];
      if (wanted) cells[wanted.row * 5 + wanted.column]?.classList.add("blocks-expected");
    }
    render(); saveView(); persist();
    if (!result.ok) program.children[result.codeIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function changeMode(next) {
    if (!["course", "read", "build"].includes(next) || next === practiceState.mode) return;
    if (busy) stop(); persist(); saveView(); practiceState.mode = next;
    loadLevel(); persist();
  }
  function newTask() {
    if (!isPractice() || busy) return;
    views.delete(current().id); tasks.delete(sessionKey() + ":" + session().seed);
    practiceState.sessions[sessionKey()] = practiceModel.fresh(randomSeed());
    loadLevel(); persist();
  }
  header.addEventListener("click", event => {
    const button = event.target.closest("[data-blocks-mode]");
    if (button?.dataset.blocksMode === "hybrid") openHybrid("blocks");
    else if (button) changeMode(button.dataset.blocksMode);
  });
  q("#blocks-new").addEventListener("click", newTask);
  q("#blocks-difficulty").addEventListener("change", event => {
    if (!isPractice() || busy || !difficultyOptions(practiceState.mode).some(level => level.id === event.target.value)) return;
    persist(); saveView(); practiceState.difficulties[practiceState.mode] = event.target.value; loadLevel(); persist();
  });
  q("#blocks-practice-link").addEventListener("click", () => {
    if (practiceState.mode === "read") changeMode("build");
    else changeMode("read");
  });
  workspace.querySelectorAll("[data-blocks-action]").forEach(button => button.addEventListener("click", () => readAction(button.dataset.blocksAction)));
  q("#blocks-read-undo").addEventListener("click", () => readAction("undo"));
  function handleBlocksReadKeydown(event) {
    if (!active || !isRead() || isRecap() || busy || mapPauseCount || global.PipWelcomePending || event.defaultPrevented || event.isComposing
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector("dialog[open]")) return;
    if (event.target.closest("input,textarea,select,[contenteditable=true],.monaco-editor")) return;
    const action = { ArrowUp: "forward", ArrowLeft: "left", ArrowRight: "right", ArrowDown: "undo", Backspace: "undo" }[event.key];
    if (action) { event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) readAction(action); }
    if (event.key !== "Enter" || event.target.closest("a,summary,.topbar,.blocks-header,#blocks-phases")) return;
    const button = event.target.closest("button");
    if (button && !button.matches("#blocks-run,[data-blocks-action],#blocks-read-undo")) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    if (message.kind === "read-success") {
      if (isPractice()) newTask();
      else advanceCourse();
    } else evaluateRead();
  }
  document.addEventListener("keydown", handleBlocksReadKeydown, true);

  // Navigation reads live checkpoints: visiting the map never creates a new task.
  global.PipBlocksNavigation = Object.freeze({
    snapshot: () => ({
      active, mode: practiceState.mode, recap: isRecap(), currentLessonId: lessons[state.index].id, currentChapterId: currentChapter().id,
      chapters: chapters.map(chapter => ({ id: chapter.id, total: chapter.lessonIds.length,
        completed: chapter.lessonIds.filter(id => state.awards[id]).length,
        started: chapter.lessonIds.some(id => state.awards[id] || state.drafts[id]?.length || state.routes?.[id]?.length || views.has(id))
          || active && !isPractice() && currentChapter().id === chapter.id,
      })),
      difficulty: isPractice() ? practiceState.difficulties[practiceState.mode] : null,
      difficulties: { ...practiceState.difficulties }, busy, paused: mapPauseCount > 0,
      lessons: lessons.map((lesson, index) => ({
        id: lesson.id, completed: state.awards[lesson.id] ? 1 : 0, total: 1,
        started: Boolean(state.awards[lesson.id] || state.drafts[lesson.id]?.length || state.routes?.[lesson.id]?.length || views.has(lesson.id)
          || (active && !isPractice() && index === state.index)),
      })),
    }),
    openChapter,
    openLesson(id) {
      const index = lessons.findIndex(lesson => lesson.id === id);
      if (index < 0) return false;
      if (!isPractice() && index === state.index && !isRecap()) return true;
      if (busy) stop();
      persist(); saveView(); recapChapter = null; practiceState.mode = "course"; state.index = index; loadLevel(); persist();
      return true;
    },
    openPractice(mode, difficulty = practiceState.difficulties[mode]) {
      if (!["read", "build"].includes(mode) || !difficultyOptions(mode).some(level => level.id === difficulty)) return false;
      if (practiceState.mode === mode && practiceState.difficulties[mode] === difficulty) return true;
      if (busy) stop();
      persist(); saveView(); practiceState.mode = mode; practiceState.difficulties[mode] = difficulty;
      loadLevel(); persist();
      return true;
    },
    openHybrid: difficulty => openHybrid("blocks", difficulty), pauseForMap,
  });

  global.addEventListener("pagehide", persist);
  new ResizeObserver(() => { if (active && position) place(position, true); }).observe(board);
  loadLevel(); global.PipSkins.refreshWallet();
  try { const savedStage = localStorage.getItem(stageKey); if (["blocks", "hybrid"].includes(savedStage)) switchStage(savedStage); } catch { /* Python remains the default. */ }
})(window);
