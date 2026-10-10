let LOCALE = window.PipLocale === "hu" ? "hu" : "en";
let IS_HUNGARIAN = LOCALE === "hu";

const APP_LOCALES = Object.freeze({
  en: Object.freeze({
    storageKey: "pip-python-lab.v9",
    actions: Object.freeze({ forward: "forward", left: "left", right: "right" }),
  }),
  hu: Object.freeze({
    storageKey: "pip-python-lab.hu.v1",
    actions: Object.freeze({ forward: "előre", left: "balra", right: "jobbra" }),
  }),
});

let APP_LOCALE = APP_LOCALES[LOCALE];
let STORAGE_KEY = APP_LOCALE.storageKey;

function pick(english, hungarian) {
  window.PipI18n?.register(english, hungarian);
  return IS_HUNGARIAN ? hungarian : english;
}

function actionCode(action) {
  return `${APP_LOCALE.actions[action] || action}()`;
}

const READ_KEY_ACTIONS = {
  ArrowUp: "forward",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function localizedConfig() {
const LEVELS = [
  {
    id: "random",
    title: pick("Guide Koja from start to finish", "Vezesd Koját a rajttól a célig"),
    fileName: "main.py",
    starterCode: "",
    scenarios: [],
  },
];

const READ_LEVEL = {
  id: "read-loops-and-turns-1",
  difficulty: "actions",
  difficultyIndex: 0,
  fileName: pick("follow_code.py", "kövesd_a_kódot.py"),
  starterCode: [
    actionCode("forward"),
    actionCode("forward"),
    actionCode("right"),
    actionCode("forward"),
    actionCode("left"),
    actionCode("forward"),
  ].join("\n"),
  scenarios: [{
    width: 5,
    height: 5,
    start: { row: 4, column: 1, direction: "up" },
    goal: null,
    obstacles: [[0, 4], [2, 3], [4, 4]],
  }],
};

const READ_DIFFICULTIES = Array.isArray(window.PipReadTutorial?.DIFFICULTIES)
  ? window.PipReadTutorial.DIFFICULTIES
  : [{
    id: "actions",
  }];

const WRITE_DIFFICULTIES = Object.freeze([
  { id: "easy", label: pick("Easy", "Könnyű"), firstRound: 1 },
  { id: "medium", label: pick("Medium", "Közepes"), firstRound: 3 },
  { id: "hard", label: pick("Hard", "Nehéz"), firstRound: 5 },
  { id: "mastery", label: pick("Mastery", "Mesterfok"), firstRound: 7 },
]);

const SENSOR_NAME = pick("whats", "mit_lát");
const SENSOR_AHEAD = pick("ahead", "előre");
const WRITE_CODE_TOOLS = Object.freeze([
  {
    id: "forward",
    group: "action",
    label: actionCode("forward"),
    snippet: actionCode("forward"),
    selection: "",
  },
  {
    id: "left",
    group: "action",
    label: actionCode("left"),
    snippet: actionCode("left"),
    selection: "",
  },
  {
    id: "right",
    group: "action",
    label: actionCode("right"),
    snippet: actionCode("right"),
    selection: "",
  },
  {
    id: "whats",
    group: "sensor",
    label: SENSOR_NAME + "(…)",
    snippet: SENSOR_NAME + "(\"" + SENSOR_AHEAD + "\")",
    selection: SENSOR_AHEAD,
  },
  {
    id: "if",
    group: "structure",
    label: "if",
    snippet: "if condition:\n    pass",
    selection: "condition",
  },
  {
    id: "for",
    group: "structure",
    label: "for",
    snippet: "for " + pick("step", "lépés") + " in range(count):\n    pass",
    selection: "count",
  },
  {
    id: "while",
    group: "structure",
    label: "while",
    snippet: "while condition:\n    pass",
    selection: "condition",
  },
  {
    id: "print",
    group: "output",
    label: "print(…)",
    snippet: "print(message)",
    selection: "message",
  },
  {
    id: "main",
    group: "structure",
    label: "def",
    snippet: "def my_function():\n    pass",
    selection: "my_function",
  },
  { id: "elif", group: "structure", label: "elif", snippet: "elif condition:\n    pass", selection: "condition" },
  { id: "else", group: "structure", label: "else", snippet: "else:\n    pass", selection: "pass" },
  { id: "call", group: "structure", label: "name()", snippet: "my_function()", selection: "my_function" },
  { id: "parameter", group: "structure", label: "def (\u2026)", snippet: "def my_function(value):\n    pass", selection: "my_function" },
  { id: "return", group: "structure", label: "return", snippet: "return value", selection: "value" },
  { id: "variable", group: "structure", label: "=", snippet: "value = 0", selection: "value" },
  { id: "update", group: "structure", label: "+=", snippet: "value += 1", selection: "value" },
  { id: "and", group: "structure", label: "and", snippet: "condition and other_condition", selection: "condition" },
  { id: "or", group: "structure", label: "or", snippet: "condition or other_condition", selection: "condition" },
  { id: "not", group: "structure", label: "not", snippet: "not condition", selection: "condition" },
  { id: "in", group: "structure", label: "in", snippet: "value in (first, second)", selection: "value" },
  { id: "break", group: "structure", label: "break", snippet: "break", selection: "" },
]);

return { LEVELS, READ_LEVEL, READ_DIFFICULTIES, WRITE_DIFFICULTIES, WRITE_CODE_TOOLS };
}
let { LEVELS, READ_LEVEL, READ_DIFFICULTIES, WRITE_DIFFICULTIES, WRITE_CODE_TOOLS } = localizedConfig();
const READ_DIFFICULTY_IDS = new Set(READ_DIFFICULTIES.map((item) => item.id));
const WRITE_DIFFICULTY_IDS = new Set(WRITE_DIFFICULTIES.map((item) => item.id));

const dom = {
  appShell: document.querySelector(".app-shell"),
  campaignNav: document.querySelector("#campaign-nav"),
  runtimePill: document.querySelector("#runtime-pill"),
  runtimeLabel: document.querySelector("#runtime-label"),
  missionTitle: document.querySelector("#mission-title"),
  fileName: document.querySelector("#file-name"),
  editorModeBadge: document.querySelector("#editor-mode-badge"),
  readModeButton: document.querySelector("#read-mode"),
  writeModeButton: document.querySelector("#write-mode"),
  editorWrap: document.querySelector("#editor-wrap"),
  editorHost: document.querySelector("#monaco-editor"),
  textarea: document.querySelector("#code-editor"),
  codeTools: document.querySelector("#code-tools"),
  codeToolsTitle: document.querySelector("#code-tools-title"),
  codeToolList: document.querySelector("#code-tool-list"),
  runButton: document.querySelector("#run-code"),
  stopButton: document.querySelector("#stop-code"),
  resetButton: document.querySelector("#reset-code"),
  nextButton: document.querySelector("#next-mission"),
  worldTitle: document.querySelector("#world-title"),
  board: document.querySelector("#board"),
  readDifficulty: document.querySelector("#read-difficulty"),
  newBoardButton: document.querySelector("#new-board"),
  resetBoardButton: document.querySelector("#reset-board"),
  replayButton: document.querySelector("#replay-button"),
  resultSummary: document.querySelector("#result-summary"),
  summaryIcon: document.querySelector("#summary-icon"),
  summaryTitle: document.querySelector("#summary-title"),
  summaryCopy: document.querySelector("#summary-copy"),
  consolePanel: document.querySelector("#console-panel"),
  consoleCount: document.querySelector("#console-count"),
  consoleOutput: document.querySelector("#console-output"),
  worldEyebrow: document.querySelector("#world-eyebrow"),
  tracePanel: document.querySelector("#trace-panel"),
  traceCount: document.querySelector("#trace-count"),
  traceRoute: document.querySelector("#trace-route"),
  traceUndo: document.querySelector("#trace-undo"),
  traceClear: document.querySelector("#trace-clear"),
  traceEvaluate: document.querySelector("#trace-evaluate"),
  traceFeedback: document.querySelector("#trace-feedback"),
  traceButtons: [...document.querySelectorAll("[data-trace-action]")],
  toast: document.querySelector("#toast"),
};

let resultStates = [];
let lastResults = [];
let monacoEditor = null;
let monacoApi = null;
let lineDecorations = [];
let suppressEditorChanges = false;
let saveTimer = null;
let worker = null;
let workerReady = false;
let pendingWorkerRun = null;
let runSequence = 0;
let animationSequence = 0;
let running = false;
let replaying = false;
let currentRobot = null;
let currentRobotState = null;
let currentRobotAngle = 90;
let cells = [];
let toastTimer = null;
let readSessionToken = 0;
let readTrace = newReadTraceState();

function resolveInitialNavigation(persistedState, handoff) {
  const savedRound = Number.isInteger(persistedState?.round) && persistedState.round > 0
    ? persistedState.round
    : 1;
  const savedMode = persistedState?.activeMode === "read" ? "read" : "write";
  const savedReadDifficulty = READ_DIFFICULTY_IDS.has(persistedState?.readDifficulty)
    ? persistedState.readDifficulty
    : "actions";
  const validHandoff = handoff
    && typeof handoff === "object"
    && ["read", "write"].includes(handoff.activeMode)
    && READ_DIFFICULTY_IDS.has(handoff.readDifficulty)
    && Number.isInteger(handoff.round)
    && handoff.round > 0;
  return {
    currentRound: validHandoff ? handoff.round : savedRound,
    activeMode: validHandoff ? handoff.activeMode : savedMode,
    readDifficulty: validHandoff ? handoff.readDifficulty : savedReadDifficulty,
    handoffApplied: Boolean(validHandoff),
  };
}

const persisted = loadProgress();
const drafts = persisted.drafts && typeof persisted.drafts === "object" ? persisted.drafts : {};
const generatedWorlds = persisted.worlds && typeof persisted.worlds === "object" ? persisted.worlds : {};
const initialNavigation = resolveInitialNavigation(persisted, window.PipNavigationHandoff);
window.PipNavigationHandoff = null;
let currentRound = initialNavigation.currentRound;
let activeMode = initialNavigation.activeMode;
let readDifficulty = initialNavigation.readDifficulty;
if (!applyGeneratedReadLevel()) {
  readDifficulty = "actions";
  applyGeneratedReadLevel();
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  if (window.PipResetInProgress) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      round: currentRound,
      activeMode,
      readDifficulty,
      drafts,
      worlds: generatedWorlds,
    }));
  } catch {
    // The app still works if private browsing blocks storage.
  }
}

// Board geometry is a locale-independent task identity. Replaying a solved
// board never creates extra completion credit, even after a language switch.
function recordWritePracticeCompletion(level) {
  const scenario = level.scenarios[0];
  const geometry = { width: scenario.width ?? 5, height: scenario.height ?? 5,
    start: scenario.start, goal: scenario.goal,
    obstacles: (scenario.obstacles || []).map(cell => [...cell]).sort((a, b) => a[0] - b[0] || a[1] - b[1]) };
  const generatorVersion = generatedWorlds[level.id]?.schemaVersion;
  window.PipLearningProgress?.recordPractice({ track: "python", kind: "write",
    difficulty: writeDifficultyForRound(), taskId: "board:" + JSON.stringify(geometry),
    ...(Number.isInteger(generatorVersion) ? { generatorVersion } : {}) });
}

function applyGeneratedReadLevel() {
  let generated;
  try {
    generated = window.PipReadTutorial?.generate?.(readDifficulty);
  } catch (error) {
    console.error("Read Code challenge generation failed.", error);
    return false;
  }
  if (!generated || !Array.isArray(generated.scenarios) || !generated.starterCode) return false;
  Object.assign(READ_LEVEL, generated);
  return true;
}

function syncDifficultyButtons(group, selectedId, focusSelected = false) {
  if (!group) return;
  const buttons = group.querySelectorAll("button[data-difficulty]");
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.difficulty === selectedId));
  }
  if (focusSelected) {
    [...buttons].find((button) => button.dataset.difficulty === selectedId)?.focus();
  }
}

function configureReadDifficultyButtons(focusSelected = false) {
  const buttons = [...dom.readDifficulty.querySelectorAll("button[data-difficulty]")];
  const englishVisibleNames = {
    actions: "Commands", for: "for", if: "if", while: "while", mixed: "Mixed",
  };
  const hungarianVisibleNames = {
    actions: "Parancsok",
    for: "for",
    if: "if",
    while: "while",
    mixed: "Vegyes",
  };
  for (const [index, profile] of READ_DIFFICULTIES.entries()) {
    const button = buttons.find((item) => item.dataset.difficulty === profile.id);
    if (!button) continue;
    const visibleLabel = IS_HUNGARIAN
      ? hungarianVisibleNames[profile.id]
      : englishVisibleNames[profile.id];
    const number = button.querySelector(".difficulty-number");
    const visibleName = button.querySelector(".difficulty-name");
    if (number) number.textContent = String(index + 1);
    if (visibleName) visibleName.textContent = visibleLabel;
  }
  syncDifficultyButtons(dom.readDifficulty, readDifficulty, focusSelected);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProgress, 250);
}

function isGeneratedWorldValid(world) {
  return Boolean(
    window.PipWorldGenerator?.validateRound?.(currentRound, world)
  );
}

function migrateSavedWorld(level, world) {
  const generator = window.PipWorldGenerator;
  const migratedWorld = generator?.migrateRound?.(currentRound, world);
  const nextWorld = migratedWorld || world;
  let changed = false;

  if (migratedWorld) {
    generatedWorlds[level.id] = migratedWorld;
    changed = true;
  }

  if (typeof drafts[level.id] === "string") {
    const migratedDraft = generator?.migrateDraft?.(currentRound, drafts[level.id]);
    if (typeof migratedDraft === "string" && migratedDraft !== drafts[level.id]) {
      drafts[level.id] = migratedDraft;
      changed = true;
    }
  }

  if (changed) saveProgress();
  return nextWorld;
}

function applyGeneratedWorld(level, force = false) {
  let world = generatedWorlds[level.id];

  if (!force) world = migrateSavedWorld(level, world);

  if (force || !isGeneratedWorldValid(world)) {
    // A language switch can select a different round; keep that language's
    // saved code even when its board must be regenerated for the new round.
    if (!force && !initialNavigation.handoffApplied) delete drafts[level.id];
    world = window.PipWorldGenerator.generateRound(currentRound);
    generatedWorlds[level.id] = world;
    saveProgress();
  }

  // Saved worlds stay locale-neutral. Presentation adds only the localized
  // starter and scenario labels, and is deliberately never written to storage.
  const presentedWorld = window.PipWorldGenerator.presentRound?.(currentRound, world) || world;
  level.starterCode = presentedWorld.starterCode;
  level.scenarios = [presentedWorld.scenario];
  level.solution = presentedWorld.solution;
}

function generateNewBoard(askBeforeReplacing = true) {
  if (activeMode !== "write") return;
  const level = LEVELS[0];
  const hasChangedCode = getCode() !== level.starterCode;

  if (
    askBeforeReplacing &&
    hasChangedCode &&
    !window.confirm(pick(
      "Generate a new board? Your code for this board will be replaced.",
      "Készüljön új tábla? A jelenlegi táblához írt kódod lecserélődik."
    ))
  ) {
    return;
  }

  delete drafts[level.id];
  applyGeneratedWorld(level, true);
  saveProgress();
  loadLevel();
  showToast(pick(
    `New Round ${currentRound} board ready`,
    `${currentRound}. pálya: elkészült az új tábla`
  ));
}

function advanceToNextRound() {
  if (activeMode !== "write") return;
  const level = LEVELS[0];
  delete drafts[level.id];
  currentRound += 1;
  applyGeneratedWorld(level, true);
  saveProgress();
  loadLevel();
  showToast(pick(`Round ${currentRound} ready`, `${currentRound}. pálya készen áll`));
}

function writeDifficultyForRound(round = currentRound) {
  if (round <= 2) return "easy";
  if (round <= 4) return "medium";
  if (round <= 6) return "hard";
  return "mastery";
}

function restoreWriteDifficultySelection() {
  const group = dom.campaignNav.querySelector("#write-difficulty");
  syncDifficultyButtons(group, writeDifficultyForRound(), true);
}

function focusWriteDifficultyAfterRender() {
  window.requestAnimationFrame(() => {
    if (activeMode !== "write" || running) return;
    syncDifficultyButtons(
      dom.campaignNav.querySelector("#write-difficulty"),
      writeDifficultyForRound(),
      true
    );
  });
}

function changeWriteDifficulty(difficultyId, { confirmed = false } = {}) {
  if (activeMode !== "write" || running || !WRITE_DIFFICULTY_IDS.has(difficultyId)) {
    restoreWriteDifficultySelection();
    return false;
  }

  const choice = WRITE_DIFFICULTIES.find((item) => item.id === difficultyId);
  if (!choice || choice.firstRound === currentRound) {
    restoreWriteDifficultySelection();
    return false;
  }

  const level = LEVELS[0];
  const hasChangedCode = getCode() !== level.starterCode;
  if (
    hasChangedCode && !confirmed
    && !window.confirm(
      pick(
        `Start ${choice.label} Write Code? Your code and current board will be replaced.`,
        `Átváltasz erre a kódírási nehézségre: ${choice.label}? A kódod és a jelenlegi pálya lecserélődik.`
      )
    )
  ) {
    restoreWriteDifficultySelection();
    return false;
  }

  let world;
  try {
    world = window.PipWorldGenerator.generateRound(choice.firstRound);
    if (!window.PipWorldGenerator.validateRound(choice.firstRound, world)) {
      throw new Error("The generated board did not pass validation.");
    }
  } catch (error) {
    console.error("Write Code difficulty change failed.", error);
    restoreWriteDifficultySelection();
    setSummary(
      "error",
      pick("A new board could not be made", "Nem sikerült új táblát készíteni"),
      pick(
        "Your current board and Python are unchanged. Try the difficulty again.",
        "A jelenlegi pályád és Python-kódod megmaradt. Próbálj újra nehézséget választani."
      )
    );
    return false;
  }

  currentRound = choice.firstRound;
  delete drafts[level.id];
  generatedWorlds[level.id] = world;
  saveProgress();
  loadLevel();
  focusWriteDifficultyAfterRender();
  showToast(pick(`${choice.label} Write Code ready`, `Kódírás – ${choice.label} nehézség`));
  return true;
}

function showToast(message) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 1800);
}

function setRuntime(state, label) {
  dom.runtimePill.dataset.state = state;
  dom.runtimeLabel.textContent = label;
}

function setSummary(kind, title, copy) {
  dom.resultSummary.hidden = !kind;
  dom.resultSummary.className = `result-summary ${kind || ""}`.trim();
  dom.summaryIcon.textContent = kind === "success" ? "\u2713" : kind === "error" ? "!" : kind === "try" ? "?" : "\u25CB";
  dom.summaryTitle.textContent = title;
  dom.summaryCopy.textContent = copy;
}

function renderCampaign() {
  const profile = window.PipWorldGenerator.roundProfile(currentRound);
  const obstacleLabel = IS_HUNGARIAN
    ? "akadály"
    : profile.obstacleCount === 1 ? "obstacle" : "obstacles";
  const selectedDifficulty = writeDifficultyForRound();
  const difficultyButtons = WRITE_DIFFICULTIES.map((item) => {
    const isSelected = item.id === selectedDifficulty;
    return `
      <button
        class="difficulty-option write-difficulty-option"
        type="button"
        data-difficulty="${item.id}"
        aria-pressed="${isSelected}"
        ${running ? "disabled" : ""}
      ><span class="difficulty-name">${item.label}</span></button>
    `;
  }).join("");

  dom.campaignNav.innerHTML = `
    <div class="round-overview">
      <span class="round-number">${currentRound}</span>
      <span class="round-copy">
        <small>${pick("Current round", "Jelenlegi pálya")}</small>
        <strong>${profile.label}</strong>
      </span>
    </div>
    <div class="round-details">
      <span>${profile.obstacleCount} ${obstacleLabel}</span>
    </div>
    <div class="difficulty-status">
      <span id="write-difficulty-label">${pick("Difficulty", "Nehézség")}</span>
      <div
        class="difficulty-options write-difficulty-options"
        id="write-difficulty"
        role="group"
      >
        ${difficultyButtons}
      </div>
    </div>
  `;
}

function renderCodeTools() {
  dom.codeToolsTitle.textContent = pick("Code tools", "Kódeszközök");
  dom.codeToolList.replaceChildren();

  for (const tool of WRITE_CODE_TOOLS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-tool";
    button.dataset.codeTool = tool.id;
    button.dataset.toolGroup = tool.group;
    const code = document.createElement("code");
    code.textContent = tool.label;
    button.append(code);
    dom.codeToolList.append(button);
    if (tool.id === "right") {
      const symbols = document.createElement("div");
      window.PipCodeSymbols.render(symbols, symbol => { if (insertTextAtSelection(symbol, "", true)) document.querySelector("#code-tools-disclosure").open = false; });
      dom.codeToolList.append(symbols);
    }
  }
}

function prepareCodeInsertion(source, start, end, snippet, selectionText, inline = false) {
  const selectionStart = Math.max(0, Math.min(start, source.length));
  const selectionEnd = Math.max(selectionStart, Math.min(end, source.length));
  if (inline) return {
    insertedText: snippet, selectionStart, selectionEnd,
    cursorStart: selectionStart + snippet.length, cursorEnd: selectionStart + snippet.length,
  };
  const lineStart = source.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndIndex = source.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
  const before = source.slice(lineStart, selectionStart);
  const after = source.slice(selectionEnd, lineEnd);
  const indentation = (before.match(/^[ \t]*/) || [""])[0];
  const startsNewLine = selectionStart === selectionEnd && before.trim() && !after.trim();
  const prefix = startsNewLine ? "\n" + indentation : "";
  const indentedSnippet = snippet.replace(/\n/g, "\n" + indentation);
  const insertedText = prefix + indentedSnippet;
  const selectedIndex = selectionText ? insertedText.indexOf(selectionText) : -1;
  const cursorStart = selectionStart + (selectedIndex >= 0 ? selectedIndex : insertedText.length);
  const cursorEnd = cursorStart + (selectedIndex >= 0 ? selectionText.length : 0);

  return { insertedText, cursorStart, cursorEnd, selectionStart, selectionEnd };
}

function insertTextAtSelection(text, selectionText = "", inline = false) {
  if (activeMode !== "write" || running) return false;

  if (monacoEditor && monacoApi) {
    const model = monacoEditor.getModel();
    const selection = monacoEditor.getSelection();
    const start = model.getOffsetAt(selection.getStartPosition());
    const end = model.getOffsetAt(selection.getEndPosition());
    const insertion = prepareCodeInsertion(model.getValue(), start, end, text, selectionText, inline);
    monacoEditor.pushUndoStop();
    monacoEditor.executeEdits("code-tools", [{
      range: selection,
      text: insertion.insertedText,
      forceMoveMarkers: true,
    }]);
    monacoEditor.pushUndoStop();
    const cursorStart = model.getPositionAt(insertion.cursorStart);
    const cursorEnd = model.getPositionAt(insertion.cursorEnd);
    monacoEditor.setSelection({
      startLineNumber: cursorStart.lineNumber,
      startColumn: cursorStart.column,
      endLineNumber: cursorEnd.lineNumber,
      endColumn: cursorEnd.column,
    });
    monacoEditor.revealPositionInCenterIfOutsideViewport(cursorStart);
    monacoEditor.focus();
    return true;
  }

  const start = dom.textarea.selectionStart;
  const end = dom.textarea.selectionEnd;
  const insertion = prepareCodeInsertion(dom.textarea.value, start, end, text, selectionText, inline);
  dom.textarea.setRangeText(
    insertion.insertedText,
    insertion.selectionStart,
    insertion.selectionEnd,
    "end"
  );
  dom.textarea.setSelectionRange(insertion.cursorStart, insertion.cursorEnd);
  dom.textarea.focus();
  onCodeChanged();
  return true;
}

function insertCodeTool(toolId) {
  const tool = WRITE_CODE_TOOLS.find((candidate) => candidate.id === toolId);
  if (!tool) return false;
  return insertTextAtSelection(tool.snippet, tool.selection);
}

function newReadTraceState() {
  return {
    phase: "idle",
    expected: [],
    guesses: [],
    result: null,
    error: null,
    mismatch: null,
  };
}

function updateModeChrome() {
  const reading = activeMode === "read";
  dom.appShell.dataset.uiMode = activeMode;
  dom.appShell.dataset.readDifficulty = readDifficulty;
  dom.appShell.dataset.round = String(currentRound);
  dom.readModeButton.setAttribute("aria-pressed", String(reading));
  dom.writeModeButton.setAttribute("aria-pressed", String(!reading));
  dom.editorModeBadge.textContent = reading
    ? pick("Read-only", "Csak olvasható")
    : pick("Python", "Python");
  dom.resetButton.textContent = pick("Clear code", "Kód törlése");
  const resetLabel = dom.resetBoardButton.querySelector(".button-label");
  if (resetLabel) resetLabel.textContent = pick("To start", "A rajthoz");
  const newBoardLabel = dom.newBoardButton.querySelector(".button-label");
  if (newBoardLabel) {
    newBoardLabel.textContent = reading
      ? pick("New challenge", "Új feladat")
      : pick("New board", "Új tábla");
  }
  configureReadDifficultyButtons();
  for (const button of dom.codeToolList.querySelectorAll("[data-code-tool], [data-code-symbol]")) button.disabled = running || reading;
}

// Each mode keeps its own working session. Only explicit New/Clear actions reset it.
const modeSessions = new Map();
const SESSION_CONTENT = [
  "missionTitle", "fileName", "worldEyebrow", "worldTitle", "runButton", "stopButton",
  "nextButton", "replayButton", "summaryIcon", "summaryTitle",
  "summaryCopy", "consoleCount", "consoleOutput", "traceCount", "traceFeedback",
];
const SESSION_CONTAINERS = ["board", "traceRoute"];
const SESSION_ATTRIBUTES = ["resultSummary", "consolePanel", "tracePanel"];
function captureModeSession() {
  const elements = {};
  for (const key of [...SESSION_CONTENT, ...SESSION_CONTAINERS, ...SESSION_ATTRIBUTES]) {
    const element = dom[key];
    elements[key] = {
      attributes: [...element.attributes].map(({ name, value }) => [name, value]),
      html: SESSION_CONTENT.includes(key) ? element.innerHTML : null,
      nodes: SESSION_CONTAINERS.includes(key) ? [...element.childNodes] : null,
      scrollTop: element.scrollTop, scrollLeft: element.scrollLeft,
    };
  }
  return {
    locale: LOCALE, code: getCode(), model: monacoEditor?.getModel(),
    view: monacoEditor?.saveViewState(), selection: [dom.textarea.selectionStart, dom.textarea.selectionEnd],
    editorScroll: [dom.textarea.scrollTop, dom.textarea.scrollLeft],
    elements, readTrace, currentRobot, currentRobotState, currentRobotAngle, cells,
    lastResults, resultStates, lineDecorations,
    review: dom.editorWrap.classList.contains("read-review"),
  };
}

function restoreModeSession(session) {
  for (const [key, state] of Object.entries(session.elements)) {
    const element = dom[key];
    for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name);
    for (const [name, value] of state.attributes) element.setAttribute(name, value);
    if (state.nodes) element.replaceChildren(...state.nodes);
    if (state.html !== null) element.innerHTML = state.html;
    element.scrollTop = state.scrollTop;
    element.scrollLeft = state.scrollLeft;
  }
  ({ readTrace, currentRobot, currentRobotState, currentRobotAngle, cells, lastResults,
    resultStates, lineDecorations } = session);
  if (monacoEditor && session.model) {
    monacoEditor.setModel(session.model);
    monacoEditor.restoreViewState(session.view);
    dom.textarea.value = session.code;
  } else setCode(session.code);
  dom.textarea.setSelectionRange(...session.selection);
  [dom.textarea.scrollTop, dom.textarea.scrollLeft] = session.editorScroll;
  dom.editorWrap.classList.toggle("read-review", session.review);
  replaceTranslatedCode(window.PipCodeTranslation.translate(getCode(), session.locale, LOCALE));
  refreshLanguagePresentation(session.locale);
  if (currentRobotState) placeRobot(currentRobotState.row, currentRobotState.column, currentRobotState.direction, true);
  setEditorReadOnly(false);
  if (activeMode === "read") {
    updateReadPredictionUi(true);
    if (readTrace.phase === "idle" && workerReady) void startReadTrace();
  }
}

function switchActivityMode(nextMode) {
  if (!["read", "write"].includes(nextMode) || nextMode === activeMode || running) return;
  const viewport = { top: window.scrollY, left: window.scrollX, behavior: "instant" };
  clearTimeout(saveTimer);
  if (activeMode === "write") drafts[LEVELS[0].id] = getCode();
  modeSessions.set(activeMode, captureModeSession());
  readSessionToken += 1;
  activeMode = nextMode;
  // A separate Monaco model retains each mode's undo history and selection.
  const saved = modeSessions.get(nextMode);
  if (monacoEditor) {
    suppressEditorChanges = true;
    monacoEditor.setModel(saved?.model || monacoApi.editor.createModel(saved?.code || "", "python"));
    suppressEditorChanges = false;
  }
  if (saved) restoreModeSession(saved);
  else if (activeMode === "read") loadReadLevel();
  else loadLevel();
  updateModeChrome();
  saveProgress();
  window.scrollTo(viewport);
}

// Course handoff only: normal Read/Write switches continue to restore sessions.
// Reuse the difficulty controls, including confirmation before replacing code.
window.PipStartCoursePractice = function (mode, difficulty, options = {}) {
  if (running || !["read", "write"].includes(mode)) return false;
  if (!(mode === "read" ? READ_DIFFICULTY_IDS : WRITE_DIFFICULTY_IDS).has(difficulty)) return false;
  if (mode === "read" && activeMode !== "read" && readDifficulty !== difficulty) {
    // Generate the selected challenge before entering Read. Entering first would
    // auto-prepare the old difficulty and make its running guard reject the new
    // one. Matching saved sessions never pass through this replacement path.
    const previousDifficulty = readDifficulty;
    readDifficulty = difficulty;
    if (!applyGeneratedReadLevel()) { readDifficulty = previousDifficulty; return false; }
    const previous = modeSessions.get("read");
    modeSessions.delete("read");
    switchActivityMode(mode);
    previous?.model?.dispose();
    return true;
  }
  switchActivityMode(mode);
  if (mode === "read") return readDifficulty === difficulty || changeReadDifficulty(difficulty);
  return writeDifficultyForRound() === difficulty || changeWriteDifficulty(difficulty, options);
};

function setReadControls(enabled) {
  dom.traceButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

const READ_DIRECTION_ORDER = ["up", "right", "down", "left"];
const READ_DIRECTION_DELTAS = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1],
};

function readActionForEvent(event) {
  if (event?.type === "obstacle") return "forward";
  if (["forward", "left", "right"].includes(event?.type)) return event.type;
  return null;
}

function simulateReadAction(state, action, scenario) {
  const before = { ...state };
  if (action === "left" || action === "right") {
    const turn = action === "right" ? 1 : -1;
    const directionIndex = READ_DIRECTION_ORDER.indexOf(before.direction);
    const direction = READ_DIRECTION_ORDER[
      (directionIndex + turn + READ_DIRECTION_ORDER.length) % READ_DIRECTION_ORDER.length
    ];
    return {
      before,
      after: { row: before.row, column: before.column, direction },
      blocked: false,
      obstacleType: null,
    };
  }

  const [rowDelta, columnDelta] = READ_DIRECTION_DELTAS[before.direction] || [0, 0];
  const row = before.row + rowDelta;
  const column = before.column + columnDelta;
  const width = scenario.width || 5;
  const height = scenario.height || 5;
  const hitWall = row < 0 || row >= height || column < 0 || column >= width;
  const hitObstacle = !hitWall && (scenario.obstacles || []).some(
    ([obstacleRow, obstacleColumn]) => obstacleRow === row && obstacleColumn === column
  );

  return {
    before,
    after: hitWall || hitObstacle
      ? before
      : { row, column, direction: before.direction },
    blocked: hitWall || hitObstacle,
    obstacleType: hitWall ? "wall" : hitObstacle ? "obstacle" : null,
  };
}

function normalizeReadActions(events, scenario) {
  const expected = [];
  let state = { ...scenario.start };

  (events || []).forEach((event, rawIndex) => {
    const action = readActionForEvent(event);
    if (!action) return;

    const transition = simulateReadAction(state, action, scenario);
    const hasWorkerState = Number.isInteger(event.row)
      && Number.isInteger(event.column)
      && typeof event.direction === "string";
    const after = hasWorkerState
      ? { row: event.row, column: event.column, direction: event.direction }
      : transition.after;

    expected.push({
      action,
      line: Number.isInteger(event.line) ? event.line : null,
      rawIndex,
      before: { ...state },
      after: { ...after },
      blocked: event.type === "obstacle" || transition.blocked,
      obstacleType: event.obstacle_type || transition.obstacleType,
    });
    state = { ...after };
  });

  return expected;
}

function createReadRouteStep(guess, index) {
  const arrows = {
    forward: "\u2191",
    left: "\u2190",
    right: "\u2192",
  };
  const arrow = arrows[guess.action] || "?";
  const command = actionCode(guess.action);
  const item = document.createElement("li");
  item.className = "trace-route-step";
  item.dataset.action = guess.action;

  const number = document.createElement("span");
  number.className = "trace-route-number";
  number.textContent = String(index + 1);

  const symbol = document.createElement("b");
  symbol.setAttribute("aria-hidden", "true");
  symbol.textContent = arrow;

  const code = document.createElement("code");
  code.textContent = command;

  item.append(number, symbol, code);
  return item;
}

function renderReadRoute() {
  if (readTrace.guesses.length === 0) {
    const existingEmpty = dom.traceRoute.querySelector(".trace-route-empty");
    if (existingEmpty && dom.traceRoute.children.length === 1) {
      existingEmpty.textContent = readTrace.phase === "preparing"
        ? pick("Preparing the challenge...", "A feladat előkészítése…")
        : pick("No actions yet", "Még nincs parancs");
      return;
    }
    const empty = document.createElement("li");
    empty.className = "trace-route-empty";
    empty.textContent = readTrace.phase === "preparing"
      ? pick("Preparing the challenge...", "A feladat előkészítése…")
      : pick("No actions yet", "Még nincs parancs");
    dom.traceRoute.replaceChildren(empty);
    return;
  }

  if (dom.traceRoute.querySelector(".trace-route-empty")) {
    dom.traceRoute.replaceChildren();
  }
  while (dom.traceRoute.children.length > readTrace.guesses.length) {
    dom.traceRoute.lastElementChild?.remove();
  }
  readTrace.guesses.forEach((guess, index) => {
    const existing = dom.traceRoute.children[index];
    if (existing?.dataset.action === guess.action) {
      existing.querySelector("code").textContent = actionCode(guess.action);
      return;
    }
    const item = createReadRouteStep(guess, index);
    if (existing) existing.replaceWith(item);
    else dom.traceRoute.appendChild(item);
  });
}

function updateReadPredictionUi(preserveScroll = false) {
  const entered = readTrace.guesses.length;
  const predicting = readTrace.phase === "predicting";

  dom.traceCount.textContent = pick(entered + (entered === 1 ? " action" : " actions"), entered + " parancs");
  dom.tracePanel.dataset.state = readTrace.phase;

  setReadControls(predicting);
  dom.traceUndo.disabled = !predicting || entered === 0;
  dom.traceClear.disabled = !predicting || entered === 0;
  dom.traceEvaluate.disabled = !predicting;
  renderReadRoute();
  if (!preserveScroll) requestAnimationFrame(() => {
    dom.traceRoute.scrollLeft = dom.traceRoute.scrollWidth;
  });
}

function clearReadReview() {
  readTrace.mismatch = null;
  dom.editorWrap.classList.remove("read-review");
  cells.forEach((cell) => {
    cell.classList.remove("read-mismatch");
    cell.querySelector(".trace-error-marker")?.remove();
    cell.removeAttribute("data-mismatch-step");
  });
  clearEditorMarks();
  if (!monacoEditor && dom.textarea.selectionStart !== dom.textarea.selectionEnd) {
    dom.textarea.setSelectionRange(0, 0);
  }
}

function renderReadGuessBoard(actions, mismatch = null) {
  const scenario = READ_LEVEL.scenarios[0];
  const trail = [];
  let state = { ...scenario.start };

  actions.forEach((action) => {
    const transition = simulateReadAction(state, action, scenario);
    if (action === "forward" && !transition.blocked) trail.push({ ...state });
    state = { ...transition.after };
  });

  renderBoard(scenario, state);
  trail.forEach((place) => addTrail(place.row, place.column));

  if (mismatch) {
    const cell = cells[mismatch.state.row * (scenario.width || 5) + mismatch.state.column];
    if (cell) {
      cell.classList.add("read-mismatch");
      cell.dataset.mismatchStep = String(mismatch.index + 1);
      const marker = document.createElement("span");
      marker.className = "trace-error-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = "!";
      cell.appendChild(marker);
    }
  }

  return state;
}

function readProgramEndLine() {
  const lines = READ_LEVEL.starterCode.split("\n");
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].trim()) return index + 1;
  }
  return null;
}

function markReadReviewLine(line) {
  clearEditorMarks();
  if (!Number.isInteger(line) || line < 1) return;
  dom.editorWrap.classList.add("read-review");
  highlightLine(line, "error");

  if (!monacoEditor) {
    const lines = READ_LEVEL.starterCode.split("\n");
    const safeLine = Math.min(line, lines.length);
    const start = lines.slice(0, safeLine - 1).reduce(
      (total, value) => total + value.length + 1,
      0
    );
    dom.textarea.setSelectionRange(start, start + (lines[safeLine - 1] || "").length);
    dom.textarea.scrollTop = Math.max(0, (safeLine - 2) * 24);
    dom.textarea.focus();
  }
}

function resetReadTrace(announce = false) {
  readSessionToken += 1;
  readTrace = newReadTraceState();
  dom.traceButtons.forEach((button) => button.classList.remove("is-correct", "is-wrong"));
  renderBoard(READ_LEVEL.scenarios[0]);
  clearReadReview();
  updateReadPredictionUi();
  resetConsole();
  // Read Code calculates its private answer automatically. The shared Run
  // button is reserved for retrying an error or opening the next challenge.
  dom.runButton.hidden = true;
  dom.runButton.disabled = true;
  dom.stopButton.hidden = true;
  setEditorReadOnly(true);
  setSummary("", "", "");
  dom.traceFeedback.textContent = pick(
    "Preparing…",
    "Előkészítés…"
  );
  if (announce) showToast(pick("Read Code lesson restarted", "A kódolvasási feladat újraindult"));
}

function clearReadPrediction(announce = false) {
  if (!readTrace.result || readTrace.phase === "preparing") {
    resetReadTrace(announce);
    return;
  }

  readSessionToken += 1;
  readTrace = {
    ...newReadTraceState(),
    phase: "predicting",
    expected: readTrace.expected,
    result: readTrace.result,
  };
  renderReadGuessBoard([]);
  clearReadReview();
  resetConsole();
  dom.runButton.hidden = true;
  dom.stopButton.hidden = true;
  setSummary("", "", "");
  dom.traceFeedback.textContent = "";
  updateReadPredictionUi();
  if (announce) {
    dom.tracePanel.focus({ preventScroll: true });
    showToast(pick("Prediction cleared", "A válasz törölve"));
  }
}

function loadReadLevel() {
  animationSequence += 1;
  lastResults = [];
  resultStates = [];
  updateModeChrome();
  dom.missionTitle.textContent = pick("Read code", "Kódolvasás");
  dom.fileName.textContent = READ_LEVEL.fileName;
  dom.worldEyebrow.textContent = pick(
    "Read code · Level " + (READ_LEVEL.difficultyIndex + 1) + " of " + READ_DIFFICULTIES.length,
    "Kódolvasás · " + (READ_LEVEL.difficultyIndex + 1) + ". szint / " + READ_DIFFICULTIES.length
  );
  dom.worldTitle.textContent = pick("Read code", "Kódolvasás");
  dom.nextButton.hidden = true;
  dom.replayButton.disabled = true;
  setCode(READ_LEVEL.starterCode);
  resetReadTrace(false);
  setSummary("", "", "");
  if (workerReady) void startReadTrace();
}

function generateNewReadChallenge(announce = false) {
  if (activeMode !== "read" || running) return false;
  if (!applyGeneratedReadLevel()) {
    dom.traceFeedback.textContent = pick(
      "The tutorial generator is unavailable.",
      "A feladatgenerátor nem érhető el."
    );
    return false;
  }
  loadReadLevel();
  if (announce) {
    dom.traceFeedback.textContent = pick("Preparing…", "Előkészítés…");
  }
  return true;
}

function changeReadDifficulty(nextDifficulty) {
  if (!READ_DIFFICULTY_IDS.has(nextDifficulty)) {
    configureReadDifficultyButtons(true);
    return false;
  }
  if (nextDifficulty === readDifficulty) {
    configureReadDifficultyButtons(true);
    return false;
  }
  const previousDifficulty = readDifficulty;
  readDifficulty = nextDifficulty;
  if (!generateNewReadChallenge(false)) {
    readDifficulty = previousDifficulty;
    configureReadDifficultyButtons(true);
    return false;
  }
  saveProgress();
  dom.traceFeedback.textContent = pick("Preparing…", "Előkészítés…");
  configureReadDifficultyButtons(true);
  return true;
}

function advanceReadTutorial() {
  if (!generateNewReadChallenge(false)) return false;
  saveProgress();
  return true;
}

function showReadPythonError(error, output = []) {
  readTrace.phase = "error";
  readTrace.error = error;
  updateReadPredictionUi();
  markEditorError(error);
  updateConsole(output, error);
  dom.traceFeedback.textContent = pick(
    "The challenge could not start. Try again after Python is ready.",
    "A feladat nem tudott elindulni. Próbáld újra, amikor a Python készen áll."
  );
  dom.runButton.innerHTML = pick(
    '<span aria-hidden="true">&#8635;</span> Try again',
    '<span aria-hidden="true">&#8635;</span> Újra'
  );
  dom.runButton.hidden = false;
  dom.runButton.disabled = !workerReady;
}

async function startReadTrace() {
  if (activeMode !== "read" || running || !workerReady) return;
  if (readTrace.phase === "preparing" || readTrace.phase === "evaluating") return;

  resetReadTrace(false);
  const token = readSessionToken;
  readTrace.phase = "preparing";
  updateReadPredictionUi();
  setRunningUi(true);
  setRuntime(
    "running",
    pick("Python is preparing the challenge...", "A Python előkészíti a feladatot…")
  );
  setConsoleRunning();
  setSummary("", "", "");
  dom.traceFeedback.textContent = pick(
    "Preparing…",
    "Előkészítés…"
  );

  let payload;
  try {
    payload = await executePython(READ_LEVEL.starterCode, READ_LEVEL.scenarios);
    if (nativeMapHolds) await wait(0);
  } catch (error) {
    if (nativeMapHolds) await wait(0);
    if (token !== readSessionToken || activeMode !== "read") return;
    setRunningUi(false);
    setRuntime(
      workerReady ? "ready" : "loading",
      workerReady
        ? pick("Real Python is ready", "A valódi Python készen áll")
        : pick("Restarting Python...", "A Python újraindítása…")
    );
    showReadPythonError({ type: "PythonError", message: error.message, line: null });
    return;
  }

  if (token !== readSessionToken || activeMode !== "read") return;

  if (!payload.ok) {
    setRunningUi(false);
    showReadPythonError(
      payload.error || {
        type: "PythonError",
        message: "The challenge could not be prepared.",
        line: null,
      },
      payload.output || []
    );
    return;
  }

  const result = payload.results?.[0];
  if (!result) {
    setRunningUi(false);
    showReadPythonError(
      {
        type: "PythonError",
        message: "The challenge did not return a route.",
        line: null,
      },
      payload.output || []
    );
    return;
  }

  translateReadOutput(result);
  const events = Array.isArray(result.events) ? result.events : [];
  readTrace = {
    ...newReadTraceState(),
    phase: "predicting",
    expected: normalizeReadActions(events, READ_LEVEL.scenarios[0]),
    result,
  };

  setRunningUi(false);
  setRuntime("ready", pick("Real Python is ready", "A valódi Python készen áll"));
  dom.runButton.hidden = true;
  resetConsole();
  updateReadPredictionUi();
  setSummary("", "", "");
  dom.traceFeedback.textContent = "";
  dom.tracePanel.focus({ preventScroll: true });
}

function recordReadAction(action) {
  if (
    activeMode !== "read"
    || readTrace.phase !== "predicting"
    || !["forward", "left", "right"].includes(action)
  ) return;

  const revisingMismatch = Boolean(readTrace.mismatch);
  clearReadReview();
  if (revisingMismatch) {
    setSummary("", "", "");
  }
  const scenario = READ_LEVEL.scenarios[0];
  const before = readTrace.guesses.length
    ? { ...readTrace.guesses[readTrace.guesses.length - 1].after }
    : { ...scenario.start };
  const transition = simulateReadAction(before, action, scenario);
  readTrace.guesses.push({ action, ...transition });

  if (action === "forward" && !transition.blocked) {
    addTrail(before.row, before.column);
    placeRobot(
      transition.after.row,
      transition.after.column,
      transition.after.direction
    );
  } else if (action === "forward") {
    currentRobot?.classList.add("bump");
    flashCurrentCell(before.row, before.column);
    const token = readSessionToken;
    setTimeout(() => {
      if (token === readSessionToken) currentRobot?.classList.remove("bump");
    }, 390);
  } else {
    placeRobot(
      transition.after.row,
      transition.after.column,
      transition.after.direction
    );
  }

  updateReadPredictionUi();
  dom.traceFeedback.textContent = "";
}

function undoReadAction() {
  if (activeMode !== "read" || readTrace.phase !== "predicting" || !readTrace.guesses.length) return;
  clearReadReview();
  readTrace.guesses.pop();
  renderReadGuessBoard(readTrace.guesses.map((guess) => guess.action));
  updateReadPredictionUi();
  setSummary("", "", "");

  dom.traceFeedback.textContent = "";
}

function evaluateReadPrediction() {
  if (activeMode !== "read" || readTrace.phase !== "predicting") return;

  clearReadReview();
  readTrace.phase = "evaluating";
  updateReadPredictionUi();
  updateConsole(readTrace.result?.output || []);

  const comparisonLength = Math.max(
    readTrace.expected.length,
    readTrace.guesses.length
  );
  let mismatchIndex = -1;
  for (let index = 0; index < comparisonLength; index += 1) {
    if (readTrace.expected[index]?.action !== readTrace.guesses[index]?.action) {
      mismatchIndex = index;
      break;
    }
  }

  if (mismatchIndex === -1) {
    readTrace.phase = "complete";
    window.PipLearningProgress?.recordPractice({ track: "python", kind: "read", difficulty: readDifficulty, taskId: READ_LEVEL.id });
    updateReadPredictionUi();
    clearEditorMarks();
    dom.traceFeedback.textContent = pick(
      "Correct!",
      "Helyes!"
    );
    dom.runButton.innerHTML = pick(
      '<span aria-hidden="true">&#8635;</span> Next challenge',
      '<span aria-hidden="true">&#8635;</span> Következő feladat'
    );
    dom.runButton.hidden = false;
    dom.runButton.disabled = !workerReady;
    return;
  }

  const expected = readTrace.expected[mismatchIndex];
  const guessed = readTrace.guesses[mismatchIndex];
  const correctPrefix = readTrace.guesses.slice(0, mismatchIndex);
  const lastExpected = readTrace.expected[readTrace.expected.length - 1];
  const finalExpectedState = lastExpected?.after || READ_LEVEL.scenarios[0].start;
  const mismatch = {
    index: mismatchIndex,
    line: expected?.line || lastExpected?.line || readProgramEndLine(),
    state: { ...(expected?.before || finalExpectedState) },
    expected, guessed, lastExpected,
  };

  readTrace.guesses = correctPrefix;
  readTrace.phase = "predicting";
  readTrace.mismatch = mismatch;
  renderReadGuessBoard(
    correctPrefix.map((guess) => guess.action),
    mismatch
  );
  markReadReviewLine(mismatch.line);
  updateReadPredictionUi();
  dom.runButton.hidden = true;

  renderReadMismatchFeedback(mismatch);
  if (monacoEditor) dom.tracePanel.focus({ preventScroll: true });
}

function renderReadMismatchFeedback(mismatch) {
  const { expected, guessed, lastExpected, index: mismatchIndex } = mismatch;
  const row = mismatch.state.row + 1;
  const column = mismatch.state.column + 1;
  let announcement;

  if (expected && guessed) {
    const expectedName = actionCode(expected.action);
    const guessedName = actionCode(guessed.action);
    if (IS_HUNGARIAN) {
      const lineCopy = "a kód " + expected.line + ". sora";
      announcement = "Eltérés – " + (mismatchIndex + 1) + ". parancs: ezt választottad: "
        + guessedName + ", de " + lineCopy + " ezt futtatja: " + expectedName
        + ". A megjelölt mező: " + row + ". sor, " + column + ". oszlop.";
    } else {
      const lineCopy = "highlighted line " + expected.line;
      announcement = "Action " + (mismatchIndex + 1) + ": you chose " + guessedName
        + ", but " + lineCopy + " runs " + expectedName + ". The marked square is row "
        + row + ", column " + column + ".";
    }
  } else if (expected) {
    const expectedName = actionCode(expected.action);
    if (IS_HUNGARIAN) {
      const lineCopy = "a kód " + expected.line + ". sora";
      announcement = "Az útvonalad túl korán ér véget. A hiányzó parancs sorszáma: "
        + (mismatchIndex + 1) + ". Helyesen: " + expectedName + " – " + lineCopy
        + ". A megjelölt mező: " + row + ". sor, " + column + ". oszlop.";
    } else {
      const lineCopy = "highlighted line " + expected.line;
      announcement = "Your route stops too soon. Action " + (mismatchIndex + 1)
        + " should be " + expectedName + " from " + lineCopy + ". The marked square is row "
        + row + ", column " + column + ".";
    }
  } else {
    const guessedName = actionCode(guessed.action);
    if (IS_HUNGARIAN) {
      const finishCopy = lastExpected?.line
        ? "a kód " + lastExpected.line + ". sora"
        : "az utolsó sor";
      announcement = "Az útvonalad túl hosszú. A felesleges parancs sorszáma: " + (mismatchIndex + 1)
        + ". Parancs: " + guessedName + ". A program már befejeződött " + finishCopy + " után"
        + ". A megjelölt mező: " + row + ". sor, " + column + ". oszlop.";
    } else {
      const finishCopy = lastExpected?.line
        ? "highlighted line " + lastExpected.line
        : "the last line";
      announcement = "Your route is too long. Action " + (mismatchIndex + 1)
        + ", " + guessedName + ", comes after Python finished at " + finishCopy
        + ". The marked square is row " + row + ", column " + column + ".";
    }
  }

  dom.traceFeedback.textContent = announcement;
}

function getCode() {
  return monacoEditor ? monacoEditor.getValue() : dom.textarea.value;
}

function setCode(value) {
  suppressEditorChanges = true;
  dom.textarea.value = value;
  if (monacoEditor) monacoEditor.setValue(value);
  suppressEditorChanges = false;
  window.PipNativeCodeFit?.refresh();
}

function setEditorReadOnly(readOnly) {
  const shouldLock = readOnly || activeMode === "read";
  dom.textarea.readOnly = shouldLock;
  monacoEditor?.updateOptions({ readOnly: shouldLock });
  window.PipNativeCodeFit?.refresh();
}

function onCodeChanged() {
  window.PipNativeCodeFit?.refresh();
  if (suppressEditorChanges || activeMode === "read") return;
  const level = LEVELS[0];
  drafts[level.id] = getCode();
  scheduleSave();

  if (lastResults.some(Boolean)) {
    lastResults = [];
    resultStates = level.scenarios.map(() => "idle");
    dom.replayButton.disabled = true;
    setSummary("", "", "");
  }
  clearEditorMarks();
}

function clearEditorMarks() {
  if (monacoEditor && monacoApi) {
    lineDecorations = monacoEditor.deltaDecorations(lineDecorations, []);
    monacoApi.editor.setModelMarkers(monacoEditor.getModel(), "pip-python", []);
  }
}

function highlightLine(line, kind = "executing") {
  if (!monacoEditor || !monacoApi) return;
  const validLine = Number.isInteger(line) && line > 0 && line <= monacoEditor.getModel().getLineCount();
  lineDecorations = monacoEditor.deltaDecorations(lineDecorations, validLine ? [{
    range: new monacoApi.Range(line, 1, line, 1),
    options: {
      isWholeLine: true,
      className: kind === "error" ? "error-line" : "executing-line",
      glyphMarginClassName: kind === "error" ? "" : "executing-glyph",
    },
  }] : []);
  if (validLine) monacoEditor.revealLineInCenterIfOutsideViewport(line);
}

function markEditorError(error) {
  if (!monacoEditor || !monacoApi || !error.line) return;
  const line = Math.max(1, Math.min(error.line, monacoEditor.getModel().getLineCount()));
  const maxColumn = monacoEditor.getModel().getLineMaxColumn(line);
  monacoApi.editor.setModelMarkers(monacoEditor.getModel(), "pip-python", [{
    startLineNumber: line,
    startColumn: 1,
    endLineNumber: line,
    endColumn: maxColumn,
    message: `${pythonErrorTypeLabel(error.type)}: ${localizedPythonErrorMessage(error)}`,
    severity: monacoApi.MarkerSeverity.Error,
  }]);
  highlightLine(line, "error");
}

function renderBoard(scenario, robotState = scenario.start) {
  animationSequence += 1;
  const renderToken = animationSequence;
  const initialRobotState = { ...robotState };
  dom.board.innerHTML = "";
  cells = [];

  const width = scenario.width || 5;
  const height = scenario.height || 5;
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.column = column;

      if (row === scenario.start.row && column === scenario.start.column) cell.classList.add("start");
      if (scenario.goal && row === scenario.goal.row && column === scenario.goal.column) cell.classList.add("goal");
      if ((scenario.obstacles || []).some(([r, c]) => r === row && c === column)) cell.classList.add("obstacle");

      cells.push(cell);
      dom.board.appendChild(cell);
    }
  }

  currentRobotState = { ...initialRobotState };
  currentRobot = document.createElement("div");
  currentRobot.className = "robot";
  currentRobot.innerHTML = "<span>&bull;&#8255;&bull;</span>";
  currentRobotAngle = directionAngle(initialRobotState.direction);
  currentRobot.style.setProperty("--angle", currentRobotAngle + "deg");
  dom.board.appendChild(currentRobot);

  placeRobot(
    initialRobotState.row,
    initialRobotState.column,
    initialRobotState.direction,
    true
  );

  requestAnimationFrame(() => {
    const unchanged = currentRobotState
      && currentRobotState.row === initialRobotState.row
      && currentRobotState.column === initialRobotState.column
      && currentRobotState.direction === initialRobotState.direction;
    if (renderToken !== animationSequence || !unchanged) return;
    placeRobot(
      initialRobotState.row,
      initialRobotState.column,
      initialRobotState.direction,
      true
    );
  });
}

function resetBoardToStart() {
  if (running) return;

  if (activeMode === "read") {
    clearReadPrediction(true);
    return;
  }

  const level = LEVELS[0];
  const scenario = level?.scenarios?.[0];
  if (!scenario) return;

  renderBoard(scenario);
  clearEditorMarks();
  setEditorReadOnly(false);
  dom.replayButton.disabled = !lastResults[0];

  showToast(pick("Koja reset to start", "Koja visszakerült a rajthoz"));
}

function directionAngle(direction) {
  return { up: 0, right: 90, down: 180, left: 270 }[direction] ?? 90;
}

function placeRobot(row, column, direction, instant = false) {
  if (!currentRobot) return;
  const cell = cells[row * 5 + column];
  if (!cell) return;

  const previousDirection = currentRobotState?.direction;
  const targetAngle = directionAngle(direction);
  if (!previousDirection || (instant && previousDirection !== direction)) {
    currentRobotAngle = targetAngle;
  } else if (!instant) {
    let turn = targetAngle - directionAngle(previousDirection);
    if (turn > 180) turn -= 360;
    if (turn < -180) turn += 360;
    currentRobotAngle += turn;
  }
  currentRobotState = { row, column, direction };
  if (instant) currentRobot.style.transition = "none";
  const x = cell.offsetLeft + (cell.offsetWidth - currentRobot.offsetWidth) / 2;
  const y = cell.offsetTop + (cell.offsetHeight - currentRobot.offsetHeight) / 2;
  currentRobot.style.transform = `translate(${x}px, ${y}px)`;
  currentRobot.style.setProperty("--angle", `${currentRobotAngle}deg`);

  if (instant) requestAnimationFrame(() => {
    if (currentRobot) currentRobot.style.transition = "";
  });
}

function addTrail(row, column) {
  const cell = cells[row * 5 + column];
  if (cell) cell.classList.add("trail");
}

function flashCurrentCell(row, column) {
  const cell = cells[row * 5 + column];
  if (!cell) return;
  cell.classList.remove("edge-flash");
  void cell.offsetWidth;
  cell.classList.add("edge-flash");
}

// The map holds playback in place; unlike Stop, it never resets a route.
let nativeMapHolds = 0;
const nativePlaybackWaits = new Set();
const nativeMapAnimations = new Set();
function resumeNativeWait(ticket) {
  if (nativeMapHolds || ticket.timer !== null) return;
  ticket.started = performance.now();
  ticket.timer = setTimeout(() => {
    ticket.timer = null;
    nativePlaybackWaits.delete(ticket);
    ticket.resolve();
  }, ticket.remaining);
}
function wait(milliseconds) {
  return new Promise(resolve => {
    const ticket = { remaining: milliseconds, started: 0, timer: null, resolve };
    nativePlaybackWaits.add(ticket);
    resumeNativeWait(ticket);
  });
}
function pauseNativeForMap() {
  nativeMapHolds += 1;
  for (const ticket of nativePlaybackWaits) {
    if (ticket.timer === null) continue;
    ticket.remaining = Math.max(0, ticket.remaining - (performance.now() - ticket.started));
    clearTimeout(ticket.timer); ticket.timer = null;
  }
  const animations = [...(document.querySelector('main > .workspace')?.getAnimations?.({ subtree: true }) || [])]
    .filter(animation => animation.playState === 'running');
  for (const animation of animations) { nativeMapAnimations.add(animation); animation.pause(); }
  let held = true;
  return () => {
    if (!held) return;
    held = false; nativeMapHolds -= 1;
    if (!nativeMapHolds) {
      for (const animation of nativeMapAnimations) {
        if (animation.playState === 'paused' && animation.effect?.target?.isConnected) animation.play();
      }
      nativeMapAnimations.clear();
      for (const ticket of nativePlaybackWaits) resumeNativeWait(ticket);
    }
  };
}

async function animateScenario(result, scenario, options = {}) {
  const token = ++animationSequence;
  if (nativeMapHolds) await wait(0);
  if (token !== animationSequence) return;
  renderBoard(scenario);
  beginConsolePlayback(Boolean(options.replay));
  const localToken = animationSequence;
  dom.replayButton.disabled = true;
  setEditorReadOnly(true);

  let previous = { ...scenario.start };
  await wait(globalThis.PipPlayback?.delay("start") ?? 200);

  const events = Array.isArray(result.events) ? result.events : [];
  let playbackOutput = "";
  let eventIndex = 0;

  while (eventIndex < events.length) {
    if (nativeMapHolds) await wait(0);
    let event = events[eventIndex];
    if (localToken !== animationSequence) return;

    if (event.type === "print") {
      let newOutput = "";
      while (eventIndex < events.length && events[eventIndex].type === "print") {
        event = events[eventIndex];
        if (typeof event.text === "string") newOutput += event.text;
        eventIndex += 1;
      }

      playbackOutput += newOutput;
      highlightLine(event.line);
      if (playbackOutput) {
        appendConsoleOutput(newOutput, playbackOutput);
      } else {
        setConsole(
          "",
          pick("Playing", "Lejátszás"),
          "running"
        );
      }

      await wait(globalThis.PipPlayback?.delay("print") ?? 900);
      continue;
    }

    eventIndex += 1;
    highlightLine(event.line);

    if (event.type === "forward") {
      addTrail(previous.row, previous.column);
      placeRobot(event.row, event.column, event.direction);
      previous = { row: event.row, column: event.column, direction: event.direction };
      await wait(globalThis.PipPlayback?.delay("run") ?? 700);
    } else if (event.type === "left" || event.type === "right") {
      placeRobot(event.row, event.column, event.direction);
      previous.direction = event.direction;
      await wait(globalThis.PipPlayback?.delay("run") ?? 700);
    } else if (event.type === "obstacle") {
      currentRobot?.classList.add("bump");
      flashCurrentCell(event.row, event.column);
      await wait(globalThis.PipPlayback?.delay("run") ?? 700);
      currentRobot?.classList.remove("bump");
    } else if (event.type === "goal") {
      cells[event.row * 5 + event.column]?.classList.add("goal-hit");
      currentRobot?.classList.add("celebrate");
      await wait(globalThis.PipPlayback?.delay("goal") ?? 850);
    } else {
      await wait(250);
    }
  }

  if (localToken !== animationSequence) return;
  clearEditorMarks();
  setEditorReadOnly(false);
  dom.replayButton.disabled = false;
  const finalOutput = Array.isArray(result.output)
    ? result.output.join("")
    : typeof result.output === "string" ? result.output : "";
  if (!finalOutput || finalOutput !== playbackOutput) updateConsole(result.output || []);
}

function setConsole(text, badge, state) {
  dom.consoleOutput.textContent = text;
  dom.consoleCount.textContent = badge;
  dom.consolePanel.dataset.state = state;
  dom.consolePanel.classList.toggle("has-error", state === "error");
  requestAnimationFrame(() => {
    dom.consoleOutput.scrollTop = dom.consoleOutput.scrollHeight;
  });
}

function appendConsoleOutput(chunk, fullOutput) {
  if (dom.consolePanel.dataset.state !== "output") {
    dom.consoleOutput.textContent = "";
  }
  if (chunk) dom.consoleOutput.append(document.createTextNode(chunk));
  const lineCount = outputLineCount(fullOutput);
  const badge = IS_HUNGARIAN
    ? `${lineCount} sor`
    : `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
  dom.consoleCount.textContent = badge;
  dom.consolePanel.dataset.state = "output";
  dom.consolePanel.classList.toggle("has-error", false);
  requestAnimationFrame(() => {
    dom.consoleOutput.scrollTop = dom.consoleOutput.scrollHeight;
  });
}

function resetConsole() {
  setConsole("", pick("Ready", "Kész"), "idle");
}

function setConsoleRunning() {
  setConsole("", pick("Running", "Fut"), "running");
}

function beginConsolePlayback(replay = false) {
  setConsole("", replay ? pick("Replay", "Visszajátszás") : pick("Playing", "Lejátszás"), "running");
}

function setConsoleStopped(
  message = pick("Run stopped. Your code is unchanged.", "A futás leállt. A kódod változatlan maradt.")
) {
  if (dom.consolePanel.dataset.state === "output") {
    setConsole(dom.consoleOutput.textContent, pick("Stopped", "Leállítva"), "stopped");
    return;
  }
  setConsole(message, pick("Stopped", "Leállítva"), "stopped");
}

function outputLineCount(text) {
  if (!text) return 0;
  const newlines = (text.match(/\n/g) || []).length;
  return newlines + (text.endsWith("\n") ? 0 : 1);
}

function pythonErrorTypeLabel(type) {
  if (!IS_HUNGARIAN) return type || "PythonError";
  if (type === "ProgramLimitError") return "Programkorlát";
  if (!type || type === "PythonError") return "Python-hiba";
  return type;
}

function localizedPythonErrorMessage(error) {
  const type = error?.type || "PythonError";
  const raw = String(error?.message || "").trim();
  if (!IS_HUNGARIAN) return raw || "Something went wrong.";

  // Preserve known runtime diagnostics, not English errors that happen to
  // mention a Hungarian variable or function name.
  const runtimeDiagnostic = {
    ProgramLimitError: /^(?:A program túl sokáig ismételte ugyanazt\.|A program túl sokáig futott, ezért Koja leállította\.|Koja több mint 160 parancsot kapott\.|A program több mint 2000 karaktert írt ki\.)/,
    PythonError: /^A Python érvénytelen eredményt adott vissza\. Próbáld újra\.$/,
    ValueError: /^A mit_lát\(\) csak ezekkel az irányokkal használható:/,
    TypeError: /^(?:A print\(\) csak a játék konzoljára írhat;|A sep értéke csak None vagy szöveg lehet, nem |Az end értéke csak None vagy szöveg lehet, nem )/,
  }[type];
  if (runtimeDiagnostic instanceof RegExp && runtimeDiagnostic.test(raw)) return raw;

  if (type === "IndentationError" || type === "TabError") {
    return "A behúzás nem megfelelő. Ellenőrizd a sorok elején lévő szóközöket.";
  }
  if (type === "SyntaxError") {
    return "A Python nem tudta értelmezni ezt a sort. Ellenőrizd az írásjeleket és a helyesírást.";
  }
  if (type === "NameError") {
    const match = raw.match(/^name ['"](.+?)['"] is not defined$/);
    return match
      ? `Nincs definiálva ez a név: „${match[1]}”.`
      : "A Python nem találja az egyik használt nevet.";
  }
  if (type === "UnboundLocalError") {
    return "A program egy helyi változót az értékadása előtt próbált használni.";
  }
  if (type === "TypeError") {
    if (raw.includes("GameRuntime.forward")) return "Az előre() nem fogad argumentumot.";
    if (raw.includes("GameRuntime.left")) return "A balra() nem fogad argumentumot.";
    if (raw.includes("GameRuntime.right")) return "A jobbra() nem fogad argumentumot.";
    if (raw.includes("GameRuntime.whats")) return "A mit_lát() pontosan egy irányargumentumot vár.";
    return "Egy függvény nem megfelelő számú vagy típusú értéket kapott.";
  }
  if (type === "ValueError") return "Egy megadott érték ezen a helyen nem használható.";
  if (type === "ZeroDivisionError") return "Nullával nem lehet osztani.";
  if (type === "IndexError") return "A program egy lista határain kívüli elemet próbált elérni.";
  if (type === "KeyError") return `A szótárban nincs ilyen kulcs: ${raw || "ismeretlen"}.`;
  if (type === "AttributeError") {
    return "Ez az érték nem rendelkezik a kért tulajdonsággal vagy függvénnyel.";
  }
  if (type === "RecursionError") return "A függvény túl sokszor hívta meg önmagát.";
  return "A Python hibát talált a program futása közben.";
}

function updateConsole(chunks, error = null) {
  let output = Array.isArray(chunks)
    ? chunks.join("")
    : typeof chunks === "string" ? chunks : "";

  if (error) {
    const location = error.line
      ? pick(` (line ${error.line})`, ` (${error.line}. sor)`)
      : "";
    const errorText = `${pythonErrorTypeLabel(error.type)}: ${localizedPythonErrorMessage(error)}${location}`;
    const separator = output && !output.endsWith("\n") ? "\n" : "";
    if (dom.consolePanel.dataset.state === "output" && dom.consoleOutput.textContent === output) {
      dom.consoleOutput.append(document.createTextNode(separator + errorText));
      dom.consoleCount.textContent = pick("Error", "Hiba");
      dom.consolePanel.dataset.state = "error";
      dom.consolePanel.classList.toggle("has-error", true);
      requestAnimationFrame(() => {
        dom.consoleOutput.scrollTop = dom.consoleOutput.scrollHeight;
      });
      return;
    }
    output += separator + errorText;
    setConsole(output, pick("Error", "Hiba"), "error");
    return;
  }

  if (!output) {
    setConsole(
      "",
      pick("No output", "Nincs kimenet"),
      "empty"
    );
    return;
  }

  const lineCount = outputLineCount(output);
  setConsole(
    output,
    IS_HUNGARIAN ? `${lineCount} sor` : `${lineCount} ${lineCount === 1 ? "line" : "lines"}`,
    "output"
  );
}

function friendlyError(error) {
  const location = error.line
    ? pick(` on line ${error.line}`, ` (${error.line}. sor)`)
    : "";
  if (error.type === "IndentationError" || error.type === "TabError") {
    return {
      title: pick("Check the indentation", "Ellenőrizd a behúzást"),
      copy: pick(
        `Python uses spaces to group instructions${location}. Lines inside a function, loop, or if statement need to move to the right.`,
        `A Python szóközökkel csoportosítja az utasításokat${location}. A függvényen, cikluson vagy if szerkezeten belüli sorokat beljebb kell húzni.`
      ),
    };
  }
  if (error.type === "SyntaxError") {
    return {
      title: pick(
        "Python could not read that line",
        "A Python nem tudta értelmezni ezt a sort"
      ),
      copy: pick(
        `There is a punctuation or spelling problem${location}. Check colons, parentheses, and quotation marks.`,
        `Írásjel- vagy helyesírási hiba van${location}. Ellenőrizd a kettőspontokat, zárójeleket és idézőjeleket.`
      ),
    };
  }
  if (error.type === "NameError") {
    return {
      title: pick("Python could not find that name", "A Python nem találja ezt a nevet"),
      copy: IS_HUNGARIAN ? `${localizedPythonErrorMessage(error)}${location}` : error.message,
    };
  }
  if (error.type === "ProgramLimitError") {
    return {
      title: pick("The program kept going", "A program nem állt meg"),
      copy: pick(
        "Koja stopped it safely. Check for a loop that never ends or too many repeated actions.",
        "Koja biztonságosan leállította. Keress végtelen ciklust vagy túl sok ismételt parancsot."
      ),
    };
  }
  if (error.type === "TypeError") {
    return {
      title: pick("Those values do not fit", "Ezek az értékek nem illenek ide"),
      copy: IS_HUNGARIAN
        ? `${localizedPythonErrorMessage(error)}${error.line ? ` A hiba helye: ${error.line}. sor.` : ""}`
        : `${error.message}${error.line ? ` Check line ${error.line}.` : ""}`,
    };
  }
  return {
    title: pick(
      `${error.type || "Python"} stopped the run`,
      `A futás leállt (${pythonErrorTypeLabel(error.type)})`
    ),
    copy: IS_HUNGARIAN
      ? `${localizedPythonErrorMessage(error)}${location}`
      : `${error.message || "Something went wrong."}${location}`,
  };
}

function showPythonError(error, output = []) {
  resultStates = LEVELS[0].scenarios.map(() => "fail");
  markEditorError(error);
  updateConsole(output, error);
  const friendly = friendlyError(error);
  setSummary("error", friendly.title, friendly.copy);

}

function setRunningUi(isRunning) {
  running = isRunning;
  dom.runButton.hidden = isRunning;
  dom.stopButton.hidden = !isRunning;
  dom.replayButton.disabled = isRunning || !lastResults[0];
  dom.resetButton.disabled = isRunning;
  dom.nextButton.disabled = isRunning;
  dom.newBoardButton.disabled = isRunning;
  const readDifficultyButtons = dom.readDifficulty.querySelectorAll("button[data-difficulty]");
  for (const button of readDifficultyButtons) button.disabled = isRunning;
  dom.readDifficulty.setAttribute("aria-disabled", String(isRunning));
  const writeDifficulty = dom.campaignNav.querySelector("#write-difficulty");
  if (writeDifficulty) {
    for (const button of writeDifficulty.querySelectorAll("button[data-difficulty]")) {
      button.disabled = isRunning;
    }
    writeDifficulty.setAttribute("aria-disabled", String(isRunning));
  }
  dom.resetBoardButton.disabled = isRunning;
  dom.readModeButton.disabled = isRunning;
  dom.writeModeButton.disabled = isRunning;
  for (const button of dom.codeToolList.querySelectorAll("[data-code-tool], [data-code-symbol]")) {
    button.disabled = isRunning || activeMode === "read";
  }
  setEditorReadOnly(isRunning);
  if (!isRunning) {
    dom.runButton.disabled = !workerReady;
    dom.stopButton.hidden = true;
  }
}

function startWorker() {
  if (worker) worker.terminate();
  workerReady = false;
  dom.runButton.disabled = true;
  setRuntime("loading", pick("Loading real Python...", "A valódi Python betöltése…"));

  try {
    worker = window.PipPythonRuntime.create(LOCALE);
  } catch {
    setRuntime("error", pick("Python could not start", "A Python nem tudott elindulni"));
    setSummary(
      "error",
      pick("Real Python could not load", "A valódi Python nem tudott betöltődni"),
      pick(
        "Check your internet connection, then refresh this page.",
        "Ellenőrizd az internetkapcsolatot, majd frissítsd az oldalt."
      )
    );
    return;
  }

  const instance = worker;
  const startupTimer = setTimeout(() => {
    if (worker === instance && !workerReady) failRuntime();
  }, 60000);
  worker.addEventListener("message", (event) => {
    if (worker !== instance) return;
    const message = event.data;
    if (message?.type === "status" && message.state === "error") {
      failRuntime();
      return;
    }
    if (message?.type === "status" && message.state === "ready") {
      clearTimeout(startupTimer);
      workerReady = true;
      setRuntime("ready", pick("Real Python is ready", "A valódi Python készen áll"));
      if (!running && activeMode === "read" && readTrace.phase === "idle") {
        void startReadTrace();
      } else if (!running) {
        dom.runButton.disabled = false;
      }
      return;
    }

    if (message?.type === "result" && pendingWorkerRun && message.id === pendingWorkerRun.id) {
      clearTimeout(pendingWorkerRun.timer);
      const resolve = pendingWorkerRun.resolve;
      pendingWorkerRun = null;
      workerReady = true;
      setRuntime("ready", pick("Real Python is ready", "A valódi Python készen áll"));
      const payload = message.payload;
      for (const [english, hungarian] of Object.entries(payload.translations || {})) window.PipI18n.register(english, hungarian);
      for (const result of [...(payload.results || []), payload.partialResult].filter(Boolean)) {
        result.copyLocale = payload.locale || LOCALE;
        result.outputLocale = payload.locale || LOCALE;
        translateResultCopy(result);
      }
      if (payload.error?.message) payload.error.message = window.PipI18n.translateCopy(payload.error.message, payload.locale || LOCALE, LOCALE);
      resolve(payload);
    }
  });

  function failRuntime() {
    if (worker !== instance) return;
    clearTimeout(startupTimer);
    instance.terminate();
    workerReady = false;
    setRuntime("error", pick("Python failed to load", "A Python betöltése sikertelen"));
    dom.runButton.disabled = true;
    if (pendingWorkerRun) {
      clearTimeout(pendingWorkerRun.timer);
      pendingWorkerRun.reject(new Error(pick(
        "Python could not load. Check your internet connection and refresh.",
        "A Python nem tudott betöltődni. Ellenőrizd az internetkapcsolatot, majd frissítsd az oldalt."
      )));
      pendingWorkerRun = null;
    }
    setSummary(
      "error",
      pick("Real Python could not load", "A valódi Python nem tudott betöltődni"),
      pick(
        "Check your internet connection, then refresh this page.",
        "Ellenőrizd az internetkapcsolatot, majd frissítsd az oldalt."
      )
    );
  }
  worker.addEventListener("error", failRuntime);
}

function executePython(code, scenarios) {
  return new Promise((resolve, reject) => {
    const id = ++runSequence;
    const timer = setTimeout(() => {
      if (!pendingWorkerRun || pendingWorkerRun.id !== id) return;
      pendingWorkerRun = null;
      reject(new Error(pick(
        "Your program took too long, so Koja stopped it safely.",
        "A programod túl sokáig futott, ezért Koja biztonságosan leállította."
      )));
      startWorker();
    }, 5500);

    pendingWorkerRun = { id, resolve, reject, timer };
    worker.postMessage({
      type: "run",
      id,
      code,
      locale: LOCALE,
      scenarios,
    });
  });
}

async function runCurrentCode() {
  if (activeMode !== "write" || running || !workerReady) return;

  const level = LEVELS[0];
  const code = getCode();
  if (!code.trim()) {
    setSummary(
      "try",
      pick("The file is empty", "A fájl üres"),
      pick(
        "Koja is waiting for instructions. Add a command or choose a code tool above.",
        "Koja utasításokra vár. Adj hozzá egy parancsot, vagy válassz egy kódeszközt fent."
      )
    );
    return;
  }

  dom.nextButton.hidden = true;
  drafts[level.id] = code;
  saveProgress();
  clearEditorMarks();
  lastResults = [];
  resultStates = ["running"];
  setRunningUi(true);
  setRuntime("running", pick("Python is running...", "A Python fut…"));
  setConsoleRunning();
  setSummary("", "", "");

  const runToken = ++runSequence;
  let payload;

  try {
    payload = await executePython(code, level.scenarios);
    if (nativeMapHolds) await wait(0);
  } catch (error) {
    if (nativeMapHolds) await wait(0);
    if (runToken !== runSequence - 1) return;
    setRunningUi(false);
    setRuntime(
      workerReady ? "ready" : "loading",
      workerReady
        ? pick("Real Python is ready", "A valódi Python készen áll")
        : pick("Restarting Python...", "A Python újraindítása…")
    );
    setSummary(
      "error",
      pick("Koja stopped safely", "Koja biztonságosan megállt"),
      error.message
    );

    setConsoleStopped(error.message);
    return;
  }

  if (!running || runToken !== runSequence - 1) return;

  if (!payload.ok) {
    if (payload.partialResult?.events?.length) {
      await animateScenario(payload.partialResult, level.scenarios[0]);
      if (!running || runToken !== runSequence - 1) return;
    }
    setRunningUi(false);
    showPythonError(payload.error, payload.output || []);
    return;
  }

  lastResults = payload.results;
  resultStates = [
    Boolean(payload.results[0]?.state?.goal_reached) ? "pass" : "fail",
  ];
  await animateScenario(lastResults[0], level.scenarios[0]);

  if (!running || runToken !== runSequence - 1) return;

  if (resultStates[0] === "pass") {
    recordWritePracticeCompletion(level);
    saveProgress();
    renderCampaign();
    setSummary("success", pick(`Round ${currentRound} solved!`, `${currentRound}. pálya teljesítve!`), "");
    dom.nextButton.hidden = false;
    dom.nextButton.textContent = pick(
      "Next random level \u2192",
      "Következő véletlen pálya \u2192"
    );
  } else {
    setSummary(
      "try",
      pick("Koja has not reached the star yet", "Koja még nem érte el a csillagot"),
      pick(
        "Try again.",
        "Próbáld újra."
      )
    );
  }

  setRunningUi(false);
}

function stopCurrentRun() {
  if (!running) return;
  const wasReplay = replaying;
  replaying = false;
  animationSequence += 1;
  runSequence += 1;

  if (pendingWorkerRun) {
    clearTimeout(pendingWorkerRun.timer);
    pendingWorkerRun.reject(new Error(pick("Stopped", "Leállítva")));
    pendingWorkerRun = null;
    startWorker();
  }

  setRunningUi(false);
  setEditorReadOnly(false);
  clearEditorMarks();
  if (activeMode === "read") {
    resetReadTrace(false);
    dom.traceFeedback.textContent = pick(
      "Challenge stopped. Start again when you are ready.",
      "A feladat leállt. Indítsd újra, amikor készen állsz."
    );
    setConsoleStopped(pick(
      "Challenge stopped while Python was preparing it.",
      "A feladat leállt, miközben a Python előkészítette."
    ));
    return;
  }
  if (wasReplay) {

    setConsoleStopped();
    return;
  }
  setSummary(
    "try",
    pick("Run stopped", "A futás leállt"),
    pick(
      "Your code is unchanged. Edit it or run it again.",
      "A kódod változatlan maradt. Szerkeszd vagy futtasd újra."
    )
  );

  setConsoleStopped();
}

function resetCurrentCode() {
  if (activeMode === "read") {
    clearReadPrediction(true);
    return;
  }
  const level = LEVELS[0];
  const changed = Boolean(getCode());
  if (changed && !window.confirm(pick(
    "Clear all code from the editor?",
    "Törlöd az összes kódot a szerkesztőből?"
  ))) return;

  delete drafts[level.id];
  saveProgress();
  setCode("");
  lastResults = [];
  resultStates = level.scenarios.map(() => "idle");
  renderBoard(level.scenarios[0]);
  resetConsole();
  clearEditorMarks();
  dom.nextButton.hidden = true;
  setSummary("", "", "");

  showToast(pick("Code cleared", "A kód törölve"));
}

function loadLevel() {
  animationSequence += 1;
  if (running) stopCurrentRun();

  const level = LEVELS[0];
  readSessionToken += 1;
  readTrace = newReadTraceState();
  setReadControls(false);
  updateModeChrome();
  applyGeneratedWorld(level);

  lastResults = [];
  resultStates = ["idle"];
  dom.missionTitle.textContent = level.title;
  dom.fileName.textContent = level.fileName;
  dom.worldEyebrow.textContent = pick("Current random world", "Véletlen pálya");
  dom.worldTitle.textContent = pick(`Round ${currentRound}`, `${currentRound}. pálya`);
  dom.runButton.innerHTML = pick(
    '<span aria-hidden="true">&#9654;</span> Run Python',
    '<span aria-hidden="true">&#9654;</span> Kód futtatása'
  );
  dom.nextButton.hidden = true;
  dom.replayButton.disabled = true;

  setCode(drafts[level.id] ?? level.starterCode);
  setEditorReadOnly(false);
  clearEditorMarks();
  renderCampaign();
  renderBoard(level.scenarios[0]);
  resetConsole();
  setSummary("", "", "");

  if (monacoEditor) monacoEditor.focus();
}

window.PipPythonEditor.setNativeTools(() => ({ locale: LOCALE, tools: WRITE_CODE_TOOLS }));
window.PipNativeCodeFit = window.PipCodeFit?.attach({
  host: dom.editorWrap, textarea: dom.textarea, getEditor: () => monacoEditor, getCode,
});

async function loadMonaco() {
  const isSmallTouchDevice = matchMedia("(pointer: coarse)").matches && innerWidth < 900;
  if (isSmallTouchDevice) {
    dom.editorWrap.classList.add("fallback-ready");
    return;
  }

  try {
    monacoApi = await window.PipEditorLoader.load();
    window.PipPythonEditor.defineTheme(monacoApi);

    monacoEditor = monacoApi.editor.create(dom.editorHost, window.PipPythonEditor.options(LOCALE, {
      // Own models explicitly: Monaco disposes an implicit value-based model
      // when setModel() detaches it, which would erase the other mode's session.
      model: monacoApi.editor.createModel(dom.textarea.value, "python"),
    }));
    window.PipPythonEditor.registerMonaco(monacoApi);
    window.PipNativeCodeFit?.refresh();

    monacoEditor.onDidChangeModelContent(onCodeChanged);
    setEditorReadOnly(false);
    dom.editorHost.setAttribute("aria-hidden", "false");
    dom.editorWrap.classList.remove("fallback-ready");
    dom.editorWrap.classList.add("monaco-ready");
    if (activeMode === "read" && readTrace.mismatch?.line) {
      markReadReviewLine(readTrace.mismatch.line);
    } else if (activeMode === "read" && readTrace.error) {
      markEditorError(readTrace.error);
    }
  } catch {
    dom.editorWrap.classList.add("fallback-ready");
    showToast(pick("Using the lightweight editor", "Az egyszerűsített szerkesztő használata"));
  }
}

function runPrimaryAction() {
  if (activeMode === "read") {
    if (readTrace.phase === "complete") {
      advanceReadTutorial();
      return;
    }
    startReadTrace();
  } else runCurrentCode();
}

function resetPrimaryAction() {
  if (activeMode === "read") clearReadPrediction(true);
  else resetCurrentCode();
}

dom.textarea.addEventListener("input", onCodeChanged);
dom.textarea.addEventListener("keydown", (event) => {
  if (activeMode === "read") return;
  if (event.key === "Tab") {
    event.preventDefault();
    const start = dom.textarea.selectionStart;
    const end = dom.textarea.selectionEnd;
    dom.textarea.setRangeText("    ", start, end, "end");
    onCodeChanged();
  }
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runPrimaryAction();
});
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.isComposing || document.querySelector('dialog[open]')) return;
  if (nativeMapHolds || document.querySelector('#course-map-dialog')?.open || globalThis.PipWelcomePending
    || globalThis.PipTutorial?.isActive() || globalThis.PipLearningStage?.isBlocks()) return;
  if (["Enter", " "].includes(event.key) && event.target?.closest?.(".course-map-entry")) return;
  const plainKey = !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && !event.shiftKey
    && !event.isComposing;

  // A fresh Enter continues completed practice. Keep explicit navigation and
  // editing keys with their controls; the Run/Check buttons share this shortcut.
  if (plainKey && event.key === "Enter" && !running) {
    const readComplete = activeMode === "read" && readTrace.phase === "complete";
    const writeComplete = activeMode === "write" && resultStates[0] === "pass" && !dom.nextButton.hidden;
    const control = event.target?.closest?.("button, a, summary, input, select, [role=button]");
    const ownsControl = !control || [dom.runButton, dom.nextButton, dom.traceEvaluate].includes(control);
    const writing = activeMode === "write" && event.target?.closest?.("textarea, input, select, [contenteditable=true], .monaco-editor");
    if (event.repeat && control && ownsControl && !writing) {
      event.preventDefault();
      return;
    }
    if ((readComplete || writeComplete) && ownsControl && !writing) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.repeat) {
        if (readComplete) advanceReadTutorial();
        else advanceToNextRound();
      }
      return;
    }
  }

  // Route keys belong to the active Read Code challenge, not to whichever
  // panel happened to be clicked most recently. This keeps prediction input
  // working after inspecting the board, code, or surrounding instructions.
  if (activeMode === "read" && readTrace.phase === "predicting" && plainKey) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) evaluateReadPrediction();
      return;
    }
    const action = READ_KEY_ACTIONS[event.key];
    if (action) {
      event.preventDefault();
      if (!event.repeat) recordReadAction(action);
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      if (!event.repeat) undoReadAction();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      return;
    }
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    const canRunRead = ["idle", "error", "complete"].includes(readTrace.phase);
    if (activeMode === "write" || canRunRead) {
      event.preventDefault();
      runPrimaryAction();
    }
  }
}, { capture: true });

dom.runButton.addEventListener("click", runPrimaryAction);
dom.stopButton.addEventListener("click", stopCurrentRun);
dom.resetButton.addEventListener("click", resetPrimaryAction);
dom.codeToolList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-code-tool]");
  if (!button || button.disabled) return;
  if (insertCodeTool(button.dataset.codeTool)) document.querySelector("#code-tools-disclosure").open = false;
});
dom.readModeButton.addEventListener("click", () => switchActivityMode("read"));
dom.writeModeButton.addEventListener("click", () => switchActivityMode("write"));
dom.traceButtons.forEach((button) => {
  button.addEventListener("click", () => recordReadAction(button.dataset.traceAction));
});
dom.traceUndo.addEventListener("click", undoReadAction);
dom.traceClear.addEventListener("click", () => clearReadPrediction(true));
dom.traceEvaluate.addEventListener("click", evaluateReadPrediction);
dom.readDifficulty.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-difficulty]");
  if (!button || button.disabled) return;
  changeReadDifficulty(button.dataset.difficulty);
});
dom.campaignNav.addEventListener("click", (event) => {
  const button = event.target.closest("#write-difficulty button[data-difficulty]");
  if (!button || button.disabled) return;
  changeWriteDifficulty(button.dataset.difficulty);
});
dom.nextButton.addEventListener("click", advanceToNextRound);
dom.newBoardButton.addEventListener("click", () => {
  if (activeMode === "read") generateNewReadChallenge(true);
  else generateNewBoard(true);
});
dom.resetBoardButton.addEventListener("click", resetBoardToStart);
dom.replayButton.addEventListener("click", async () => {
  const level = LEVELS[0];
  const result = lastResults[0];
  if (activeMode !== "write" || !result || running) return;

  replaying = true;
  setRunningUi(true);
  try {
    await animateScenario(result, level.scenarios[0], { replay: true });
  } finally {
    if (replaying) {
      replaying = false;
      setRunningUi(false);
    }
  }
});
window.addEventListener("resize", () => {
  const scenario = activeMode === "read"
    ? READ_LEVEL.scenarios[0]
    : LEVELS[0].scenarios[0];
  const state = currentRobotState || scenario.start;
  placeRobot(state.row, state.column, state.direction, true);
});

// Flush the current draft synchronously before a tab close,
// or mobile backgrounding can cancel the normal 250 ms debounce.
window.addEventListener("pagehide", () => {
  clearTimeout(saveTimer);
  if (activeMode === "write") drafts[LEVELS[0].id] = getCode();
  saveProgress();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden") return;
  clearTimeout(saveTimer);
  if (activeMode === "write") drafts[LEVELS[0].id] = getCode();
  saveProgress();
});

function replaceTranslatedCode(translation) {
  if (!translation.edits.length) return;
  const { mapOffset } = window.PipCodeTranslation;
  const scroll = [dom.textarea.scrollTop, dom.textarea.scrollLeft];
  const selection = [dom.textarea.selectionStart, dom.textarea.selectionEnd].map((offset) => mapOffset(offset, translation.edits));
  const wasReadOnly = monacoEditor?.getOption(monacoApi.editor.EditorOption.readOnly);
  suppressEditorChanges = true;
  try {
    if (monacoEditor) {
      const model = monacoEditor.getModel(), view = monacoEditor.saveViewState();
      const selections = monacoEditor.getSelections().map((range) => ({
        anchor: mapOffset(model.getOffsetAt(range.getSelectionStart()), translation.edits),
        active: mapOffset(model.getOffsetAt(range.getPosition()), translation.edits),
      }));
      const edits = translation.edits.map((edit) => {
        const start = model.getPositionAt(edit.start), end = model.getPositionAt(edit.end);
        return { range: new monacoApi.Range(start.lineNumber, start.column, end.lineNumber, end.column), text: edit.text };
      });
      monacoEditor.updateOptions({ readOnly: false });
      monacoEditor.pushUndoStop();
      monacoEditor.executeEdits("pip-language", edits);
      monacoEditor.pushUndoStop();
      monacoEditor.restoreViewState(view);
      monacoEditor.setSelections(selections.map(({ anchor, active }) => {
        const a = model.getPositionAt(anchor), b = model.getPositionAt(active);
        return new monacoApi.Selection(a.lineNumber, a.column, b.lineNumber, b.column);
      }));
    }
    dom.textarea.value = translation.code;
    dom.textarea.setSelectionRange(...selection);
    [dom.textarea.scrollTop, dom.textarea.scrollLeft] = scroll;
  } finally {
    if (monacoEditor) monacoEditor.updateOptions({ readOnly: wasReadOnly });
    suppressEditorChanges = false;
  }
}

function translateResultCopy(result) {
  if (!result || !result.copyLocale || result.copyLocale === LOCALE) return;
  if (result.error?.message) {
    result.error.message = window.PipI18n.translateCopy(result.error.message, result.copyLocale, LOCALE);
  }
  result.copyLocale = LOCALE;
}

function translateReadOutput(result) {
  if (!result || !result.outputLocale || result.outputLocale === LOCALE) return;
  // This is the generated, not-yet-displayed Read answer, not a child's console log.
  result.output = (result.output || []).map((chunk) =>
    window.PipI18n.translateCopy(chunk, result.outputLocale, LOCALE));
  result.outputLocale = LOCALE;
}

function refreshLanguagePresentation(from) {
  for (const result of new Set([...lastResults, readTrace.result])) translateResultCopy(result);
  if (activeMode === "read") translateReadOutput(readTrace.result);
  const codeToolsScroll = dom.codeToolList.scrollLeft;
  window.PipI18n.translateTree(dom.appShell, from, LOCALE);
  window.PipI18n.translateTree(document.querySelector("footer"), from, LOCALE);
  renderCodeTools();
  dom.codeToolList.scrollLeft = codeToolsScroll;
  updateModeChrome();
  renderCampaign();
  if (activeMode === "read") {
    dom.missionTitle.textContent = pick("Read code", "Kódolvasás");
    dom.fileName.textContent = READ_LEVEL.fileName;
    dom.worldTitle.textContent = pick("Read code", "Kódolvasás");
    dom.worldEyebrow.textContent = pick(
      "Read code · Level " + (READ_LEVEL.difficultyIndex + 1) + " of " + READ_DIFFICULTIES.length,
      "Kódolvasás · " + (READ_LEVEL.difficultyIndex + 1) + ". szint / " + READ_DIFFICULTIES.length
    );
    updateReadPredictionUi(true);
    if (readTrace.mismatch) renderReadMismatchFeedback(readTrace.mismatch);
  } else {
    dom.missionTitle.textContent = LEVELS[0].title;
    dom.worldTitle.textContent = pick(`Round ${currentRound}`, `${currentRound}. pálya`);
  }
  for (const button of dom.traceButtons) button.querySelector("code").textContent = actionCode(button.dataset.traceAction);
  if (["idle", "running"].includes(dom.consolePanel.dataset.state)) {
    dom.consoleOutput.textContent = window.PipI18n.translateCopy(dom.consoleOutput.textContent, from, LOCALE);
  } else if (dom.consolePanel.dataset.state === "output") {
    const count = outputLineCount(dom.consoleOutput.textContent);
    dom.consoleCount.textContent = pick(count + (count === 1 ? " line" : " lines"), count + " sor");
  }
  monacoEditor?.updateOptions({
    contextmenu: !IS_HUNGARIAN,
    placeholder: dom.textarea.placeholder,
  });
}

function switchLanguage(next) {
  if (!["en", "hu"].includes(next) || next === LOCALE) return false;
  const from = LOCALE;
  const translate = (code, sourceLocale = from) => window.PipCodeTranslation.translate(code, sourceLocale, next);
  let editor, readCode, translatedDrafts;
  try {
    // Preflight every draft before touching the live session.
    editor = translate(getCode());
    readCode = translate(READ_LEVEL.starterCode);
    translatedDrafts = Object.fromEntries(Object.entries(drafts).map(([key, code]) => [key, translate(code).code]));
    for (const [mode, session] of modeSessions) {
      if (mode !== activeMode) translate(session.code, session.locale);
    }
  } catch {
    showToast(pick(
      "Language unchanged: rename your variable that shares a translated Koja command name.",
      "A nyelv nem változott: nevezd át azt a változódat, amelynek neve egy lefordított Koja-parancséval egyezik."
    ));
    return false;
  }
  const viewport = { top: window.scrollY, left: window.scrollX, behavior: "instant" };
  clearTimeout(saveTimer);
  if (activeMode === "write") {
    drafts[LEVELS[0].id] = getCode();
    translatedDrafts[LEVELS[0].id] = editor.code;
  }
  saveProgress();
  LOCALE = next;
  IS_HUNGARIAN = next === "hu";
  APP_LOCALE = APP_LOCALES[next];
  STORAGE_KEY = APP_LOCALE.storageKey;
  window.PipLocale = next;
  window.PipWorldGenerator = window.PipWorldGeneratorLocales[next];
  window.PipReadTutorial = window.PipReadTutorialLocales[next];
  const config = localizedConfig();
  ({ READ_DIFFICULTIES, WRITE_DIFFICULTIES, WRITE_CODE_TOOLS } = config);
  LEVELS[0].title = config.LEVELS[0].title;
  READ_LEVEL.fileName = config.READ_LEVEL.fileName;
  READ_LEVEL.starterCode = readCode.code;
  Object.assign(drafts, translatedDrafts);
  replaceTranslatedCode(editor);
  refreshLanguagePresentation(from);
  window.PipI18n.finishLanguageSwitch(next);
  saveProgress();
  window.scrollTo(viewport);
  return true;
}
window.PipSetLanguage = switchLanguage;

renderCodeTools();
updateModeChrome();
if (activeMode === "read") loadReadLevel();
else loadLevel();
if (initialNavigation.handoffApplied) saveProgress();
dom.editorWrap.classList.add("fallback-ready");
if (Number.isFinite(window.PipScrollHandoff)) {
  // Layout exists now; restore the viewport before the new page is painted.
  window.scrollTo({ top: window.PipScrollHandoff, left: 0, behavior: "instant" });
  window.PipScrollHandoff = null;
}
const startBackgroundRuntime = () => {
  startWorker();
  void loadMonaco();
};
// The map is useful before its optional editor/interpreter downloads finish.
if (window.PipAfterWelcomePaint) window.PipAfterWelcomePaint(startBackgroundRuntime);
else startBackgroundRuntime();

// Stage changes stop animation without changing the saved Python session.
window.PipSuspendNative = () => { if (running) stopCurrentRun(); };

// Deliberate map navigation reuses the existing mode sessions and confirmations.
// Looking at the map only uses pauseForMap; it never calls this navigation path.
function confirmNativeMapPractice(mode, difficulty) {
  if (!['read', 'write'].includes(mode)) return false;
  const choices = mode === 'read' ? READ_DIFFICULTY_IDS : WRITE_DIFFICULTY_IDS;
  if (!choices.has(difficulty)) return false;
  const matches = mode === 'read' ? readDifficulty === difficulty : writeDifficultyForRound() === difficulty;
  if (mode === activeMode && matches) return true;

  // An unfinished reading route is also a draft. Only an explicit difficulty
  // replacement asks to discard it; opening its existing practice keeps it.
  const readSession = activeMode === 'read' ? null : modeSessions.get('read');
  const readCode = activeMode === 'read' ? getCode() : readSession?.code;
  const readGuesses = activeMode === 'read' ? readTrace.guesses : readSession?.readTrace.guesses;
  if (mode === 'read' && !matches && (readGuesses?.length || readCode && readCode !== READ_LEVEL.starterCode)
    && !window.confirm(pick('Start a different reading level? Your current route will be replaced.', 'Másik kódolvasási szintet kezdesz? A mostani útvonalad lecserélődik.'))) return false;

  // Ask before stopping either mode's playback or switching its editor model.
  // Cancelling the map choice therefore resumes the exact session behind it.
  if (mode === 'write' && !matches) {
    const choice = WRITE_DIFFICULTIES.find(item => item.id === difficulty);
    const writeCode = activeMode === 'write' ? getCode() : modeSessions.get('write')?.code ?? drafts[LEVELS[0].id] ?? LEVELS[0].starterCode;
    if (writeCode !== LEVELS[0].starterCode && !window.confirm(pick(
      `Start ${choice.label} Write Code? Your code and current board will be replaced.`,
      `Átváltasz erre a kódírási nehézségre: ${choice.label}? A kódod és a jelenlegi pálya lecserélődik.`
    ))) return false;
  }
  return true;
}
function openNativeMapPractice(mode, difficulty, { confirmed = false } = {}) {
  if (!['read', 'write'].includes(mode)) return false;
  if (!(mode === 'read' ? READ_DIFFICULTY_IDS : WRITE_DIFFICULTY_IDS).has(difficulty)) return false;
  if (!confirmed && !confirmNativeMapPractice(mode, difficulty)) return false;
  const matches = mode === 'read' ? readDifficulty === difficulty : writeDifficultyForRound() === difficulty;
  if (mode === activeMode && matches) return true;
  const previousMode = activeMode;
  if (running) stopCurrentRun();
  const opened = window.PipStartCoursePractice(mode, difficulty, { confirmed: true });
  if (!opened && activeMode !== previousMode) switchActivityMode(previousMode);
  return opened;
}
window.PipNativeNavigation = Object.freeze({
  snapshot: () => ({ mode: activeMode, readDifficulty, writeDifficulty: writeDifficultyForRound(),
    running, readPhase: readTrace.phase, routeCount: readTrace.guesses.length }),
  confirmPractice: confirmNativeMapPractice,
  openPractice: openNativeMapPractice,
  pauseForMap: pauseNativeForMap,
});
