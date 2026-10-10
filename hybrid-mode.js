// A separate bridge between Blocks and Python. No course or Python state is changed.
(function (global) {
  "use strict";
  const practice = global.PipBlocksPractice, scope = global.PipBlocksScope, model = global.PipHybridEngine;
  if (!practice || !scope || !model) return;
  const storageKey = "pip-python-lab.hybrid.v1";
  let saved; try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* First visit. */ }
  const practiceState = model.restore(saved, practice.difficulties);
  let state = practiceState, bridge = null, parkedPractice = null;
  const bridgeViews = new Map();
  const locale = () => global.PipLocale === "hu" ? "hu" : "en";
  const t = (en, hu) => locale() === "hu" ? hu : en;
  const seed = () => global.crypto?.getRandomValues ? global.crypto.getRandomValues(new Uint32Array(1))[0] : Date.now() >>> 0;
  if (state.seed === null) state.seed = seed();
  const shell = document.querySelector(".app-shell"), main = shell?.querySelector("main");
  if (!main) return;
  const header = document.createElement("nav"); header.className = "hybrid-header"; header.hidden = true;
  header.innerHTML = '<div class="hybrid-heading"><small id="hybrid-eyebrow"></small><strong id="hybrid-title"></strong></div><div class="hybrid-activity-nav"></div><div class="hybrid-navigation"><select id="hybrid-difficulty"></select><button type="button" id="hybrid-new"></button></div>';
  shell.querySelector(".topbar").after(header);
  const workspace = document.createElement("section"); workspace.className = "hybrid-workspace"; workspace.hidden = true;
  workspace.innerHTML = `
    <article class="editor-panel hybrid-editor">
      <div class="hybrid-task-options"><div id="hybrid-direction" class="hybrid-options" role="group"><button type="button" data-direction="to-python"></button><button type="button" data-direction="to-blocks"></button></div></div>
      <section class="hybrid-source-section"><div class="hybrid-strip-label"><strong id="hybrid-source-title"></strong><span id="hybrid-readonly"></span></div><div id="hybrid-source-blocks" class="hybrid-strip" role="list"></div><pre id="hybrid-source-code" tabindex="0"></pre></section>
      <section class="hybrid-target-section"><div class="hybrid-strip-label"><strong id="hybrid-target-title"></strong><div class="hybrid-controls"><button type="button" id="hybrid-clear"></button><button type="button" id="hybrid-run" class="button primary"></button></div></div>
        <div id="hybrid-code-wrap"><textarea id="hybrid-code" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea></div>
        <div id="hybrid-program" class="hybrid-strip" role="group"></div>
      </section>
      <section id="hybrid-pile-section"><div class="hybrid-strip-label"><strong id="hybrid-pile-title"></strong></div><div id="hybrid-pile" class="hybrid-strip" role="group"></div></section>
      <div id="hybrid-tools-row"><details id="hybrid-tools"><summary></summary><div id="hybrid-tool-list"></div></details><div id="hybrid-code-symbols"></div></div>
    </article>
    <aside class="world-panel hybrid-world"><div class="world-head"><div><p class="panel-eyebrow" id="hybrid-world-label"></p><h2 id="hybrid-world-title"></h2></div><button type="button" id="hybrid-reset" class="button ghost"></button></div><div class="board-stage"><div id="hybrid-board" class="board" role="img"></div></div><div class="hybrid-board-dock"><div class="hybrid-wallet-row"><strong id="hybrid-wallet"></strong><button type="button" id="hybrid-shop"></button></div><div id="hybrid-feedback" role="status" aria-live="polite"></div><div class="hybrid-result-actions"><span id="hybrid-runtime" role="status"></span><button id="hybrid-next" type="button" class="button primary" hidden></button></div></div></aside>`;
  main.append(workspace);
  const q = selector => workspace.querySelector(selector) || header.querySelector(selector);
  const code = q("#hybrid-code"), program = q("#hybrid-program"), pile = q("#hybrid-pile"), board = q("#hybrid-board");
  let task, expected, sourceText, active = false, busy = false, runToken = 0, worker = null, workerReady = false, workerStatus = "idle", pending = null, workerSequence = 0, loadTimer = null;
  let storageFailed = false;
  let cells = [], robot, position = null, angle = 0, feedback = { kind: "ready" }, sourceMark = -1, targetMark = -1, drag = null, touch = null, suppressClick = false;
  // A map is a temporary pause, not a cancelled Python run. Results wait too.
  let mapPauseCount = 0;
  const mapWaiters = new Set(), practiceViews = new Map();
  function releaseMapWaiters() { for (const resolve of mapWaiters) resolve(); mapWaiters.clear(); }
  async function waitForMap(token) {
    while (mapPauseCount && token === runToken && active) await new Promise(resolve => mapWaiters.add(resolve));
    return token === runToken && active;
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
    mapPauseCount++; pythonEditor.sync();
    for (const waiter of playbackWaits) {
      if (waiter.timer === null) continue;
      waiter.remaining = Math.max(0, waiter.remaining - (performance.now() - waiter.started));
      clearTimeout(waiter.timer); waiter.timer = null;
    }
    for (const animation of workspace.getAnimations?.({ subtree: true }) || []) {
      if (animation.playState !== "running") continue;
      mapAnimations.set(animation, runToken); animation.pause();
    }
    let released = false;
    return () => {
      if (released) return;
      released = true; mapPauseCount--; pythonEditor.sync();
      if (!mapPauseCount) {
        for (const [animation, ticket] of mapAnimations) {
          if (active && ticket === runToken && animation.playState === "paused" && animation.effect?.target?.isConnected) animation.play();
        }
        mapAnimations.clear();
        for (const waiter of playbackWaits) resumePlaybackWait(waiter);
        releaseMapWaiters();
      }
    };
  }
  function persist() {
    if (global.PipResetInProgress) return false;
    try { localStorage.setItem(storageKey, JSON.stringify(practiceState)); storageFailed = false; return true; }
    catch { storageFailed = true; return false; }
  }
  function types() { return bridge ? [...new Set(bridge.task.inventory)] : practice.types(state.difficulty, "read"); }
  const pythonEditor = global.PipPythonEditor.attach({
    textarea: code, host: q("#hybrid-code-wrap"), getLocale: locale,
    getEnabled: () => active && state.direction === "to-python" && !busy && !mapPauseCount && !document.querySelector("dialog[open]"),
    onChange() { state.code = code.value; if (!state.code.trim()) state.codeLocale = locale(); edited(); },
    onRun: run,
  });
  const tilePalette = global.PipBlockPalette.attach({
    pile, toolbar: q("#hybrid-pile-section .hybrid-strip-label"),
    createTile: (type, index) => tile(type, index, "pile"),
  });
  function translateDraft() {
    if (state.codeLocale === locale()) return;
    try {
      const result = global.PipCodeTranslation.translate(state.code, state.codeLocale, locale());
      const start = global.PipCodeTranslation.mapOffset(code.selectionStart, result.edits), end = global.PipCodeTranslation.mapOffset(code.selectionEnd, result.edits);
      state.code = result.code; state.codeLocale = locale(); code.value = state.code; code.setSelectionRange(start, end); pythonEditor.sync({ preserveHistory: true });
    } catch {
      // Ambiguous custom bindings remain intact and run in their original vocabulary.
      feedback = { kind: "translation" };
    }
  }
  function buildTask() {
    task = bridge ? bridge.task : practice.generate(state.seed, state.difficulty, "read");
    const result = scope.execute(task.solution, task.scenario);
    if (!result.ok) throw new Error("Hybrid task could not be prepared: " + result.error?.code);
    expected = model.actions(result.events);
    sourceText = {};
    sourceMark = targetMark = -1; feedback = { kind: "ready" }; code.value = state.code;
    drawBoard(); render(); persist();
  }
  function tile(type, index, source, depth = 0) {
    const definition = scope.definition(type, locale()), editable = source !== "source";
    const element = document.createElement(editable ? "button" : "span");
    element.className = "block-tile hybrid-tile";
    if (editable) { element.type = "button"; element.disabled = busy; element.draggable = !busy; }
    else element.setAttribute("role", "listitem");
    element.dataset.type = type; element.dataset.index = index; element.dataset.source = source;
    element.style.setProperty("--tile-color", definition.color); element.style.setProperty("--depth", depth);
    element.classList.toggle("block-end", type === "END");
    element.classList.toggle("block-error", (source === "source" ? sourceMark : source === "program" ? targetMark : -1) === index);
    const icon = document.createElement("span"); icon.className = "block-tile-icon"; icon.textContent = definition.icon;
    const label = document.createElement("span"); label.className = "block-tile-label"; label.textContent = definition.label; element.append(icon, label);
    return element;
  }
  function fitSourceTiles() {
    const source = q("#hybrid-source-blocks"), count = task.solution.length;
    if (source.clientWidth && count) source.style.setProperty("--hybrid-source-tile-width", Math.max(48, Math.min(65, (source.clientWidth - 24 - (count - 1) * 5) / count)) + "px");
  }
  function renderTiles() {
    const source = q("#hybrid-source-blocks"), offsets = [source.scrollLeft, program.scrollLeft, pile.scrollLeft];
    source.replaceChildren(); program.replaceChildren();
    const sourceDepths = scope.depths(task.solution), targetDepths = scope.depths(state.blocks);
    source.style.setProperty("--hybrid-source-depth", Math.max(0, ...sourceDepths));
    q(".hybrid-target-section").style.setProperty("--hybrid-target-depth", Math.max(0, ...targetDepths));
    task.solution.forEach((item, i) => source.append(tile(typeof item === "string" ? item : item.type, i, "source", sourceDepths[i])));
    state.blocks.forEach((type, i) => program.append(tile(type, i, "program", targetDepths[i])));
    tilePalette.update({ available: types(), reference: task.solution, starter: [],
      key: bridge ? `${bridge.from}:${bridge.to}:${bridge.topic}` : task.id,
      locale: locale(), disabled: busy, hidden: state.direction !== "to-blocks" });
    [source, program, pile].forEach((element, i) => { element.scrollLeft = offsets[i]; }); fitSourceTiles();
  }
  function renderSourceCode() {
    const language = locale(), line = task.source.lineMap[sourceMark];
    sourceText[language] ??= model.sourceCode(task, language);
    global.PipPythonEditor.renderSource(q("#hybrid-source-code"), sourceText[language], line);
  }
  function pythonTools() {
    const available = types(), ids = new Set(["forward", "left", "right"]);
    if (available.some(type => type.startsWith("FOR_"))) ids.add("for");
    if (available.some(type => type.startsWith("IF_"))) { ids.add("if"); ids.add("whats"); }
    if (available.some(type => type.startsWith("WHILE_"))) { ids.add("while"); ids.add("whats"); }
    return global.PipPythonEditor.getNativeTools(locale()).filter(tool => ids.has(tool.id));
  }
  function renderTools() {
    const list = q("#hybrid-tool-list"); list.replaceChildren();
    for (const tool of pythonTools()) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.tool = tool.id;
      const text = document.createElement("code"); text.textContent = tool.label; button.append(text);
      button.disabled = busy; list.append(button);
    }
    global.PipCodeSymbols?.render(q("#hybrid-code-symbols"), text => {
      if (!busy && active) pythonEditor.insert(text, { inline: true });
    }, false);
    q("#hybrid-code-symbols").querySelectorAll("button").forEach(button => { button.disabled = busy; });
  }
  function render() {
    const toPython = state.direction === "to-python";
    workspace.dataset.direction = state.direction;
    workspace.dataset.bridge = bridge ? bridge.topic : "";
    q("#hybrid-eyebrow").textContent = t("BLOCKS ↔ PYTHON", "BLOKKOK ↔ PYTHON");
    q("#hybrid-title").textContent = bridge ? t("Transfer check · ", "Átlépő feladat · ") + bridge.task.title[locale()] : t("Translate", "Átfordítás");
    for (const button of q("#hybrid-direction").querySelectorAll("button")) {
      button.textContent = button.dataset.direction === "to-python" ? t("Blocks → Python", "Blokkok → Python") : t("Python → Blocks", "Python → Blokkok");
      button.setAttribute("aria-pressed", String(button.dataset.direction === state.direction)); button.disabled = busy || Boolean(bridge);
    }
    q("#hybrid-new").textContent = bridge ? t("Back to practice", "Vissza a gyakorláshoz") : t("New task", "Új feladat"); q("#hybrid-new").disabled = busy;
    q("#hybrid-difficulty").hidden = Boolean(bridge);
    q("#hybrid-difficulty").replaceChildren();
    practice.difficulties.forEach((item, index) => {
      const option = document.createElement("option"); option.value = item.id;
      option.textContent = `${index + 1} · ${item.label[locale()]}`; option.selected = item.id === state.difficulty; q("#hybrid-difficulty").append(option);
    });
    q("#hybrid-difficulty").disabled = busy;
    q("#hybrid-source-title").textContent = toPython ? t("Blocks", "Blokkok") : "Python";
    q("#hybrid-readonly").textContent = t("Original", "Eredeti");
    q("#hybrid-target-title").textContent = toPython ? t("Your Python", "A te Python-kódod") : t("Your blocks", "A te blokkjaid");
    q("#hybrid-clear").textContent = t("Clear", "Törlés"); q("#hybrid-clear").disabled = busy;
    q("#hybrid-source-blocks").hidden = !toPython; q("#hybrid-source-code").hidden = toPython;
    q("#hybrid-code-wrap").hidden = !toPython; program.hidden = toPython; q("#hybrid-pile-section").hidden = toPython; q("#hybrid-tools-row").hidden = !toPython;
    code.readOnly = busy;
    q("#hybrid-pile-title").textContent = t("Available blocks", "Használható blokkok");
    q("#hybrid-tools summary").textContent = t("Code tools", "Kódeszközök");
    q("#hybrid-world-label").textContent = "KOJA";
    q("#hybrid-world-title").textContent = t("Koja’s world", "Koja pályája");
    q("#hybrid-reset").textContent = t("To start", "A rajthoz"); q("#hybrid-reset").disabled = busy;
    q("#hybrid-shop").textContent = t("Shop", "Bolt"); q("#hybrid-next").textContent = bridge ? t("Back to map →", "Vissza a térképhez →") : t("Next task →", "Következő feladat →");
    renderTiles(); renderSourceCode(); renderTools(); renderStatus(); renderWallet(); pythonEditor.sync();
  }
  function renderStatus() {
    q("#hybrid-run").textContent = busy ? t("Stop", "Leállítás") : t("Run & check", "Futtatás és ellenőrzés");
    q("#hybrid-run").disabled = !busy && state.direction === "to-python" && !workerReady;
    q("#hybrid-runtime").hidden = state.direction !== "to-python";
    q("#hybrid-runtime").textContent = workerStatus === "loading" ? t("Loading Python…", "A Python betöltése…") : workerStatus === "error" ? t("Python unavailable · click to retry", "A Python nem elérhető · kattints az újrapróbáláshoz") : "";
    q("#hybrid-runtime").classList.toggle("hybrid-retry", workerStatus === "error");
    const out = q("#hybrid-feedback"); out.dataset.kind = feedback.kind;
    const action = feedback.index == null ? "" : feedback.index + 1;
    const labels = {
      ready: "",
      running: t("Running…", "Fut…"),
      success: feedback.reward ? t("A perfect match! +1 coin ◉", "Pontosan egyezik! +1 érme ◉") : t("A perfect match!", "Pontosan egyezik!"),
      "bridge-success": t("Transfer complete!", "Sikerült az átlépés!"),
      "bridge-concept": t("The route matches. Keep the lesson’s loop or condition in your translation too.", "Az útvonal egyezik. A fordításban is használd a lecke ciklusát vagy feltételét!"),
      "bridge-unsupported": t("For this transfer check, use the commands and structures shown in Code tools.", "Ehhez az átlépő feladathoz a Kódeszközök parancsait és szerkezeteit használd!"),
      "bridge-save": t("The check passed, but progress could not be saved. Keep this page open and try again.", "Sikerült a feladat, de nem tudtuk menteni. Hagyd nyitva az oldalt, és próbáld újra!"),
      different: t(`Action ${action} differs. See the highlighted instruction.`, `A(z) ${action}. lépés eltér. Nézd meg a kiemelt utasítást!`),
      missing: t(`Action ${action} is missing.`, `Hiányzik a(z) ${action}. lépés.`),
      extra: t(`Action ${action} is extra.`, `A(z) ${action}. lépés már fölösleges.`),
      empty: t("Add your translation first.", "Előbb készítsd el a fordításodat!"),
      stopped: t("Stopped.", "Leállítva."),
      load: t("Python could not load. Check your connection, then click the retry message below.", "A Python nem töltődött be. Ellenőrizd a kapcsolatot, majd kattints lent az újrapróbálásra!"),
      timeout: t("That program took too long, so Koja stopped it safely.", "A program túl sokáig futott, ezért Koja biztonságosan leállította."),
      translation: t("A custom name prevented automatic translation. Your code is preserved and still runs in its previous language.", "Egy saját név miatt a kód nem fordítható automatikusan. Megőriztük, és az eredeti nyelvén fut."),
      error: feedback.text || t("Check the highlighted instruction.", "Nézd meg a kiemelt utasítást!"),
    };
    out.textContent = (labels[feedback.kind] ?? labels.ready) + (storageFailed
      ? t(" Changes could not be saved. Keep this page open; no unsaved coin was added.", " A módosításokat nem sikerült menteni. Hagyd nyitva az oldalt; mentés nélkül nem adtunk érmét.") : "");
    q("#hybrid-next").hidden = !["success", "bridge-success"].includes(feedback.kind);
  }
  function renderWallet() { q("#hybrid-wallet").textContent = t("Wallet: ", "Persely: ") + (global.PipSkins?.getBalance() || 0) + " ◉"; }
  function drawBoard() {
    board.replaceChildren(); cells = [];
    const scenario = task.scenario, width = scenario.width || 5, height = scenario.height || 5;
    for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
      const cell = document.createElement("div"); cell.className = "cell";
      cell.classList.toggle("start", scenario.start.row === row && scenario.start.column === column);
      cell.classList.toggle("obstacle", scenario.obstacles.some(item => (Array.isArray(item) ? item[0] : item.row) === row && (Array.isArray(item) ? item[1] : item.column) === column));
      board.append(cell); cells.push(cell);
    }
    robot = document.createElement("div"); robot.className = "robot"; robot.innerHTML = "<span>•‿•</span>"; board.append(robot); place(scenario.start, true);
  }
  function place(next, instant = false) {
    const directions = ["up", "right", "down", "left"], target = directions.indexOf(next.direction) * 90;
    if (instant || !position) angle = target;
    else { let change = target - directions.indexOf(position.direction) * 90; if (change > 180) change -= 360; if (change < -180) change += 360; angle += change; }
    position = { row: next.row, column: next.column, direction: next.direction };
    const cell = cells[next.row * (task.scenario.width || 5) + next.column]; if (!cell) return;
    robot.style.transition = instant ? "none" : "";
    robot.style.transform = `translate(${cell.offsetLeft + (cell.offsetWidth - robot.offsetWidth) / 2}px, ${cell.offsetTop + (cell.offsetHeight - robot.offsetHeight) / 2}px)`;
    robot.style.setProperty("--angle", angle + "deg"); board.dataset.row = next.row; board.dataset.column = next.column; board.dataset.direction = next.direction;
  }
  function clearMarks() { sourceMark = targetMark = -1; cells.forEach(cell => cell.classList.remove("trail", "hybrid-mismatch", "hybrid-expected")); code.classList.remove("hybrid-invalid"); pythonEditor.clearMarks(); }
  function showLine(line) {
    if (!Number.isInteger(line) || line < 1) return;
    pythonEditor.showLine(line); code.classList.add("hybrid-invalid");
  }
  function retireWorker() {
    if (loadTimer) clearTimeout(loadTimer); loadTimer = null;
    if (pending) { clearTimeout(pending.timer); pending.reject(new Error("cancelled")); pending = null; }
    worker?.terminate(); worker = null; workerReady = false; workerStatus = "idle";
  }
  function startWorker() {
    if (worker || !active || state.direction !== "to-python") return;
    workerStatus = "loading"; workerReady = false; renderStatus();
    let instance;
    const failed = () => {
      if (worker !== instance) return;
      retireWorker(); workerStatus = "error";
      const token = ++runToken; releaseMapWaiters();
      void waitForMap(token).then(current => {
        if (!current) return;
        feedback = { kind: "load" }; busy = false; render();
      });
    };
    try {
      instance = window.PipPythonRuntime.create(locale()); worker = instance;
      loadTimer = setTimeout(failed, 60000);
      instance.addEventListener("message", event => {
        if (worker !== instance) return;
        const message = event.data;
        if (message?.type === "status" && message.state === "error") { failed(); return; }
        if (message?.type === "status" && message.state === "ready") { clearTimeout(loadTimer); loadTimer = null; workerReady = true; workerStatus = "ready"; renderStatus(); }
        if (message?.type === "result" && pending?.id === message.id) { const resolve = pending.resolve; clearTimeout(pending.timer); pending = null; resolve(message.payload); }
      });
      instance.addEventListener("error", failed);
    } catch { worker = instance; failed(); }
  }
  function executePython() {
    return new Promise((resolve, reject) => {
      const id = ++workerSequence;
      const timer = setTimeout(() => { if (pending?.id !== id) return; pending = null; reject(new Error("timeout")); retireWorker(); startWorker(); }, 5500);
      pending = { id, resolve, reject, timer };
      worker.postMessage({ type: "run", id, code: state.code, locale: state.codeLocale, scenarios: [task.scenario] });
    });
  }
  function stop() {
    runToken++; releaseMapWaiters(); busy = false; retireWorker(); feedback = { kind: "stopped" }; render();
    if (active && state.direction === "to-python") startWorker();
  }
  function markDifference(comparison, actual) {
    sourceMark = comparison.expected?.index ?? expected.at(-1)?.index ?? -1; targetMark = comparison.actual?.index ?? -1;
    const before = expected[Math.max(-1, comparison.index - 1)] || task.scenario.start;
    const at = comparison.actual || before, wanted = comparison.expected || before;
    cells[at.row * 5 + at.column]?.classList.add("hybrid-mismatch"); cells[wanted.row * 5 + wanted.column]?.classList.add("hybrid-expected");
    renderTiles(); renderSourceCode();
    if (state.direction === "to-python") showLine(comparison.actual?.line || actual[actual.length - 1]?.line || code.value.split("\n").length);
    const source = q(state.direction === "to-python" ? "#hybrid-source-blocks .block-error" : "#hybrid-source-code .hybrid-error-line");
    source?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    if (state.direction === "to-blocks") program.querySelector(".block-error")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  async function run() {
    if (!active) return;
    if (busy) { stop(); return; }
    const toPython = state.direction === "to-python";
    if (toPython && !workerReady) { startWorker(); return; }
    if (toPython ? !state.code.trim() : !state.blocks.length) { feedback = { kind: "empty" }; renderStatus(); return; }
    const token = ++runToken; busy = true; clearMarks(); feedback = { kind: "running" }; place(task.scenario.start, true); persist(); render();
    let result;
    try {
      if (toPython) {
        const payload = await executePython();
        if (!await waitForMap(token)) return;
        if (!payload.ok) { feedback = { kind: "error", text: `${payload.error?.type || "Python"}: ${payload.error?.message || ""}` }; busy = false; render(); showLine(payload.error?.line); return; }
        result = payload.results[0];
      } else {
        result = scope.execute(state.blocks, task.scenario, { maxOperations: 8000, maxEvents: 160 });
        if (!result.ok) {
          targetMark = result.error.index;
          feedback = { kind: "error", text: result.error.code === "extra-end" ? t("This END has no open group. Return it to the pile.", "Ehhez a Vége blokkhoz nincs nyitott csoport. Tedd vissza a készletbe!") : t("This loop runs too long. Check where it stops.", "Ez a ciklus túl sokáig fut. Nézd meg, hol állhat le!") };
          busy = false; render(); return;
        }
      }
      const actual = model.actions(result.events), comparison = model.compare(expected, actual);
      const trace = comparison.ok ? actual : actual.slice(0, comparison.index + 1);
      const delay = global.PipPlayback?.delay("run") ?? 700;
      await waitForPlayback(delay);
      for (const event of trace) {
        if (!await waitForMap(token)) return;
        place(event); if (event.type === "forward") cells[event.row * 5 + event.column]?.classList.add("trail");
        await waitForPlayback(delay);
      }
      if (!await waitForMap(token)) return;
      busy = false;
      if (comparison.ok && bridge) {
        const assessment = global.PipLearningBridges.assess(bridge, {
          code: state.code, locale: state.codeLocale, blocks: state.blocks, events: result.events,
        });
        if (!assessment.ok) feedback = { kind: assessment.reason === "missing-concept" ? "bridge-concept" : "bridge-unsupported" };
        else {
          const completed = global.PipLearningProgress?.recordBridge(bridgeRecord());
          feedback = { kind: completed ? "bridge-success" : "bridge-save", reward: 0 };
        }
      }
      else if (comparison.ok) {
        const reward = model.award(state);
        if (!persist() && reward) state.earned.pop();
        feedback = { kind: "success", reward: storageFailed ? 0 : reward };
        if (!storageFailed) global.PipLearningProgress?.recordPractice({ track: "shared", kind: "hybrid",
          difficulty: state.difficulty, taskId: "seed:" + state.seed, generatorVersion: state.generatorVersion });
        global.PipSkins?.refreshWallet();
      }
      else { feedback = { kind: comparison.reason, index: comparison.index }; }
      render(); if (!comparison.ok) markDifference(comparison, actual);
    } catch (error) {
      if (!await waitForMap(token)) return;
      busy = false; feedback = { kind: error.message === "timeout" ? "timeout" : "error", text: error.message }; render();
    }
  }
  function edited() { sourceMark = targetMark = -1; feedback = { kind: "ready" }; code.classList.remove("hybrid-invalid"); pythonEditor.clearMarks(); renderTiles(); renderSourceCode(); persist(); renderStatus(); }
  function newTask(difficulty = state.difficulty) {
    runToken++; releaseMapWaiters(); retireWorker(); busy = false; state.difficulty = difficulty; state.seed = seed(); state.code = ""; state.codeLocale = locale(); state.blocks = [];
    buildTask(); startWorker();
  }
  function captureView() {
    const indexes = name => cells.flatMap((cell, i) => cell.classList.contains(name) ? [i] : []);
    return {
      seed: state.seed, direction: state.direction, code: state.code, codeLocale: state.codeLocale, blocks: [...state.blocks],
      position: { ...position }, feedback: busy ? { kind: "stopped" } : { ...feedback }, sourceMark, targetMark,
      trails: indexes("trail"), mistakes: indexes("hybrid-mismatch"), expected: indexes("hybrid-expected"),
      selection: [code.selectionStart, code.selectionEnd, code.selectionDirection], scrollTop: code.scrollTop, editorView: pythonEditor.getView(),
    };
  }
  function savePracticeView() { practiceViews.set(state.difficulty, captureView()); }
  function restoreView(previous) {
    if (!previous) return;
    feedback = { ...previous.feedback }; sourceMark = previous.sourceMark; targetMark = previous.targetMark;
    for (const index of previous.trails) cells[index]?.classList.add("trail");
    for (const index of previous.mistakes) cells[index]?.classList.add("hybrid-mismatch");
    for (const index of previous.expected) cells[index]?.classList.add("hybrid-expected");
    place(previous.position, true); render(); code.setSelectionRange(...previous.selection); code.scrollTop = previous.scrollTop;
    if (previous.editorView) pythonEditor.restoreView(previous.editorView); else pythonEditor.sync();
  }
  function bridgeRecord() {
    if (!bridge) return null;
    const { from, to, topic, taskId, assessmentVersion } = bridge;
    return { from, to, topic, taskId, assessmentVersion };
  }
  function closeBridge() {
    if (!bridge) return false;
    bridgeViews.set(global.PipLearningBridges.key(bridge), captureView());
    runToken++; releaseMapWaiters(); retireWorker(); busy = false;
    bridge = null; state = practiceState;
    buildTask(); restoreView(parkedPractice); parkedPractice = null;
    translateDraft(); persist(); startWorker();
    return true;
  }
  function openBridge(config) {
    const checkpoints = global.PipLearningBridges;
    if (!checkpoints?.valid(config) || !global.PipLearningProgress?.recordBridge) return false;
    const snapshots = { blocks: global.PipBlocksNavigation?.snapshot(), python: global.PipTutorial?.map?.snapshot() };
    if (!checkpoints.sourceComplete(config, snapshots)) return false;
    const next = checkpoints.create(config);
    if (!next || !global.PipLearningStage?.openHybrid) return false;
    if (bridge && checkpoints.key(bridge) === checkpoints.key(next) && active) return true;
    if (bridge) closeBridge();
    // Ordinary navigation may restore a parked practice, but never creates a
    // replacement task. Install the assessment only after that activation.
    if (!global.PipLearningStage.openHybrid(config.from)) return false;
    parkedPractice = captureView();
    const previous = bridgeViews.get(checkpoints.key(next));
    runToken++; releaseMapWaiters(); retireWorker(); busy = false;
    bridge = next;
    state = { ...practiceState, difficulty: next.task.difficulty, direction: next.direction,
      code: previous?.code || "", codeLocale: previous?.codeLocale || locale(), blocks: previous ? [...previous.blocks] : [] };
    buildTask(); restoreView(previous); translateDraft(); startWorker();
    return true;
  }
  function openPractice(difficulty) {
    if (difficulty !== undefined && !practice.difficulties.some(level => level.id === difficulty)) return false;
    if (bridge) closeBridge();
    difficulty ??= state.difficulty;
    if (difficulty === state.difficulty) return true;
    savePracticeView();
    const previous = practiceViews.get(difficulty);
    runToken++; releaseMapWaiters(); retireWorker(); busy = false; state.difficulty = difficulty;
    state.seed = previous?.seed ?? seed(); state.direction = previous?.direction ?? state.direction;
    state.code = previous?.code ?? ""; state.codeLocale = previous?.codeLocale ?? locale(); state.blocks = previous ? [...previous.blocks] : [];
    buildTask();
    restoreView(previous);
    translateDraft(); persist(); startWorker();
    return true;
  }
  q("#hybrid-new").addEventListener("click", () => bridge ? closeBridge() : newTask());
  function continueTask() {
    if (busy) return;
    if (bridge) { closeBridge(); global.PipCourseMap?.open(); }
    else newTask();
  }
  q("#hybrid-next").addEventListener("click", continueTask);
  q("#hybrid-run").addEventListener("click", run);
  q("#hybrid-reset").addEventListener("click", () => { clearMarks(); place(task.scenario.start, true); feedback = { kind: "ready" }; render(); });
  q("#hybrid-clear").addEventListener("click", () => { if (state.direction === "to-python") { state.code = ""; pythonEditor.setValue(""); } else state.blocks = []; edited(); });
  q("#hybrid-direction").addEventListener("click", event => {
    const value = event.target.closest("button")?.dataset.direction; if (!value || value === state.direction || busy || bridge) return;
    retireWorker(); state.direction = value; clearMarks(); place(task.scenario.start, true); feedback = { kind: "ready" }; persist(); render(); startWorker();
  });
  q("#hybrid-difficulty").addEventListener("change", event => {
    const value = event.target.value; if (value && value !== state.difficulty && !busy && !bridge) openPractice(value);
  });
  q("#hybrid-tool-list").addEventListener("mousedown", event => { if (event.target.closest("button")) event.preventDefault(); });
  q("#hybrid-tool-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-tool]"); if (!button || busy) return;
    const tool = pythonTools().find(tool => tool.id === button.dataset.tool); if (!tool) return;
    q("#hybrid-tools").open = false;
    pythonEditor.insert(tool.code, { selection: tool.selection, inline: tool.id === "whats" });
  });
  pile.addEventListener("click", event => { if (suppressClick) return; const button = event.target.closest("[data-type]"); if (!button || busy || state.blocks.length >= 160) return; state.blocks.push(button.dataset.type); edited(); program.scrollLeft = program.scrollWidth; });
  program.addEventListener("click", event => { if (suppressClick) return; const button = event.target.closest("[data-index]"); if (!button || busy) return; state.blocks.splice(Number(button.dataset.index), 1); edited(); });
  program.addEventListener("keydown", event => {
    const tile = event.target.closest("[data-index]"); if (!tile || !event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key) || busy) return;
    event.preventDefault(); const i = Number(tile.dataset.index), next = i + (event.key === "ArrowLeft" ? -1 : 1);
    if (next < 0 || next >= state.blocks.length) return;
    const [type] = state.blocks.splice(i, 1); state.blocks.splice(next, 0, type); edited(); program.querySelector(`[data-index="${next}"]`).focus();
  });
  function transfer(item, strip, target, x) {
    if (strip === pile) { if (item.source === "program") state.blocks.splice(item.index, 1); }
    else {
      const tile = target?.closest("[data-index]"), rect = tile?.getBoundingClientRect();
      let at = tile ? Number(tile.dataset.index) + (x > rect.left + rect.width / 2 ? 1 : 0) : state.blocks.length;
      if (item.source === "program") { state.blocks.splice(item.index, 1); if (item.index < at) at--; }
      if (state.blocks.length < 160) state.blocks.splice(at, 0, item.type);
    }
    edited();
  }
  for (const strip of [program, pile]) {
    strip.addEventListener("pointerdown", event => {
      const tile = event.target.closest("[data-type]");
      if (!tile || busy || event.pointerType === "mouse" || !event.isPrimary) return;
      if (strip === pile) tilePalette.pointerDown(event);
      touch = { source: tile.dataset.source, index: Number(tile.dataset.index), type: tile.dataset.type,
        id: event.pointerId, x: event.clientX, y: event.clientY, element: tile, ghost: null };
      tile.setPointerCapture(event.pointerId);
    });
    strip.addEventListener("dragstart", event => { const tile = event.target.closest("[data-type]"); if (!tile || busy) return; drag = { source: tile.dataset.source, index: Number(tile.dataset.index), type: tile.dataset.type }; event.dataTransfer.effectAllowed = drag.source === "pile" ? "copy" : "move"; event.dataTransfer.setData("text/plain", drag.type); });
    strip.addEventListener("dragover", event => { if (!drag || busy) return; event.preventDefault(); strip.classList.add("blocks-drop"); });
    strip.addEventListener("dragleave", () => strip.classList.remove("blocks-drop"));
    strip.addEventListener("drop", event => {
      event.preventDefault(); strip.classList.remove("blocks-drop"); if (!drag || busy) return;
      transfer(drag, strip, event.target, event.clientX); drag = null;
    });
    strip.addEventListener("dragend", () => { drag = null; program.classList.remove("blocks-drop"); pile.classList.remove("blocks-drop"); });
  }
  document.addEventListener("pointermove", event => {
    if (!touch || event.pointerId !== touch.id || !active || busy) return;
    if (tilePalette.pointerMove(event)) return;
    if (!touch.ghost && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) < 8) return;
    event.preventDefault();
    if (!touch.ghost) {
      touch.ghost = touch.element.cloneNode(true); touch.ghost.classList.add("block-drag-ghost");
      touch.ghost.removeAttribute("id"); touch.ghost.style.margin = "0"; document.body.append(touch.ghost);
    }
    touch.ghost.style.left = event.clientX - 32 + "px"; touch.ghost.style.top = event.clientY - 35 + "px";
  }, { passive: false });
  function finishTouch(event) {
    if (tilePalette.pointerUp(event)) {
      touch?.ghost?.remove(); touch = null; event.preventDefault();
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 350); return;
    }
    if (!touch || event.pointerId !== touch.id) return;
    const item = touch; touch = null;
    if (!item.ghost) return;
    event.preventDefault(); item.ghost.remove(); suppressClick = true; setTimeout(() => { suppressClick = false; }, 350);
    if (event.type === "pointercancel" || !active || busy) return;
    const target = document.elementFromPoint(event.clientX, event.clientY), strip = target?.closest("#hybrid-program, #hybrid-pile");
    if (strip) transfer(item, strip, target, event.clientX);
  }
  document.addEventListener("pointerup", finishTouch); document.addEventListener("pointercancel", finishTouch);
  q("#hybrid-shop").addEventListener("click", () => global.PipSkins?.openShop());
  q("#hybrid-runtime").addEventListener("click", () => { if (workerStatus === "error") startWorker(); });
  function handleHybridKeydown(event) {
    if (!active || event.key !== "Enter" || mapPauseCount || global.PipWelcomePending || event.defaultPrevented || event.isComposing
      || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || document.querySelector("dialog[open]")) return;
    if (event.target.closest("a,textarea,input,select,summary,[contenteditable=true],.monaco-editor")) return;
    const button = event.target.closest("button");
    if (button && button.id !== "hybrid-run") return;
    // Run/Check focus must not turn a held key into a second task or replay.
    if (event.repeat) { event.preventDefault(); return; }
    if (busy) return;
    if (["success", "bridge-success"].includes(feedback.kind)) { event.preventDefault(); continueTask(); }
    else if (!button && state.direction === "to-blocks") { event.preventDefault(); void run(); }
  }
  document.addEventListener("keydown", handleHybridKeydown, true);
  global.addEventListener("resize", () => { if (active) place(position, true); });
  if (global.ResizeObserver) {
    const resize = new ResizeObserver(() => { if (active && position) { place(position, true); fitSourceTiles(); } });
    resize.observe(board); resize.observe(q("#hybrid-source-blocks"));
  }
  global.PipSkins?.onWalletChange(renderWallet);
  global.addEventListener("pagehide", persist);
  global.PipHybrid = Object.freeze({
    setActive(value) {
      active = Boolean(value); header.hidden = !active; workspace.hidden = !active;
      if (!active) { touch?.ghost?.remove(); touch = null; drag = null; if (busy) { runToken++; releaseMapWaiters(); busy = false; feedback = { kind: "stopped" }; } retireWorker(); if (bridge) closeBridge(); persist(); }
      else { translateDraft(); render(); requestAnimationFrame(() => place(position || task.scenario.start, true)); startWorker(); }
      pythonEditor.sync(); tilePalette.refresh();
    },
    refreshLanguage() { translateDraft(); render(); if (position) place(position, true); persist(); },
    getEarnings: () => practiceState.earned.length,
    snapshot: () => JSON.parse(JSON.stringify({ state, task, expected, position, feedback, bridge: bridgeRecord(), busy, workerReady, active, paused: mapPauseCount > 0 })),
    openPractice, openBridge, pauseForMap,
  });
  buildTask(); translateDraft(); persist(); global.PipSkins?.refreshWallet();
  // Historical translation wins prove only generic practice, never a direction
  // or a course transfer. Import the sanitized reward IDs, not arbitrary raw data.
  for (const id of practiceState.earned) {
    const difficulty = id.split(":")[0];
    const currentGenerator = saved?.generatorVersion === practiceState.generatorVersion;
    if (practice.difficulties.some(item => item.id === difficulty)) global.PipLearningProgress?.recordPractice({
      track: "shared", kind: "hybrid", difficulty,
      taskId: currentGenerator ? "seed:" + id.split(":")[1] : "legacy:" + id,
      ...(currentGenerator ? { generatorVersion: practiceState.generatorVersion } : {}),
    });
  }
})(window);
