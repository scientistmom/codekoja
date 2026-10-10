// Evidence of completed practice and directional transfer. Wallets and lesson
// checkpoints stay with their existing owners; this ledger never grants coins.
(function (global) {
  "use strict";
  const KEY = "pip-python-lab.learning-progress.v1";
  const VERSION = 1, ASSESSMENT_VERSION = 1;
  const practiceTiers = {
    "python:read": ["actions", "for", "if", "while", "mixed"],
    "python:write": ["easy", "medium", "hard", "mastery"],
    "blocks:read": ["commands", "loops", "choices", "while"],
    "blocks:write": ["easy", "medium", "hard", "mastery"],
    "shared:hybrid": ["commands", "loops", "choices", "while"],
  };
  const topics = new Set(["commands", "for", "if", "while", "nested-for"]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const validId = value => typeof value === "string" && value.length > 0
    && value.length <= 2048 && value.trim() === value && !/[\u0000-\u001f]/.test(value);
  const validVersion = value => Number.isSafeInteger(value) && value > 0 && value <= 1000000;
  function practiceRecord(value) {
    if (!value || !practiceTiers[value.track + ":" + value.kind]?.includes(value.difficulty)
      || !validId(value.taskId) || value.generatorVersion !== undefined && !validVersion(value.generatorVersion)) return null;
    return { track: value.track, kind: value.kind, difficulty: value.difficulty, taskId: value.taskId,
      ...(value.generatorVersion === undefined ? {} : { generatorVersion: value.generatorVersion }) };
  }
  function bridgeRecord(value) {
    if (!value || !["blocks", "python"].includes(value.from) || !["blocks", "python"].includes(value.to)
      || value.from === value.to || !topics.has(value.topic) || !validId(value.taskId)
      || value.assessmentVersion !== ASSESSMENT_VERSION) return null;
    return { from: value.from, to: value.to, topic: value.topic, taskId: value.taskId,
      assessmentVersion: value.assessmentVersion };
  }
  function records(values, validate) {
    const unique = new Map();
    for (const value of Array.isArray(values) ? values : []) {
      const record = validate(value);
      if (record) unique.set(JSON.stringify(record), record);
    }
    return [...unique.values()];
  }
  function restore(raw) {
    return { version: VERSION,
      practices: raw?.version === VERSION ? records(raw.practices, practiceRecord) : [],
      bridges: raw?.version === VERSION ? records(raw.bridges, bridgeRecord) : [] };
  }
  function read() {
    try { return restore(JSON.parse(global.localStorage?.getItem(KEY) || "null")); }
    catch { return restore(null); }
  }
  let state = read();
  function record(group, value, validate) {
    if (global.PipResetInProgress) return false;
    const entry = validate(value);
    if (!entry) return false;
    // Read the latest stored data before committing so another tab's completed
    // work is retained, and an externally cleared save is not resurrected.
    const next = read(), identity = JSON.stringify(entry);
    if (next[group].some(item => JSON.stringify(item) === identity)) { state = next; return true; }
    next[group].push(entry);
    try {
      if (!global.localStorage) return false;
      global.localStorage.setItem(KEY, JSON.stringify(next));
    } catch { return false; }
    state = next;
    if (typeof global.CustomEvent === "function" && typeof global.dispatchEvent === "function") {
      global.dispatchEvent(new global.CustomEvent("pip-learning-progress-change"));
    }
    return true;
  }
  global.addEventListener?.("storage", event => {
    if (event.key === KEY || event.key === null) state = read();
  });
  global.PipLearningProgress = Object.freeze({
    ASSESSMENT_VERSION,
    snapshot: () => clone(state),
    recordPractice: value => record("practices", value, practiceRecord),
    practiceCompleted: (track, kind, difficulty) => state.practices.some(item =>
      item.track === track && item.kind === kind && item.difficulty === difficulty),
    recordBridge: value => record("bridges", value, bridgeRecord),
    bridgeCompleted: (from, to, topic) => state.bridges.some(item =>
      item.from === from && item.to === to && item.topic === topic && item.assessmentVersion === ASSESSMENT_VERSION),
  });
})(typeof window !== "undefined" ? window : globalThis);
