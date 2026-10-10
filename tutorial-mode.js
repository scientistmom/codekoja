// Tutorial owns its DOM, editor models, worker, and progress. The free modes are
// parked, not reloaded, while it is open. Only Python's worker protocol is shared.
(function attachTutorial(global) {
  "use strict";
  const lesson = global.PipTutorialCampaign;
  const course = global.PipCourse;
  const shell = document.querySelector(".app-shell");
  const nativeWorkspace = document.querySelector("main > .workspace");
  const entry = document.querySelector("#tutorial-mode");
  if (!lesson || !course || !entry) return;
  const STORAGE_KEY = "pip-python-lab.tutorial.campaign.v2";
  let locale = global.PipLocale === "hu" ? "hu" : "en";
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem("pip-python-lab.tutorial.commands.v1")); } catch { /* Private browsing. */ }
  const state = lesson.restore(saved, locale);
  const wallet = lesson.restoreWallet(saved?.wallet);
  let collectedCoins = new Set();
  let active = false, busy = false, ready = false, runtimeError = false;
  let autoExampleStage = null, autoExampleTimer = null;
  let examplePaused = false, exampleDelay = null, examplePhase = "preview";
  let mapHolds = 0, mapEditorView = null;
  const mapAnimations = new Set();
  let tutorialWorker = null, pending = null, runId = 0, animationId = 0;
  let editor = null, suppressChanges = false, decorations = [], markedLine = null;
  let robot = null, robotState = null, robotAngle = 0, cells = [];
  let message = { kind: "intro" };
  let recap = saved?.courseScreen === "recap";
  let practiceChapter = Number.isInteger(saved?.practiceChapter) && course.topics[saved.practiceChapter] ? saved.practiceChapter : null;
  const savedPracticeId = saved?.practiceLessonId ?? lesson.legacyChapterIds[saved?.practiceChapter];
  if (typeof savedPracticeId === "string") {
    const index = lesson.chapters.findIndex(chapter => chapter.id === savedPracticeId);
    practiceChapter = index >= 0 ? index : null;
  }
  let lookingAt = "code", markedEndLine = null;
  const models = new Map(), views = new Map(), boardViews = new Map();
  const completed = new Set(state.completed);
  const answers = new Map();
  const t = (en, hu) => {
    global.PipI18n.register(en, hu);
    return locale === "hu" ? hu : en;
  };
  const copy = (pair) => t(...pair);
  const stage = () => lesson.stages[state.index];
  const chapter = () => lesson.chapters[stage().chapter];
  const chapterStages = () => course.sequence(stage().chapter);
  const firstStageIndex = chapterIndex => lesson.stages.indexOf(course.sequence(chapterIndex)[0]);
  const command = (action) => lesson.command(action, locale);

  const header = document.createElement("nav");
  header.className = "tutorial-header";
  header.hidden = true;
  header.innerHTML = '<div class="tutorial-lesson-name"><small></small><strong></strong></div><div class="tutorial-lesson-nav"><button id="tutorial-previous-lesson" type="button"></button><button id="tutorial-next-lesson" type="button"></button><details class="tutorial-nav-options"><summary></summary><div class="tutorial-nav-drawer"><div class="tutorial-chapter-buttons" role="group"></div><div class="tutorial-stage-buttons" role="group"></div></div></details></div>';
  document.querySelector(".campaign-slot").after(header);
  const workspace = document.createElement("section");
  workspace.className = "workspace tutorial-workspace";
  workspace.dataset.presentation = "minimal";
  workspace.hidden = true;
  workspace.innerHTML = `
    <section class="course-checkpoint" hidden aria-labelledby="course-checkpoint-title">
      <span class="course-finish-mark" aria-hidden="true">✓</span><p class="panel-eyebrow" id="course-checkpoint-eyebrow"></p>
      <h2 id="course-checkpoint-title" tabindex="-1"></h2><div id="course-recap-tools"></div>
      <div class="course-chapter-options">
        <button id="course-continue" class="button primary" type="button"></button>
        <button data-course-practice="predict" class="button ghost" type="button"></button>
        <button data-course-practice="create" class="button ghost" type="button"></button>
      </div>
    </section>
    <article class="editor-panel">
      <div class="panel-head">
        <div><span class="file-dot" aria-hidden="true"></span><strong>lesson.py</strong></div>
        <div class="panel-head-tools"><div class="mode-switch" role="group">
          <button type="button" data-tutorial-tab="tutorial" aria-pressed="true"></button>
          <button type="button" data-tutorial-tab="read" aria-pressed="false"></button>
          <button type="button" data-tutorial-tab="write" aria-pressed="false"></button>
        </div></div>
      </div>
      <div class="tutorial-vocabulary" role="toolbar"></div>
      <div class="tutorial-python-tools" role="toolbar"></div>
      <div class="editor-wrap tutorial-editor-wrap">
        <div id="tutorial-monaco"></div>
        <div class="tutorial-code-focus" aria-hidden="true"></div>
        <div id="tutorial-line-marker" aria-hidden="true" hidden></div>
        <textarea id="tutorial-code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea>
      </div>
      <div class="tutorial-editor-actions">
        <button id="tutorial-pause" class="button ghost" type="button" hidden></button>
        <button id="tutorial-stop" class="button ghost" type="button" hidden></button>
        <button id="tutorial-run" class="button primary" type="button"></button>
      </div>
      <section class="tutorial-console" aria-labelledby="tutorial-console-title">
        <strong id="tutorial-console-title"></strong>
        <pre id="tutorial-output" role="log" aria-live="polite"></pre>
      </section>
    </article>
    <aside class="world-panel">
      <div class="world-head"><div><p class="panel-eyebrow" id="tutorial-eyebrow"></p><h2 id="tutorial-title"></h2></div>
        <div class="world-tools"><button class="new-board-button reset-board-button" id="tutorial-reset" type="button"><span aria-hidden="true">↶</span><span class="button-label"></span></button></div>
      </div>
      <div class="board-stage"><div class="board" id="tutorial-board" role="img"></div></div>
      <div id="tutorial-wallet" role="status" aria-live="polite"></div>
      <section class="tutorial-prediction" hidden>
        <div class="tutorial-prediction-head"><strong></strong><output id="tutorial-count"></output></div>
        <ol id="tutorial-route"></ol>
        <div class="tutorial-arrow-buttons">
          <button type="button" data-tutorial-action="left"><span aria-hidden="true">←</span><code></code></button>
          <button type="button" data-tutorial-action="forward"><span aria-hidden="true">↑</span><code></code></button>
          <button type="button" data-tutorial-action="right"><span aria-hidden="true">→</span><code></code></button>
        </div>
        <div class="tutorial-check-actions"><button id="tutorial-undo" class="button ghost" type="button"></button><button id="tutorial-evaluate" aria-keyshortcuts="Enter" class="button primary" type="button"></button></div>
      </section>
      <div class="tutorial-bottom-actions"><button id="tutorial-restart" type="button"></button><span id="tutorial-progress"></span></div>
    </aside>`;
  const controls = document.createElement("div");
  controls.className = "play-controls tutorial-play-controls";
  controls.append(workspace.querySelector(".tutorial-editor-actions"), workspace.querySelector(".tutorial-check-actions"));
  workspace.append(controls);
  // Stable slots: optional tools overlay the editor instead of pushing it down.
  const toolRow = document.createElement("div"); toolRow.className = "tutorial-tools-bar";
  const vocabulary = workspace.querySelector(".tutorial-vocabulary");
  vocabulary.before(toolRow);
  const optionalTools = document.createElement("details"); optionalTools.id = "tutorial-optional-tools";
  const optionalSummary = document.createElement("summary");
  const optionalContent = document.createElement("div"); optionalContent.className = "tutorial-optional-content";
  optionalTools.append(optionalSummary, optionalContent);
  optionalTools.open = saved?.toolsOpen === true;
  optionalTools.addEventListener("toggle", () => { if (active) persist(); });
  const symbols = document.createElement("div");
  optionalContent.append(vocabulary, symbols, workspace.querySelector(".tutorial-python-tools"));
  toolRow.append(optionalTools);
  const boardDock = document.createElement("div"); boardDock.className = "tutorial-board-dock";
  const walletRow = document.createElement("div"); walletRow.className = "tutorial-wallet-row";
  const shopButton = document.createElement("button"); shopButton.type = "button"; shopButton.id = "pip-shop-button";
  walletRow.append(workspace.querySelector("#tutorial-wallet"), shopButton); boardDock.append(walletRow);
  workspace.querySelector(".board-stage").after(boardDock);
  boardDock.append(workspace.querySelector(".tutorial-prediction"));
  const progress = document.createElement("div"); progress.className = "course-progress-track";
  progress.setAttribute("role", "list");
  for (const kind of course.kinds) {
    const item = document.createElement("span"); item.dataset.progressKind = kind;
    item.setAttribute("role", "listitem"); item.innerHTML = '<i></i><span></span>'; progress.append(item);
  }
  const feedback = document.createElement("p"); feedback.id = "course-stage-feedback"; feedback.setAttribute("role", "status");
  controls.prepend(progress, feedback);
  const settings = header.querySelector(".tutorial-nav-drawer");
  settings.append(workspace.querySelector(".tutorial-bottom-actions"));
  const pace = document.createElement("div"); pace.className = "tutorial-pace";
  pace.innerHTML = '<span></span><div role="group"><button type="button" data-pace="relaxed"></button><button type="button" data-pace="steady"></button><button type="button" data-pace="quick"></button></div>';
  settings.append(pace);
  nativeWorkspace.after(workspace);
  const practicePrompt = document.createElement("section");
  practicePrompt.className = "course-practice-prompt";
  practicePrompt.hidden = true;
  practicePrompt.innerHTML = '<div><strong></strong><span></span></div><button id="course-try-writing" class="button ghost" type="button"></button><button id="course-next-from-practice" class="button primary" type="button"></button>';
  nativeWorkspace.before(practicePrompt);
  function renderPracticePrompt() {
    practicePrompt.hidden = active || practiceChapter === null;
    const read = shell.dataset.uiMode === "read";
    const final = practiceChapter === lesson.chapters.length - 1;
    practicePrompt.querySelector("strong").textContent = t("Have you practised enough?", "Eleget gyakoroltál már?");
    practicePrompt.querySelector("span").textContent = final
      ? t("You can revisit any course chapter.", "Bármelyik fejezethez visszatérhetsz.")
      : t("Ready to learn the next chapter?", "Készen állsz a következő fejezetre?");
    const write = practicePrompt.querySelector("#course-try-writing");
    write.hidden = !read; write.textContent = t("Ready to try writing?", "Kipróbálod a kódírást?");
    const next = practicePrompt.querySelector("#course-next-from-practice");
    next.textContent = final ? t("Back to course", "Vissza a tanfolyamhoz") : t("Next chapter →", "Következő fejezet →");
    write.disabled = next.disabled = document.querySelector("#read-mode").disabled;
  }
  function startPractice(mode) {
    const previousChapter = practiceChapter;
    const chapterIndex = active ? stage().chapter : practiceChapter;
    if (chapterIndex === null || !course.practiceLevels[chapterIndex]) return;
    practiceChapter = chapterIndex;
    if (active) close(mode);
    const opened = global.PipStartCoursePractice(mode, course.practiceLevels[chapterIndex][mode]);
    if (!opened) {
      // Cancelling replacement keeps the existing draft and returns to the course.
      practiceChapter = previousChapter; open();
    }
    renderPracticePrompt(); persist();
  }
  practicePrompt.querySelector("#course-try-writing").addEventListener("click", () => startPractice("write"));
  practicePrompt.querySelector("#course-next-from-practice").addEventListener("click", () => {
    if (practiceChapter === null || document.querySelector("#read-mode").disabled) return;
    const next = practiceChapter + 1;
    if (next < lesson.chapters.length) chooseStage(firstStageIndex(next));
    open();
  });
  new MutationObserver(renderPracticePrompt).observe(shell, { attributes: true, attributeFilter: ["data-ui-mode"] });

  const q = (selector) => workspace.querySelector(selector) || header.querySelector(selector);
  const textarea = q("#tutorial-code");
  const output = q("#tutorial-output");
  const board = q("#tutorial-board");
  const shop = global.PipSkins.createShop({
    getEarned: () => Object.values(wallet).reduce((sum, keys) => sum + keys.length, 0),
    getLocale: () => locale,
    onChange: () => renderCoins(),
  });
  shopButton.addEventListener("click", () => {
    // Browsing rewards must not make the child miss a worked example.
    if (stage().kind === "watch" && !examplePaused && !q("#tutorial-pause").disabled) q("#tutorial-pause").click();
    shop.open();
  });
  const runtime = document.createElement("div");
  runtime.id = "tutorial-runtime";
  runtime.className = "runtime-pill";
  runtime.hidden = true;
  runtime.setAttribute("role", "status");
  runtime.innerHTML = '<span class="runtime-dot" aria-hidden="true"></span><span></span>';
  document.querySelector(".topbar-controls").append(runtime);
  const mission = document.createElement("h1");
  mission.id = "tutorial-mission";
  mission.hidden = true;
  document.querySelector("#mission-title").after(mission);

  const nextStageButton = document.createElement("button"); nextStageButton.id = "tutorial-next-stage";
  nextStageButton.type = "button"; nextStageButton.setAttribute("aria-keyshortcuts", "Enter"); nextStageButton.className = "button primary"; nextStageButton.hidden = true;
  controls.append(nextStageButton);
  const celebration = document.createElement("div");
  celebration.className = "tutorial-stage-success";
  celebration.hidden = true;
  boardDock.append(celebration);
  const confetti = document.createElement("div");
  confetti.className = "tutorial-confetti";
  confetti.setAttribute("aria-hidden", "true");
  workspace.querySelector(".board-stage").append(confetti);
  function celebrateStage() {
    confetti.replaceChildren();
    if (!active || stage().kind === "watch" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let index = 0; index < 24; index++) {
      const piece = document.createElement("i");
      piece.style.setProperty("--x", `${4 + index * 4}%`);
      piece.style.setProperty("--drift", `${(index % 7 - 3) * 12}px`);
      piece.style.setProperty("--delay", `${index % 5 * 55}ms`);
      piece.style.setProperty("--spin", `${index % 2 ? 280 : -240}deg`);
      piece.style.background = ["#8b6bd6", "#efb94f", "#57b9a3", "#e991b3"][index % 4];
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
      confetti.append(piece);
    }
  }

  nextStageButton.addEventListener("click", continueMinimalStage);
  const codeFit = global.PipCodeFit?.attach({ host: q(".tutorial-editor-wrap"), textarea,
    getEditor: () => editor, getCode });
  function focusTask() {
    if (!active || recap) return;
    if (!stage().editable) { board.tabIndex = -1; board.focus({ preventScroll: true }); return; }
    if (getCode() === lesson.source(stage(), locale)) {
      const target = stage().kind === "complete" ? course.completionSelection(stage(), locale) : null;
      if (target) {
        textarea.setSelectionRange(target.start, target.end);
        if (editor) {
          const selection = { startLineNumber: target.line, endLineNumber: target.line, startColumn: target.startColumn, endColumn: target.endColumn };
          editor.setSelection(selection); editor.revealRangeInCenterIfOutsideViewport(selection);
        }
      }
    }
    if (editor) editor.focus(); else textarea.focus({ preventScroll: true });
  }
  function continueMinimalStage() {
    if (!active || busy || message.kind !== "success" || !completed.has(stage().id)) return;
    const steps = chapterStages(), position = steps.findIndex(item => item.id === stage().id);
    if (position === steps.length - 1) showRecap();
    else chooseStage(lesson.stages.indexOf(steps[position + 1]));
  }
  function setAttention(where) {
    lookingAt = where;
  }
  function exampleDuration(milliseconds) {
    const factor = { relaxed: 1.5, steady: 1, quick: .8 }[global.PipPlayback?.pace] || 1;
    return Math.round(milliseconds * factor);
  }
  function queueAdvance() {
    if (message.kind !== "success" || !completed.has(stage().id)) return;
    celebrateStage(); nextStageButton.focus({ preventScroll: true });
  }
  function rememberDestination(destination) {
    if (global.PipResetInProgress) return;
    try { localStorage.setItem("pip-python-lab.destination", destination); } catch { /* optional */ }
  }
  function showRecap() {
    recap = true; renderControls(); persist();
    const heading = q("#course-checkpoint-title");
    heading.focus({ preventScroll: true });
    const bounds = heading.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > innerHeight) heading.scrollIntoView({ block: "center", behavior: "instant" });
  }
  function renderCourse() {
    const isRecap = recap;
    workspace.dataset.courseScreen = isRecap ? "recap" : "lesson";
    q(".course-checkpoint").hidden = !isRecap;
    header.querySelector(".tutorial-stage-buttons").hidden = isRecap;
    const done = chapterStages().every(item => completed.has(item.id));
    const finalChapter = stage().chapter === lesson.chapters.length - 1;
    q("#course-checkpoint-eyebrow").textContent = done ? t("Chapter complete", "Fejezet kész") : t("Chapter checkpoint", "Fejezetösszegzés");
    q("#course-checkpoint-title").textContent = copy(chapter().label);
    const tools = q("#course-recap-tools"); tools.replaceChildren();
    const terms = { indentation: ["indentation", "behúzás"], call: ["call", "hívás"], reuse: ["reuse", "újrafelhasználás"], parameter: ["parameter", "paraméter"], argument: ["argument", "átadott érték"], counter: ["counter", "számláló"], loops: ["loops", "ciklusok"], conditions: ["conditions", "feltételek"], whats: ['whats("ahead")', 'mit_lát("előre")'] };
    for (const term of course.topics[stage().chapter].vocabulary) {
      const chip = document.createElement("code"); chip.textContent = terms[term] ? copy(terms[term]) : global.PipCodeTranslation.translate(term, "en", locale).code; tools.append(chip);
    }
    q("#course-continue").textContent = !done ? t("Finish this chapter", "Fejezet befejezése") : finalChapter ? t("Explore your course", "Nézd át a tanfolyamot") : t("Next chapter →", "Következő fejezet →");
    q('[data-course-practice="predict"]').textContent = t("Practise reading", "Kódolvasást gyakorlok");
    q('[data-course-practice="create"]').textContent = t("Practise writing", "Kódírást gyakorlok");
  }
  q("#course-continue").addEventListener("click", () => {
    const missing = chapterStages().find(item => !completed.has(item.id));
    chooseStage(missing ? lesson.stages.indexOf(missing) : firstStageIndex((stage().chapter + 1) % lesson.chapters.length));
  });
  for (const button of workspace.querySelectorAll("[data-course-practice]")) {
    button.addEventListener("click", () => startPractice(button.dataset.coursePractice === "predict" ? "read" : "write"));
  }

  function revealTeachingFocus() {
    if (!["watch", "complete"].includes(stage().kind)) return;
    const target = course.focus(stage(), locale)[0];
    if (!target) return;
    if (editor) {
      editor.revealLineInCenterIfOutsideViewport(target.startLine);
      if (target.startColumn > 1) {
        const line = getCode().split("\n")[target.startLine - 1] || "";
        editor.revealRangeInCenterIfOutsideViewport(new global.monaco.Range(target.startLine,
          Math.min(target.startColumn, line.length + 1), target.startLine,
          Math.min(target.endColumn || target.startColumn, line.length + 1)));
      }
    } else {
      const top = codeFit?.lineBox(target.startLine)?.top ?? 16 + (target.startLine - 1) * 24;
      if (top < textarea.scrollTop || top + 24 > textarea.scrollTop + textarea.clientHeight) textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 2);
      const left = 16 + ((target.startColumn || 1) - 1) * 8.4;
      if (left < textarea.scrollLeft || left + 24 > textarea.scrollLeft + textarea.clientWidth) textarea.scrollLeft = Math.max(0, left - textarea.clientWidth / 2);
    }

  }

  function getCode() { return editor ? editor.getValue() : textarea.value; }
  function rememberCode() { if (robot && stage().editable) state.drafts[stage().id] = getCode(); }
  function persist() {
    if (global.PipResetInProgress) return;
    rememberCode();
    if (stage().kind === "predict") state.routes[stage().id] = [...state.guesses];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2, lesson: "campaign", locale, index: state.index, stageId: stage().id,
        drafts: state.drafts, wallet,
        routes: state.routes,
        completed: [...completed],
        courseScreen: recap ? "recap" : "lesson", practiceChapter, toolsOpen: optionalTools.open,
        practiceLessonId: lesson.chapters[practiceChapter]?.id ?? null,
      }));
    } catch { /* In-memory progress remains usable when storage is unavailable. */ }
  }
  function codeFor(current = stage()) { return state.drafts[current.id] ?? lesson.source(current, locale); }
  function changed() {
    codeFit?.refresh();
    if (suppressChanges || !stage().editable || recap) return;
    setAttention("code");
    rememberCode();
    completed.delete(stage().id);
    markLine(null);
    message = { kind: "editing" };
    renderControls();
    persist();
  }
  function mountMonaco() {
    if (editor || !active || !global.PipEditorLoader?.runtime?.editor) return;
    const monaco = global.PipEditorLoader.runtime;
    const selection = [textarea.selectionStart, textarea.selectionEnd];
    const wasFocused = document.activeElement === textarea;
    const model = monaco.editor.createModel(textarea.value, "python");
    models.set(stage().id, model);
    editor = monaco.editor.create(q("#tutorial-monaco"), {
      model, theme: "pip-dark", fontSize: 14, lineHeight: 24,
      minimap: { enabled: false }, folding: false, glyphMargin: true,
      lineNumbersMinChars: 3, scrollBeyondLastLine: false, automaticLayout: true,
      padding: { top: 16, bottom: 16 }, tabSize: 4, insertSpaces: true,
      readOnly: !stage().editable || busy, wordWrap: "on", contextmenu: locale !== "hu",
      hover: { enabled: false }, parameterHints: { enabled: false },
      quickSuggestions: false, suggestOnTriggerCharacters: false, wordBasedSuggestions: "off",
      suggest: { showWords: false }, inlineSuggest: { enabled: false },
    });
    const start = model.getPositionAt(selection[0]), end = model.getPositionAt(selection[1]);
    editor.setSelection({ startLineNumber: start.lineNumber, startColumn: start.column, endLineNumber: end.lineNumber, endColumn: end.column });
    if (wasFocused) editor.focus();
    editor.onDidChangeModelContent(changed);
    q(".tutorial-editor-wrap").classList.add("tutorial-monaco-ready");
    codeFit?.refresh();
    markLine(markedLine);
  }
  function markLine(line, endLine = line) {
    markedLine = Number.isInteger(line) && line > 0 ? line : null;
    markedEndLine = markedLine ? Math.max(markedLine, endLine || markedLine) : null;
    workspace.dataset.codeFocusLine = markedLine || "";
    if (editor) decorations = editor.deltaDecorations(decorations, markedLine ? [{
      range: new global.monaco.Range(markedLine, 1, markedEndLine, 1),
      options: { isWholeLine: true, className: "tutorial-highlighted-line" },
    }] : []);
    const marker = q("#tutorial-line-marker");
    marker.hidden = !markedLine || Boolean(editor);
    const box = !editor && codeFit?.lineBox(markedLine || 1, markedEndLine || 1);
    marker.style.top = `${(box?.top ?? 16 + ((markedLine || 1) - 1) * 24) - textarea.scrollTop}px`;
    marker.style.height = `${box?.height ?? 24 * ((markedEndLine || 1) - (markedLine || 1) + 1)}px`;
  }
  function showCode() {
    suppressChanges = true;
    textarea.value = codeFor();
    if (editor) {
      let model = models.get(stage().id);
      if (!model) { model = global.monaco.editor.createModel(textarea.value, "python"); models.set(stage().id, model); }
      editor.setModel(model);
      const view = views.get(stage().id)?.monaco;
      if (view) editor.restoreViewState(view);
      decorations = [];
    }
    const view = views.get(stage().id);
    textarea.setSelectionRange(...(view?.selection || [0, 0]));
    textarea.scrollTop = view?.scrollTop || 0;
    textarea.scrollLeft = view?.scrollLeft || 0;
    suppressChanges = false;
    codeFit?.refresh();
    markLine(null);
  }
  function saveView() {
    views.set(stage().id, { monaco: editor?.saveViewState(), selection: [textarea.selectionStart, textarea.selectionEnd], scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft });
    boardViews.set(stage().id, { state: { ...robotState }, coins: [...collectedCoins], trails: cells.map((cell, i) => cell.classList.contains("trail") ? i : -1).filter((i) => i >= 0) });
  }
  function placeRobot(next, instant = false) {
    const cell = cells[cellIndex(next)];
    if (!cell || !robot) return;
    const oldDirection = lesson.directions.indexOf(robotState?.direction);
    const newDirection = lesson.directions.indexOf(next.direction);
    if (instant || oldDirection < 0) robotAngle = newDirection * 90;
    else robotAngle += ((newDirection - oldDirection + 6) % 4 - 2) * 90;
    robotState = { row: next.row, column: next.column, direction: next.direction };
    robot.style.transition = instant ? "none" : "";
    robot.classList.toggle("tutorial-instant", instant);
    robot.style.transform = `translate(${cell.offsetLeft + (cell.offsetWidth - robot.offsetWidth) / 2}px, ${cell.offsetTop + (cell.offsetHeight - robot.offsetHeight) / 2}px)`;
    robot.style.setProperty("--angle", `${robotAngle}deg`);
  }
  function cellIndex(point) { return point.row * stage().scenario.width + point.column; }
  function insideBoard(row, column) {
    const { width, height } = stage().scenario;
    return row >= 0 && row < height && column >= 0 && column < width;
  }
  function renderCoins() {
    for (const [row, column] of stage().scenario.coins || []) {
      const cell = cells[cellIndex({ row, column })];
      cell?.classList.toggle("coin-collected", collectedCoins.has(row + "," + column));
    }
    const earned = Object.values(wallet).reduce((sum, keys) => sum + keys.length, 0);
    const total = global.PipSkins.available(earned);
    shopButton.textContent = t("Shop", "Bolt");
    const target = (stage().scenario.coins || []).length;
    const counter = q("#tutorial-wallet");
    counter.textContent = target
      ? t("Coins " + collectedCoins.size + " / " + target + " · Wallet " + total, "Érmék: " + collectedCoins.size + " / " + target + " · Persely: " + total)
      : t("Wallet " + total, "Persely: " + total);
    counter.dataset.collected = collectedCoins.size;
    counter.dataset.target = target;
    counter.dataset.total = total;
  }
  function awardCoins() {
    if (stage().kind !== "watch") wallet[stage().id] = [...new Set([...(wallet[stage().id] || []), ...collectedCoins])];
    renderCoins();
  }
  function drawBoard() {
    const scenario = stage().scenario;
    board.replaceChildren();
    board.style.setProperty("--columns", scenario.width);
    board.style.setProperty("--rows", scenario.height);
    board.dataset.size = String(scenario.width);
    cells = [];
    for (let row = 0; row < scenario.height; row++) for (let column = 0; column < scenario.width; column++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (scenario.start.row === row && scenario.start.column === column) cell.classList.add("start");
      if (scenario.goal?.row === row && scenario.goal?.column === column) cell.classList.add("goal");
      if (scenario.obstacles.some(([r, c]) => r === row && c === column)) cell.classList.add("obstacle");
      if ((scenario.coins || []).some(([r, c]) => row === r && column === c)) {
        const coin = document.createElement("span"); coin.className = "tutorial-coin"; coin.setAttribute("aria-hidden", "true"); coin.textContent = "●"; cell.append(coin);
      }
      board.append(cell); cells.push(cell);
    }
    robot = document.createElement("div");
    robot.className = "robot";
    robot.innerHTML = "<span>•‿•</span>";
    board.append(robot);
    const view = boardViews.get(stage().id);
    collectedCoins = new Set(view?.coins || []);
    renderCoins();
    for (const i of view?.trails || []) cells[i]?.classList.add("trail");
    placeRobot(view?.state || scenario.start, true);
    if (stage().kind === "predict") drawPrediction();
  }
  function drawPrediction() {
    cells.forEach((cell) => cell.classList.remove("trail", "tutorial-mismatch"));
    const trace = lesson.simulate(state.guesses, stage().scenario);
    collectedCoins = new Set(lesson.collectCoins(stage(), trace));
    renderCoins();
    for (const step of trace) if (step.action === "forward" && !step.blocked) cells[cellIndex(step.before)].classList.add("trail");
    placeRobot(trace.at(-1)?.after || stage().scenario.start, true);
    renderRoute();
  }
  function renderRoute() {
    const route = q("#tutorial-route");
    const oldScroll = route.scrollLeft;
    route.replaceChildren();
    if (!state.guesses.length) {
      const empty = document.createElement("li"); empty.className = "tutorial-route-empty";
      empty.textContent = t("No commands yet", "Még nincs parancs"); route.append(empty);
    }
    state.guesses.forEach((action, index) => {
      const item = document.createElement("li"), code = document.createElement("code");
      code.textContent = command(action); item.append(`${index + 1}. `, code); route.append(item);
    });
    route.scrollLeft = oldScroll;
    q("#tutorial-count").textContent = t(`${state.guesses.length} entered`, `${state.guesses.length} parancs`);
  }
  function renderStatus() {
    // The course uses the same quiet feedback for every lesson.
    renderStageProgress(); renderGuidance();
  }
  function renderGuidance() {
    // Connect the explanation to code and world state, never to a hidden Read answer.
    const secondary = new Set();
    cells.forEach(cell => cell.classList.remove("tutorial-step-from", "tutorial-step-to", "tutorial-sensed-cell"));
    delete board.dataset.senseEdge;
    robot?.classList.remove("tutorial-facing-focus");
    if (active && !recap) {
      const currentCell = robotState && cells[cellIndex(robotState)];
      if (lookingAt === "code" && stage().kind !== "predict" && stage().kind !== "create") secondary.add(q(".tutorial-code-focus"));
      if (stage().kind === "predict" && message.kind !== "mismatch") {
        // Highlight only the learner's current position/facing; no expected line or move.
        if (lookingAt === "board" && robot) robot.classList.add("tutorial-facing-focus");
      } else if (message.kind === "intro" && stage().kind === "watch") {
        const target = course.focus(stage(), locale)[0];
        if (target) markLine(target.startLine, target.endLine);
        else markLine(null);
        robot?.classList.add("tutorial-facing-focus");
      } else if (message.kind === "intro" && stage().kind === "complete" && getCode() === lesson.source(stage(), locale)) {
        const target = course.focus(stage(), locale)[0];
        if (target) markLine(target.startLine, target.endLine);
      }
      if (message.kind === "watch-line" || message.kind === "playback") {
        const before = message.before;
        if (before) cells[cellIndex(before)]?.classList.add("tutorial-step-from");
        currentCell?.classList.add("tutorial-step-to");
        robot?.classList.add("tutorial-facing-focus");
      }
      if (["success", "unfinished", "mismatch"].includes(message.kind)) currentCell?.classList.add("tutorial-step-to");
      if (message.kind === "error") secondary.add(q(".tutorial-console"));
      if (stage().kind === "watch" && chapter().observation && ["intro", "watch-line", "success"].includes(message.kind)) {
        const from = chapter().observation.from === "start" ? stage().scenario.start : message.kind === "watch-line" ? message.before : robotState;
        if (from) {
          const [dr, dc] = [[-1, 0], [0, 1], [1, 0], [0, -1]][lesson.directions.indexOf(from.direction)];
          const row = from.row + dr, column = from.column + dc;
          if (!insideBoard(row, column)) board.dataset.senseEdge = from.direction;
          else cells[cellIndex({ row, column })]?.classList.add("tutorial-sensed-cell");
        }
      }
    }
    for (const element of new Set([...workspace.querySelectorAll(".tutorial-attention-secondary"), ...secondary])) {
      element.classList.toggle("tutorial-attention-secondary", secondary.has(element));
    }
  }
  function cancelExampleDelay() {
    if (!exampleDelay) return;
    clearTimeout(exampleDelay.timer); const resolve = exampleDelay.resolve;
    exampleDelay = null; resolve(false);
  }
  function holdExampleDelay() {
    if (!exampleDelay || exampleDelay.timer === null) return;
    exampleDelay.remaining = Math.max(0, exampleDelay.remaining - (performance.now() - exampleDelay.started));
    clearTimeout(exampleDelay.timer); exampleDelay.timer = null;
  }
  function resumeExampleDelay() {
    if (!exampleDelay || exampleDelay.timer !== null || examplePaused || mapHolds || global.PipWelcomePending || document.hidden || !active) return;
    const ticket = exampleDelay; ticket.started = performance.now();
    ticket.timer = setTimeout(() => {
      if (exampleDelay !== ticket) return;
      exampleDelay = null; ticket.resolve(true);
    }, ticket.remaining);
  }
  function waitExample(milliseconds, phase) {
    cancelExampleDelay(); examplePhase = phase;
    return new Promise(resolve => {
      exampleDelay = { remaining: milliseconds, started: 0, timer: null, resolve };
      renderExampleControls(); resumeExampleDelay();
    });
  }
  function cancelExampleStart() {
    autoExampleTimer = null;
    if (examplePhase === "preview") cancelExampleDelay();
  }
  function renderExampleControls() {
    const example = stage().kind === "watch";
    const button = q("#tutorial-pause");
    button.hidden = !example;
    button.disabled = message.kind === "stopped" || runtimeError;
    button.textContent = examplePaused ? t("Resume", "Folytatás") : t("Pause", "Szünet");
    button.setAttribute("aria-pressed", String(examplePaused));
  }
  function playExampleAutomatically() {
    if (!active || mapHolds || global.PipWelcomePending || recap || busy || !ready || document.hidden || stage().kind !== "watch"
      || autoExampleStage === stage().id || autoExampleTimer !== null) return;
    const ticket = { id: stage().id }; autoExampleTimer = ticket;
    const current = () => autoExampleTimer === ticket && active && !recap && !busy && ready && stage().id === ticket.id;
    void (async () => {
      const finished = await waitExample(600, "preview");
      if (!finished || !current()) return;
      autoExampleTimer = null;
      autoExampleStage = ticket.id; void run();
    })();
  }
  function renderControls() {
    // The same footer owns Run, Pause and Check across every course stage.
    q(".tutorial-check-actions").hidden = recap || stage().kind !== "predict";
    q(".tutorial-play-controls").hidden = false;
    q("#tutorial-run").hidden = stage().kind === "predict" || busy
      || stage().kind === "watch" && message.kind !== "stopped" && !runtimeError;
    q("#tutorial-run").disabled = !ready && !runtimeError;
    q("#tutorial-run").textContent = runtimeError ? t("Retry Python", "Python újraindítása") : t("Run code", "Kód futtatása");
    q("#tutorial-stop").hidden = !busy;
    q("#tutorial-stop").textContent = t("Stop", "Leállítás");
    q("#tutorial-reset").disabled = busy;
    q("#tutorial-undo").disabled = busy || !state.guesses.length;
    q("#tutorial-evaluate").disabled = busy || (!ready && !answers.has(stage().id) && !runtimeError);
    q("#tutorial-evaluate").textContent = runtimeError ? t("Retry Python", "Python újraindítása") : t("Check route · Enter", "Ellenőrzés · Enter");
    for (const button of workspace.querySelectorAll("[data-tutorial-action]")) button.disabled = busy;
    for (const button of workspace.querySelectorAll("[data-tutorial-insert], [data-tutorial-snippet], [data-code-symbol]")) button.disabled = busy || !stage().editable;
    for (const button of header.querySelectorAll("button")) button.disabled = busy;
    for (const button of header.querySelectorAll("[data-pace]")) button.disabled = false;
    header.querySelector("#tutorial-previous-lesson").disabled = busy || stage().chapter === 0;
    header.querySelector("#tutorial-next-lesson").disabled = busy || stage().chapter === lesson.chapters.length - 1;
    playExampleAutomatically(); renderExampleControls();
    textarea.readOnly = !stage().editable || busy;
    editor?.updateOptions({ readOnly: textarea.readOnly, contextmenu: locale !== "hu" });
    codeFit?.refresh();
    runtime.dataset.state = runtimeError ? "error" : busy ? "running" : ready ? "ready" : "loading";
    runtime.lastElementChild.textContent = runtimeError ? t("Python unavailable", "A Python nem érhető el") : busy ? t("Python is running…", "A Python fut…") : ready ? t("Real Python is ready", "A valódi Python készen áll") : t("Loading real Python…", "A valódi Python betöltése…");
    for (const button of header.querySelectorAll("[data-chapter]")) {
      const index = Number(button.dataset.chapter);
      button.classList.toggle("tutorial-stage-complete", lesson.stages.filter(item => item.chapter === index).every(item => completed.has(item.id)));
    }
    renderStageProgress();
    const chapterDone = chapterStages().filter(item => completed.has(item.id)).length;
    q("#tutorial-progress").textContent = t(`${chapterDone} / 4 activities complete`, `${chapterDone} / 4 feladat kész`);
    for (const button of header.querySelectorAll("[data-stage]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.stage) === state.index));
      button.classList.toggle("tutorial-stage-complete", completed.has(lesson.stages[Number(button.dataset.stage)].id));
    }
    const stageDone = !recap && !busy && message.kind === "success" && completed.has(stage().id);
    nextStageButton.hidden = !stageDone;
    celebration.hidden = !active || !stageDone || stage().kind === "watch";
    celebration.textContent = t("✓ You did it!", "✓ Sikerült!");
    if (celebration.hidden) confetti.replaceChildren();
    nextStageButton.textContent = t("Continue · Enter", "Tovább · Enter");
    if (stageDone) { q(".tutorial-check-actions").hidden = true; q("#tutorial-run").hidden = true; q("#tutorial-pause").hidden = true; }
    renderCourse(); renderGuidance(); 
  }
  function renderStageProgress() {
    const names = Object.fromEntries(course.kinds.map(kind => [kind, course.stageLabel(kind, locale)]));
    for (const [index, item] of chapterStages().entries()) {
      const node = q(`[data-progress-kind="${item.kind}"]`), done = completed.has(item.id);
      node.dataset.state = done ? "done" : item.id === stage().id ? "current" : "upcoming";
      node.querySelector("i").textContent = done ? "✓" : String(index + 1);
      node.querySelector("span").textContent = names[item.kind];
      if (item.id === stage().id) node.setAttribute("aria-current", "step"); else node.removeAttribute("aria-current");
    }
    const feedback = q("#course-stage-feedback");
    const messages = {
      success: stage().kind === "watch" ? t("Example finished", "A példa véget ért") : t("✓ Stage complete", "✓ Feladat kész"),
      unfinished: t("Not at the star yet — try a change.", "Még nincs a csillagnál — módosíts a kódon!"),
      "missing-coins": t("Some coins are still on the board — collect them before the star.", "Maradt érme a táblán — gyűjtsd össze a csillag előtt!"),
      mismatch: t("Check the marked step.", "Nézd meg a jelölt lépést!"),
      error: t("Check the highlighted code and console.", "Nézd meg a jelölt kódot és a konzolt!"),
      stopped: t("Stopped. Your code is kept.", "Leállítva. A kódod megmaradt."),
      empty: t("Add a command first.", "Előbb írj egy parancsot!"),
      "runtime-error": t("Python unavailable — try again.", "A Python nem érhető el — próbáld újra!"),
      "translation-error": t("Rename conflicting command names before switching languages.", "Nyelvváltás előtt nevezd át az ütköző parancsneveket!"),
    };
    const text = examplePaused && stage().kind === "watch" ? t("Paused", "Szünet") : messages[message.kind] || "";
    if (feedback.textContent !== text) feedback.textContent = text;
    feedback.dataset.state = message.kind;
  }
  function renderCopy() {
    optionalSummary.textContent = t("Code tools", "Kódeszközök");
    renderPracticePrompt();
    workspace.dataset.tutorialStage = stage().id;
    entry.textContent = t("Course", "Tanfolyam");
    mission.textContent = t("Learn to guide Koja, one idea at a time", "Tanuld meg irányítani Koját, lépésről lépésre");
    header.querySelector("small").textContent = t(`Lesson ${stage().chapter + 1} of ${lesson.chapters.length}`, `${stage().chapter + 1}. lecke / ${lesson.chapters.length}`);
    header.querySelector("strong").textContent = copy(chapter().label);
    header.querySelector("#tutorial-previous-lesson").textContent = t("← Previous lesson", "← Előző lecke");
    header.querySelector("#tutorial-next-lesson").textContent = t("Next lesson →", "Következő lecke →");
    header.querySelector(".tutorial-nav-options summary").textContent = t("Choose lesson", "Leckeválasztás");
    header.querySelector(".tutorial-pace > span").textContent = t("Playback pace", "Lejátszási tempó");
    for (const button of header.querySelectorAll("[data-pace]")) {
      button.textContent = { relaxed: t("Relaxed", "Lassú"), steady: t("Steady", "Normál"), quick: t("Quick", "Gyors") }[button.dataset.pace];
      button.setAttribute("aria-pressed", String(button.dataset.pace === (global.PipPlayback?.pace || "steady")));
    }
    const chooser = header.querySelector(".tutorial-chapter-buttons");
    chooser.replaceChildren();
    lesson.chapters.forEach((item, index) => {
      const button = document.createElement("button"); button.type = "button"; button.dataset.chapter = index;
      const number = document.createElement("span"), label = document.createElement("span");
      number.textContent = index + 1; label.textContent = copy(item.label); button.append(number, label);
      button.setAttribute("aria-pressed", String(index === stage().chapter));
      button.classList.toggle("tutorial-stage-complete", lesson.stages.filter(s => s.chapter === index).every(s => completed.has(s.id)));
      chooser.append(button);
    });
    // Keep the current chapter visible within its own strip, without scrolling
    // the document or moving keyboard focus during automatic advancement.
    const selectedChapter = chooser.querySelector('[aria-pressed="true"]');
    if (selectedChapter && chooser.clientWidth) {
      const itemBox = selectedChapter.getBoundingClientRect(), stripBox = chooser.getBoundingClientRect();
      if (itemBox.left < stripBox.left) chooser.scrollLeft += itemBox.left - stripBox.left;
      else if (itemBox.right > stripBox.right) chooser.scrollLeft += itemBox.right - stripBox.right;
    }
    const buttons = header.querySelector(".tutorial-stage-buttons");
    buttons.replaceChildren();
    chapterStages().forEach((item, step) => {
      const index = lesson.stages.indexOf(item);
      const button = document.createElement("button"); button.type = "button"; button.dataset.stage = index;
      const label = course.stageLabel(item.kind, locale);
      button.textContent = `${step + 1} · ${label}`; buttons.append(button);
    });
    for (const button of workspace.querySelectorAll("[data-tutorial-tab]")) {
      button.textContent = { tutorial: t("Course", "Tanfolyam"), read: t("Read code", "Kódolvasás"), write: t("Write code", "Kódírás") }[button.dataset.tutorialTab];
    }
    renderCoins();
    q("#tutorial-title").textContent = course.stageLabel(stage().kind, locale);
    q("#tutorial-eyebrow").textContent = t(`Activity ${chapterStages().findIndex(s => s.id === stage().id) + 1} of 4`, `${chapterStages().findIndex(s => s.id === stage().id) + 1}. feladat / 4`);
    const shelf = q(".tutorial-vocabulary"); shelf.replaceChildren();
    for (const action of lesson.actions) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.tutorialInsert = action;
      const code = document.createElement("code");
      code.textContent = command(action);
      button.append(code); shelf.append(button);
    }
    global.PipCodeSymbols.render(symbols, symbol => insert(null, symbol, true));
    const pythonTools = q(".tutorial-python-tools"); pythonTools.replaceChildren();
    const availableTools = lesson.tools(stage().chapter, locale);
    pythonTools.hidden = availableTools.length === 0;
    for (const tool of availableTools) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.tutorialSnippet = tool.name;
      const code = document.createElement("code"); code.textContent = tool.label; button.append(code);
      pythonTools.append(button);
    }
    q("#tutorial-reset .button-label").textContent = t("To start", "A rajthoz");
    q(".tutorial-prediction").hidden = stage().kind !== "predict";
    q(".tutorial-prediction-head strong").textContent = t("Your route", "A te útvonalad");
    for (const button of workspace.querySelectorAll("[data-tutorial-action]")) {
      button.querySelector("code").textContent = command(button.dataset.tutorialAction);
    }
    q("#tutorial-undo").textContent = t("Undo last", "Utolsó törlése");
    q("#tutorial-restart").textContent = t("Restart this lesson", "Lecke újrakezdése");
    q("#tutorial-console-title").textContent = t("Python console", "Python-konzol");
    renderRoute(); renderControls();
  }

  function failRuntime() {
    tutorialWorker?.terminate();
    ready = false; runtimeError = true;
    if (pending) { clearTimeout(pending.timer); pending.reject(new Error("Tutorial Python unavailable")); pending = null; }
    message = { kind: "runtime-error" }; renderControls();
  }
  function startWorker() {
    tutorialWorker?.terminate(); ready = false; runtimeError = false;
    const instance = window.PipPythonRuntime.create(locale);
    tutorialWorker = instance;
    const startupTimer = setTimeout(() => { if (!ready && tutorialWorker === instance) { instance.terminate(); failRuntime(); } }, 60000);
    instance.addEventListener("message", ({ data }) => {
      if (instance !== tutorialWorker) return;
      if (data?.type === "status" && data.state === "error") { clearTimeout(startupTimer); failRuntime(); return; }
      if (data?.type === "status" && data.state === "ready") { clearTimeout(startupTimer); ready = true; runtimeError = false; renderControls(); }
      if (data?.type === "result" && pending?.id === data.id) {
        const resolve = pending.resolve; clearTimeout(pending.timer); pending = null;
        resolve(data.payload);
      }
    });
    instance.addEventListener("error", () => { clearTimeout(startupTimer); if (instance === tutorialWorker) failRuntime(); });
    renderControls();
  }
  function ensureWorker() {
    if (!tutorialWorker || runtimeError) {
      try { startWorker(); } catch { failRuntime(); }
    }
  }
  function execute(code, current) {
    return new Promise((resolve, reject) => {
      const id = ++runId;
      const timer = setTimeout(() => {
        if (pending?.id !== id) return;
        tutorialWorker.terminate(); tutorialWorker = null;
        failRuntime();
      }, 5500);
      pending = { id, timer, resolve, reject };
      tutorialWorker.postMessage({ type: "run", id, code, locale, scenarios: [current.scenario] });
    });
  }
  function stop() {
    cancelExampleDelay(); examplePaused = false;
    animationId++; busy = false;
    if (pending) {
      clearTimeout(pending.timer); pending.reject(new Error("Stopped")); pending = null;
      tutorialWorker?.terminate(); tutorialWorker = null; ready = false;
    }
    markLine(null); message = { kind: "stopped" }; renderControls(); persist();
    if (!ready && active) ensureWorker();
  }
  function resetBoard() {
    if (busy) return;
    
    boardViews.delete(stage().id);
    if (stage().kind === "predict") { state.guesses = []; completed.delete(stage().id); }
    output.textContent = ""; message = { kind: stage().kind === "watch" ? "stopped" : "intro" }; markLine(null);
    drawBoard(); renderControls(); persist();
  }
  async function run() {
    if (busy || stage().kind === "predict" || recap) return;
    if (!ready) { if (stage().kind === "watch") autoExampleStage = null; ensureWorker(); return; }
    if (stage().kind === "watch") { cancelExampleStart(); examplePaused = false; autoExampleStage = stage().id; examplePhase = "playback"; }
    const code = getCode();
    if (!code.trim()) { message = { kind: "empty" }; renderStatus(); return; }
    
    setAttention(stage().kind === "watch" ? "code" : "board");
    rememberCode(); completed.delete(stage().id); resetBoard(); busy = true;
    const token = ++animationId, current = stage();
    renderControls();
    try {
      const payload = await execute(code, current);
      if (mapHolds && !await waitExample(0, examplePhase)) return;
      if (token !== animationId) return;
      const result = payload.results?.[0] || payload.partialResult;
      for (const event of result?.events || []) {
        if (mapHolds || current.kind === "watch" && examplePaused) {
          const resumed = await waitExample(0, "playback");
          if (!resumed) return;
        }
        if (token !== animationId) return;
        const isPrint = event.type === "print";
        if (isPrint || lesson.actions.includes(event.type) || event.type === "obstacle") {
          if (isPrint) output.append(document.createTextNode(event.text || ""));
          if (event.type === "forward") cells[cellIndex(robotState)].classList.add("trail");
          const before = { ...robotState };
          if (!isPrint) placeRobot(event);
          if (event.type === "forward") {
            for (const key of lesson.collectCoins(current, [event])) collectedCoins.add(key);
            renderCoins();
          }
          markLine(event.line);
          // Reveal only the editor's internal viewport, never scroll the page.
          if (current.kind === "watch" && event.line) {
            if (editor) editor.revealLineInCenterIfOutsideViewport(event.line);
            else {
              const top = codeFit?.lineBox(event.line)?.top ?? 16 + (event.line - 1) * 24;
              if (top < textarea.scrollTop || top + 24 > textarea.scrollTop + textarea.clientHeight) {
                textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 2);
                markLine(event.line);
              }
            }
          }
          message = current.kind === "watch"
            ? { kind: "watch-line", before }
            : { kind: "playback", before };
          renderStatus();
          // Reading happens before Run at the child's pace. Playback is a
          // continuous demonstration, not a series of mandatory reading pauses.
          const delay = current.kind === "watch"
            ? exampleDuration(1800)
            : global.PipPlayback?.delay(isPrint ? "print" : "run") ?? 700;
          const continued = await waitExample(delay, "playback");
          if (!continued || token !== animationId) return;
        }
      }
      if (token !== animationId) return;
      if (!payload.ok) {
        message = { kind: "error" }; markLine(payload.error?.line);
        const problem = payload.error || {};
        output.textContent = (payload.output || []).join("") + `\n${problem.type || "PythonError"}: ${problem.message || ""}`;
      } else if (result?.state?.goal_reached && collectedCoins.size < (current.scenario.coins || []).length) {
        message = { kind: "missing-coins" }; markLine(null);
      } else if (current.kind === "watch" || result?.state?.goal_reached) {
        completed.add(current.id); awardCoins(); message = { kind: "success" }; markLine(null);
      } else { message = { kind: "unfinished" }; markLine(null); }
    } catch {
      if (mapHolds && !await waitExample(0, examplePhase)) return;
      if (token === animationId) message = { kind: "runtime-error" };
    } finally {
      if (token === animationId) { busy = false; saveView(); renderControls(); persist(); queueAdvance(); }
    }
  }
  function record(action) {
    if (!active || busy || recap || stage().kind !== "predict" || !lesson.actions.includes(action)) return;
    setAttention("board");
    completed.delete(stage().id); markLine(null); message = { kind: "predicting" };
    state.guesses.push(action); drawPrediction(); renderControls(); persist();
    q("#tutorial-route").scrollLeft = q("#tutorial-route").scrollWidth;
  }
  async function evaluate() {
    if (busy || stage().kind !== "predict") return;
    if (!ready && !answers.has(stage().id)) { ensureWorker(); return; }
    setAttention("board");
    busy = true; const token = ++animationId; renderControls();
    try {
      let expected = answers.get(stage().id);
      if (!expected) {
        const payload = await execute(getCode(), stage());
        if (mapHolds && !await waitExample(0, examplePhase)) return;
        if (token !== animationId) return;
        if (!payload.ok) throw new Error("The authored example did not run");
        expected = payload.results[0].events.filter((event) => lesson.actions.includes(event.type));
        answers.set(stage().id, expected);
      }
      const mismatch = lesson.compare(expected.map((event) => event.type), state.guesses);
      if (mismatch < 0) { completed.add(stage().id); awardCoins(); message = { kind: "success" }; markLine(null); }
      else {
        completed.delete(stage().id); state.guesses = state.guesses.slice(0, mismatch);
        drawPrediction();
        const position = lesson.simulate(expected.slice(0, mismatch).map((event) => event.type), stage().scenario).at(-1)?.after || stage().scenario.start;
        cells[cellIndex(position)].classList.add("tutorial-mismatch");
        markLine(expected[mismatch]?.line || expected.at(-1)?.line);
        message = { kind: "mismatch" };
      }
    } catch {
      if (mapHolds && !await waitExample(0, examplePhase)) return;
      if (token === animationId) message = { kind: "runtime-error" };
    }
    finally { if (token === animationId) { busy = false; renderControls(); persist(); queueAdvance(); } }
  }
  function chooseStage(index) {
    if (busy || !lesson.stages[index] || index === state.index && !recap) return;
    cancelExampleStart(); cancelExampleDelay(); examplePaused = false; examplePhase = "preview"; autoExampleStage = null;
    persist(); saveView(); practiceChapter = null; recap = false; state.index = index; state.guesses = [...(state.routes[stage().id] || [])]; message = { kind: "intro" };
    setAttention("code");
    showCode(); revealTeachingFocus(); output.textContent = ""; renderCopy(); drawBoard(); renderGuidance(); persist(); focusTask();
  }
  function insert(action, template = null, inline = false) {
    if (!stage().editable || busy) return;
    const value = getCode();
    let start = textarea.selectionStart, end = textarea.selectionEnd;
    if (editor) { const model = editor.getModel(), selection = editor.getSelection(); start = model.getOffsetAt(selection.getStartPosition()); end = model.getOffsetAt(selection.getEndPosition()); }
    const before = value.slice(value.lastIndexOf("\n", start - 1) + 1, start);
    const lineEnd = value.indexOf("\n", end);
    const after = value.slice(end, lineEnd < 0 ? value.length : lineEnd);
    const indentation = before.match(/^[ \t]*/)[0];
    const code = template === null ? command(action) : template.split("\n").join("\n" + indentation);
    const snippet = inline ? template : (before.trim() ? "\n" + indentation : "") + code + (after.trim() ? "\n" + indentation : "");
    if (editor) {
      editor.pushUndoStop(); editor.executeEdits("tutorial-tool", [{ range: editor.getSelection(), text: snippet, forceMoveMarkers: true }]); editor.pushUndoStop(); editor.focus();
    } else { textarea.setRangeText(snippet, start, end, "end"); textarea.focus({ preventScroll: true }); changed(); }
    const placeholder = !inline && template && /\b(condition|count|my_function|value|message|running|pass)\b/.exec(snippet);
    if (placeholder) {
      const from = start + placeholder.index, to = from + placeholder[0].length;
      if (editor) {
        const model = editor.getModel(), a = model.getPositionAt(from), b = model.getPositionAt(to);
        editor.setSelection({ startLineNumber: a.lineNumber, startColumn: a.column, endLineNumber: b.lineNumber, endColumn: b.column });
      } else textarea.setSelectionRange(from, to);
    }
    optionalTools.open = false;
    persist();
  }
  function open() {
    if (active || document.querySelector("#read-mode").disabled) return;
    const scroll = global.scrollY;
    active = true; shell.dataset.tutorialActive = "true"; rememberDestination("course");
    nativeWorkspace.inert = true; header.hidden = workspace.hidden = runtime.hidden = mission.hidden = false;
    renderCopy();
    if (!robot) { showCode(); drawBoard(); }
    mountMonaco(); editor?.layout(); revealTeachingFocus(); placeRobot(robotState, true); ensureWorker(); renderGuidance();
    global.scrollTo({ top: scroll, behavior: "instant" });
  }
  function close(mode) {
    if (!active) return;
    cancelExampleStart(); cancelExampleDelay();
    
    if (busy) stop();
    persist(); saveView();
    const scroll = global.scrollY;
    active = false; rememberDestination(mode || "write"); renderGuidance(); delete shell.dataset.tutorialActive; nativeWorkspace.inert = false;
    header.hidden = workspace.hidden = runtime.hidden = mission.hidden = true;
    if (mode) document.querySelector(`#${mode}-mode`).click();
    renderCopy();
    global.scrollTo({ top: scroll, behavior: "instant" });
  }

  // Preflight the tutorial draft before the ordinary language switch commits.
  const switchGameLanguage = global.PipSetLanguage;
  global.PipSetLanguage = (next) => {
    if (next === locale) return switchGameLanguage(next);
    rememberCode();
    const translations = new Map();
    try {
      for (const current of lesson.stages) {
        const source = current.id === stage().id && robot ? getCode() : models.get(current.id)?.getValue() ?? codeFor(current);
        translations.set(current.id, global.PipCodeTranslation.translate(source, locale, next, current.commentTranslations || []));
      }
    } catch {
      if (active) { message = { kind: "translation-error" }; renderStatus(); }
      return false;
    }
    if (!switchGameLanguage(next)) return false;
    locale = next;
    suppressChanges = true;
    for (const current of lesson.stages) {
      const translated = translations.get(current.id);
      if (current.editable && Object.hasOwn(state.drafts, current.id)) state.drafts[current.id] = translated.code;
      const model = models.get(current.id);
      if (model && translated.edits.length) {
        const view = editor?.getModel() === model ? editor.saveViewState() : null;
        const selected = view ? editor.getSelection() : null;
        const selectionOffsets = selected ? [
          model.getOffsetAt({ lineNumber: selected.selectionStartLineNumber, column: selected.selectionStartColumn }),
          model.getOffsetAt({ lineNumber: selected.positionLineNumber, column: selected.positionColumn }),
        ].map(offset => global.PipCodeTranslation.mapOffset(offset, translated.edits)) : null;
        const edits = translated.edits.map((edit) => {
          const a = model.getPositionAt(edit.start), b = model.getPositionAt(edit.end);
          return { range: new global.monaco.Range(a.lineNumber, a.column, b.lineNumber, b.column), text: edit.text };
        });
        model.pushStackElement(); model.pushEditOperations([], edits, () => null); model.pushStackElement();
        if (view) {
          editor.restoreViewState(view);
          const [anchor, cursor] = selectionOffsets.map(offset => model.getPositionAt(offset));
          editor.setSelection(new global.monaco.Selection(anchor.lineNumber, anchor.column, cursor.lineNumber, cursor.column));
        }
      }
    }
    const translated = translations.get(stage().id);
    const selection = [textarea.selectionStart, textarea.selectionEnd].map((offset) => global.PipCodeTranslation.mapOffset(offset, translated.edits));
    const scroll = [textarea.scrollTop, textarea.scrollLeft];
    textarea.value = translated.code; textarea.setSelectionRange(...selection);
    [textarea.scrollTop, textarea.scrollLeft] = scroll;
    suppressChanges = false;
    renderCopy();
    // Output already displayed is an actual execution record and remains intact.
    persist(); return true;
  };

  function followAttention(event) {
    if (!active || recap || busy) return;
    if (event.target.closest("#tutorial-board, .tutorial-prediction")) setAttention("board");
    else if (event.target.closest("#tutorial-monaco, #tutorial-code, .tutorial-vocabulary, .tutorial-python-tools, .code-symbols")) setAttention("code");
    else return;
    renderGuidance();
  }
  let viewportFrame = null;
  global.addEventListener("scroll", () => {
    if (!active || viewportFrame !== null) return;
    viewportFrame = requestAnimationFrame(() => {
      viewportFrame = null;
      if (!active) return;
      const visible = selector => {
        const rect = q(selector).getBoundingClientRect();
        return Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      };
      const codeVisible = visible(".tutorial-code-focus"), boardVisible = visible("#tutorial-board");
      if (lookingAt === "code" && codeVisible === 0 && boardVisible > 80) setAttention("board");
      else if (lookingAt === "board" && boardVisible === 0 && codeVisible > 80) setAttention("code");
      renderGuidance();
    });
  }, { passive: true });
  workspace.addEventListener("pointerdown", followAttention);
  workspace.addEventListener("focusin", followAttention);
  entry.addEventListener("click", open);
  header.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!button || button.disabled) return;
    if (button.dataset.pace) { global.PipPlayback?.setPace(button.dataset.pace); renderCopy(); return; }
    if (button.id === "tutorial-previous-lesson") chooseStage(firstStageIndex(stage().chapter - 1));
    if (button.id === "tutorial-next-lesson") chooseStage(firstStageIndex(stage().chapter + 1));
    if (button.hasAttribute("data-stage")) chooseStage(Number(button.dataset.stage));
    if (button.hasAttribute("data-chapter")) chooseStage(firstStageIndex(Number(button.dataset.chapter)));
    header.querySelector(".tutorial-nav-options").open = false;
  });
  workspace.addEventListener("click", (event) => {
    const button = event.target.closest("button"); if (!button || button.disabled) return;
    if (button.dataset.tutorialTab && button.dataset.tutorialTab !== "tutorial") close(button.dataset.tutorialTab);
    if (button.dataset.tutorialAction) record(button.dataset.tutorialAction);
    if (button.dataset.tutorialInsert) insert(button.dataset.tutorialInsert);
    if (button.dataset.tutorialSnippet) insert(null, lesson.tools(stage().chapter, locale).find(tool => tool.name === button.dataset.tutorialSnippet).code);
  });
  q("#tutorial-run").addEventListener("click", run);
  q("#tutorial-stop").addEventListener("click", stop);
  q("#tutorial-pause").addEventListener("click", () => {
    if (stage().kind !== "watch") return;
    examplePaused = !examplePaused;
    if (examplePaused) { holdExampleDelay(); }
    else { resumeExampleDelay(); }
    renderExampleControls(); renderStageProgress();
  });
  q("#tutorial-reset").addEventListener("click", resetBoard);
  q("#tutorial-evaluate").addEventListener("click", evaluate);
  q("#tutorial-undo").addEventListener("click", () => { if (busy) return; state.guesses.pop(); completed.delete(stage().id); markLine(null); message = { kind: "intro" }; drawPrediction(); renderControls(); persist(); });
  q("#tutorial-restart").addEventListener("click", () => {
    if (busy || !confirm(t("Restart only this lesson? Your tutorial code and answers will be cleared. Read and Write are not affected.", "Újrakezded ezt a leckét? A tanulófeladat kódja és válaszai törlődnek. A kódolvasási és kódírási játékod nem változik."))) return;
    cancelExampleStart(); cancelExampleDelay(); autoExampleStage = null; examplePaused = false; examplePhase = "preview"; recap = false; setAttention("code");
    suppressChanges = true; editor?.setModel(null);
    const restarting = chapterStages();
    for (const item of restarting) {
      models.get(item.id)?.dispose(); models.delete(item.id); views.delete(item.id); boardViews.delete(item.id);
      answers.delete(item.id); completed.delete(item.id); delete state.drafts[item.id]; delete state.routes[item.id];
    }
    state.guesses = []; state.index = lesson.stages.indexOf(restarting[0]);
    suppressChanges = false; message = { kind: "intro" }; showCode(); drawBoard(); renderCopy(); persist();
  });
  textarea.addEventListener("input", changed);
  textarea.addEventListener("scroll", () => { markLine(markedLine, markedEndLine); });
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && !textarea.readOnly) { event.preventDefault(); textarea.setRangeText("    ", textarea.selectionStart, textarea.selectionEnd, "end"); changed(); }
  });
  document.addEventListener("keydown", (event) => {
    if (!active || mapHolds || document.querySelector('#course-map-dialog')?.open || global.PipWelcomePending || event.isComposing || document.querySelector("#pip-skin-shop")?.open) return;
    if (["Enter", " "].includes(event.key) && event.target?.closest?.(".course-map-entry")) return;
    if (event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      if (message.kind === "success" && completed.has(stage().id) && !recap) {
        event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) continueMinimalStage(); return;
      }
      if (recap && !event.target.closest("button")) {
        event.preventDefault(); if (!event.repeat) q("#course-continue").click(); return;
      }
    }
    if (recap) return;
    if (event.key === "Escape" && optionalTools.open) { event.preventDefault(); optionalTools.open = false; focusTask(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); event.stopImmediatePropagation(); if (stage().kind === "predict") void evaluate(); else void run(); return; }
    if (stage().kind !== "predict" || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat && !busy) void evaluate();
      return;
    }
    const action = { ArrowUp: "forward", ArrowLeft: "left", ArrowRight: "right" }[event.key];
    if (action) { event.preventDefault(); if (!event.repeat) record(action); }
    if (event.key === "Backspace") { event.preventDefault(); if (!event.repeat) q("#tutorial-undo").click(); }
    if (event.key === "ArrowDown") event.preventDefault();
  }, { capture: true });
  global.addEventListener("resize", () => { if (active && robot) { placeRobot(robotState, true); } });
  global.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => { if (document.hidden) { holdExampleDelay(); persist(); } else { resumeExampleDelay(); playExampleAutomatically(); } renderExampleControls(); });
  new MutationObserver(() => { entry.disabled = document.querySelector("#read-mode").disabled; renderPracticePrompt(); }).observe(document.querySelector("#read-mode"), { attributes: true, attributeFilter: ["disabled"] });
  new MutationObserver(mountMonaco).observe(document.querySelector("#editor-wrap"), { attributes: true, attributeFilter: ["class"] });
  renderCopy(); entry.disabled = document.querySelector("#read-mode").disabled;
  let destination = "course";
  try { destination = localStorage.getItem("pip-python-lab.destination") || "course"; } catch { /* course is the default */ }
  if (destination === "course") open();
  let parkedTutorial = null;
  function setParked(park) {
    if (park) {
      if (parkedTutorial) return;
      parkedTutorial = { active };
      cancelExampleStart(); cancelExampleDelay();
      if (busy) stop();
      if (robot) { rememberCode(); persist(); saveView(); }
      active = false;
      renderGuidance();
    } else if (parkedTutorial) {
      const previous = parkedTutorial; parkedTutorial = null;
      active = previous.active;
      renderCopy();
      if (active) {
        editor?.layout(); if (robotState) placeRobot(robotState, true);
        renderGuidance(); 
      }
    }
  }
  // The course map observes live progress; opening it does not mark a lesson
  // complete, discard a draft, restart a worked example.
  function mapSnapshot() {
    return {
      active, currentChapterId: chapter().id, currentStageId: stage().id, recap,
      chapters: lesson.chapters.map((item, index) => {
        const steps = course.sequence(index);
        const count = steps.filter(step => completed.has(step.id)).length;
        const started = count > 0 || index === stage().chapter && active
          || steps.some(step => (state.routes[step.id]?.length || 0) > 0
            || typeof state.drafts[step.id] === 'string' && state.drafts[step.id] !== lesson.source(step, locale));
        return { id: item.id, completed: count, total: steps.length, started: Boolean(started) };
      }),
    };
  }
  function openMapChapter(id) {
    const chapterIndex = lesson.chapters.findIndex(item => item.id === id);
    if (chapterIndex < 0) return false;
    if (chapterIndex !== stage().chapter) {
      if (busy) stop();
      const steps = course.sequence(chapterIndex);
      const missing = steps.find(item => !completed.has(item.id));
      chooseStage(lesson.stages.indexOf(missing || steps[0]));
      if (!missing) {
        // Revisit the achievement, without replaying an example and temporarily
        // deleting its completion mark. Stage choices remain available to review.
        recap = true;
        renderCopy(); persist();
      }
    }
    // The current chapter resumes its exact stage, including a completed-stage
    // checkpoint. A different chapter starts at its first unfinished activity.
    if (!active) { global.PipSuspendNative?.(); open(); }
    return active;
  }
  function openMapPractice(kind, id = chapter().id, options = {}) {
    const chapterIndex = lesson.chapters.findIndex(item => item.id === id);
    if (chapterIndex < 0 || !['read', 'write'].includes(kind)) return false;
    const difficulty = course.practiceLevels[chapterIndex]?.[kind];
    if (!difficulty || !global.PipNativeNavigation?.openPractice(kind, difficulty, options)) return false;
    practiceChapter = chapterIndex;
    if (active) close(kind);
    rememberDestination(kind); renderPracticePrompt(); persist();
    return true;
  }
  function welcomeReady() {
    // The welcome map owns first paint. Its close/failure path clears the flag
    // before releasing the paused example.
    if (global.PipWelcomePending || mapHolds) return false;
     resumeExampleDelay(); playExampleAutomatically();
    renderExampleControls();
    return true;
  }
  function pauseTutorialForMap() {
    if (!mapHolds && robot) mapEditorView = {
      id: stage().id, code: getCode(), model: editor?.getModel(), monaco: editor?.saveViewState(),
      selection: [textarea.selectionStart, textarea.selectionEnd],
      scroll: [textarea.scrollTop, textarea.scrollLeft],
    };
    mapHolds += 1;
    holdExampleDelay(); 
    const animations = [...(workspace.getAnimations?.({ subtree: true }) || [])]
      .filter(animation => animation.playState === 'running');
    for (const animation of animations) { mapAnimations.add(animation); animation.pause(); }
    renderExampleControls();
    let held = true;
    return () => {
      if (!held) return;
      held = false; mapHolds -= 1;
      if (!mapHolds) {
        for (const animation of mapAnimations) {
          if (animation.playState === 'paused' && animation.effect?.target?.isConnected) animation.play();
        }
        mapAnimations.clear();
        // Native dialog focus restoration may move a textarea caret. Restore
        // the existing view, but never apply stale offsets to translated code
        // or to a different lesson chosen from the map.
        const view = mapEditorView; mapEditorView = null;
        if (view && stage().id === view.id && getCode() === view.code) {
          if (editor && view.model === editor.getModel() && view.monaco) editor.restoreViewState(view.monaco);
          textarea.setSelectionRange(...view.selection);
          [textarea.scrollTop, textarea.scrollLeft] = view.scroll;
        }
        welcomeReady();
      }
      renderExampleControls();
    };
  }
  global.PipTutorial = Object.freeze({ isActive: () => active, setParked,
    map: Object.freeze({ snapshot: mapSnapshot, openChapter: openMapChapter, openPractice: openMapPractice, pauseForMap: pauseTutorialForMap, welcomeReady }),
  });
})(window);
