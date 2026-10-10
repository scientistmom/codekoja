// Shared course mechanics. All authored content lives in lessons/*.js.
(function (global) {
  "use strict";
  const chapters = global.PipLessonRegistry.ordered(global.PipCourseManifest).map(definition => {
    const stages = definition.stages.map(stage => ({
      ...stage,
      program: Array.isArray(stage.program) ? stage.program.join("\n") : stage.program,
      ...(stage.solutions ? { solutions: stage.solutions.map(code => Array.isArray(code) ? code.join("\n") : code) } : {}),
    }));
    return { ...definition, stages };
  });
  const actions = ["forward", "left", "right"], directions = ["up", "right", "down", "left"];
  const names = { en: { forward: "forward", left: "left", right: "right" }, hu: { forward: "előre", left: "balra", right: "jobbra" } };
  function command(action, locale) { return `${names[locale === "hu" ? "hu" : "en"][action]}()`; }
  function simulate(route, scenario) {
    let state = { ...scenario.start };
    return route.map((action) => {
      if (!actions.includes(action)) throw new Error("Unknown tutorial action");
      const before = { ...state };
      let blocked = false;
      const direction = directions.indexOf(state.direction);
      if (action !== "forward") {
        state.direction = directions[(direction + (action === "right" ? 1 : 3)) % 4];
      } else {
        const [dr, dc] = [[-1, 0], [0, 1], [1, 0], [0, -1]][direction];
        const row = state.row + dr, column = state.column + dc;
        blocked = row < 0 || row >= scenario.height || column < 0 || column >= scenario.width
          || scenario.obstacles.some(([r, c]) => r === row && c === column);
        if (!blocked) state = { ...state, row, column };
      }
      return { action, before, after: { ...state }, blocked };
    });
  }
  function compare(expected, entered) {
    for (let index = 0; index < Math.max(expected.length, entered.length); index++) {
      if (expected[index] !== entered[index]) return index;
    }
    return -1;
  }
  // Keep the historic storage order, independent from the lesson's display order.
  const storageOrder = ["watch", "predict", "complete", "create"];
  // Migration metadata for checkpoints written before stable stage IDs existed.
  const legacyChapterIds = ["commands", "for", "if", "while", "functions", "variables", "parameters", "directions", "boolean", "nested-for", "loop-choices", "break", "nested-while", "mixed"];
  const stages = chapters.flatMap((chapter, chapterIndex) => storageOrder.map(kind => ({
    ...chapter.stages.find(stage => stage.kind === kind), kind, id: chapter.id + "-" + kind, chapter: chapterIndex,
  })));
  function source(stage, locale) {
    return global.PipCodeTranslation.translate(stage.program, "en", locale, stage.commentTranslations || []).code;
  }
  function restore(raw, locale) {
    const fresh = { index: 0, drafts: {}, routes: {}, guesses: [], completed: [] };
    const legacy = raw?.version === 1 && raw.lesson === "commands";
    if (!legacy && !(raw?.version === 2 && raw.lesson === "campaign")) return fresh;
    if (Number.isInteger(raw.index) && raw.index >= 0 && raw.index < (legacy ? 4 : stages.length)) fresh.index = raw.index;
    if (typeof raw.stageId === "string") {
      const index = stages.findIndex(stage => stage.id === raw.stageId);
      fresh.index = index >= 0 ? index : 0;
    } else if (Number.isInteger(raw.index) && raw.index >= 0) {
      const chapterId = legacy ? "commands" : legacyChapterIds[Math.floor(raw.index / storageOrder.length)];
      const kind = storageOrder[raw.index % storageOrder.length];
      const index = stages.findIndex(stage => stage.id === chapterId + "-" + kind);
      fresh.index = index >= 0 ? index : 0;
    }
    const oldId = stage => legacy ? stage.kind : stage.id;
    const savedCompleted = new Set(Array.isArray(raw.completed) ? raw.completed : []);
    for (const stage of stages) {
      if (legacy && chapters[stage.chapter].id !== "commands") continue;
      if (savedCompleted.has(oldId(stage))) fresh.completed.push(stage.id);
      if (stage.kind === "predict") {
        const route = legacy ? raw.guesses : raw.routes?.[stage.id];
        if (Array.isArray(route)) fresh.routes[stage.id] = route.filter(action => actions.includes(action));
      }
      const code = raw.drafts?.[oldId(stage)];
      if (!stage.editable || typeof code !== "string") continue;
      try { fresh.drafts[stage.id] = global.PipCodeTranslation.translate(code, raw.locale === "hu" ? "hu" : "en", locale, stage.commentTranslations || []).code; }
      catch { fresh.drafts[stage.id] = code; } // A naming conflict must never erase a draft.
    }
    fresh.guesses = fresh.routes[stages[fresh.index].id] || [];
    return fresh;
  }
  const snippets = {
    "for": "for step in range(count):\n    pass",
    "if": "if condition:\n    pass",
    "while": "while condition:\n    pass",
    "def": "def my_function():\n    pass",
    "call": "my_function()",
    "whats": "whats(\"ahead\")",
    "variable": "value = 0",
    "update": "value += 1",
    "print": "print(message)",
    "parameter": "def my_function(value):\n    pass",
    "return": "return value",
    "elif": "elif condition:\n    pass",
    "else": "else:\n    pass",
    "in": "value in (first, second)",
    "and": "condition and other_condition",
    "or": "condition or other_condition",
    "not": "not condition",
    "nested": "for outer in range(count):\n    for inner in range(other_count):\n        pass",
    "flag": "running = True",
    "break": "break"
  };
  const toolLabels = { variable: "=", update: "+=", call: "name()", parameter: "def (…)", nested: "for + for", flag: "True / False" };
  function tools(chapter, locale) {
    const available = [...new Set(chapters.slice(0, chapter + 1).flatMap(item => item.tools))];
    return available.map(name => ({
      name, code: global.PipCodeTranslation.translate(snippets[name], "en", locale).code,
      label: toolLabels[name] || (name === "whats" ? (locale === "hu" ? 'mit_lát(…)' : 'whats(…)' ) : name),
    }));
  }

  // Coins are tutorial objectives, not a fifth sensor tile or a new Python command.
  function collectCoins(stage, events) {
    const available = new Set((stage.scenario.coins || []).map(p => p.join(",")));
    const found = new Set();
    for (const event of events) {
      if (event.type !== "forward" && !(event.action === "forward" && !event.blocked)) continue;
      const point = event.after || event, key = point.row + "," + point.column;
      if (available.has(key)) found.add(key);
    }
    return [...found];
  }
  function restoreWallet(raw) {
    const wallet = {};
    for (const stage of stages.filter(s => s.kind !== "watch")) {
      // Earlier lesson revisions may have moved a coin. Keep banked rewards
      // without turning historical squares into current objectives.
      const allowed = new Set([...(stage.scenario.coins || []), ...(stage.legacyCoins || [])].map(p => p.join(",")));
      if (Array.isArray(raw?.[stage.id])) wallet[stage.id] = [...new Set(raw[stage.id].filter(key => allowed.has(key)))];
    }
    return wallet;
  }
  global.PipTutorialCampaign = Object.freeze({ actions, directions, command, simulate, compare,
    chapters, stages, source, restore, tools, legacyChapterIds, collectCoins, restoreWallet });
})(window);
