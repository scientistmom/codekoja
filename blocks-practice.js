// Practice tasks are direct counterparts of the existing Python generators.
(function (global) {
  "use strict";

  const VERSION = 3;
  const engine = global.PipBlocksScope;
  if (!engine) throw new Error("Blocks practice needs PipBlocksScope.");
  const directions = ["up", "right", "down", "left"];
  const deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const F = "FORWARD", L = "TURN_LEFT", R = "TURN_RIGHT", E = "END";
  const freezeChoices = items => Object.freeze(items.map(item => Object.freeze({ ...item, label: Object.freeze(item.label) })));
  const difficulties = freezeChoices([
    { id: "commands", label: { en: "Commands", hu: "Parancsok" } },
    { id: "loops", label: { en: "Repeats", hu: "Ismétlések" } },
    { id: "choices", label: { en: "Choices", hu: "Feltételek" } },
    { id: "while", label: { en: "While", hu: "While" } },
  ]);
  const buildDifficulties = freezeChoices([
    { id: "easy", round: 1, label: { en: "Easy", hu: "Könnyű" } },
    { id: "medium", round: 3, label: { en: "Medium", hu: "Közepes" } },
    { id: "hard", round: 5, label: { en: "Hard", hu: "Nehéz" } },
    { id: "mastery", round: 7, label: { en: "Mastery", hu: "Mesterfok" } },
  ]);
  const additions = [
    [F, L, R], ["FOR_2", "FOR_3", "FOR_4", E],
    ["IF_CLEAR", "IF_WALL", "IF_OBSTACLE", "IF_GOAL", "FOR_7", "FOR_12"],
    ["WHILE_CLEAR", "WHILE_WALL", "WHILE_OBSTACLE", "WHILE_NOT_GOAL"],
  ];
  const readSources = Object.freeze({
    commands: { difficulty: "actions", templates: ["commands-zigzag", "commands-turn-first", "commands-stair-steps", "commands-u-turn", "commands-face-return"] },
    loops: { difficulty: "for", templates: ["for-two-stretches", "for-one-loop-tail", "for-repeated-corner", "for-wide-corner", "for-turn-then-go", "for-two-body-shapes"] },
    choices: { difficulty: "if", templates: ["if-optional-body"] },
    while: { difficulty: "while", templates: ["while-one-corridor", "while-two-corridors"] },
  });
  const difficultiesFor = (mode = "read") => mode === "build" ? buildDifficulties : mode === "read" ? difficulties : [];
  function types(difficulty, mode = "read") {
    const choices = difficultiesFor(mode), index = choices.findIndex(item => item.id === difficulty);
    if (index < 0) return [];
    return additions.slice(0, mode === "build" ? additions.length : index + 1).flat();
  }
  const actionType = action => typeof action === "string" ? action : action?.type;
  const isAction = event => ["forward", "left", "right"].includes(event.type);
  const clone = value => JSON.parse(JSON.stringify(value));

  function randomFor(seed) {
    let state = 2166136261;
    for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  /** Apply one real key action. A blocked forward stays put and is marked. */
  function step(position, action, scenario) {
    const next = { row: position.row, column: position.column, direction: position.direction ?? "right" };
    const type = actionType(action), facing = directions.indexOf(next.direction);
    if (type === "left" || type === "right") {
      next.direction = directions[(facing + (type === "left" ? 3 : 1)) % 4];
    } else if (type === "forward") {
      const [dr, dc] = deltas[facing];
      const row = next.row + dr, column = next.column + dc;
      const blocked = row < 0 || column < 0 || row >= (scenario.height ?? 5) || column >= (scenario.width ?? 5)
        || (scenario.obstacles || []).some(cell => Array.isArray(cell)
          ? cell[0] === row && cell[1] === column : cell.row === row && cell.column === column);
      if (blocked) next.blocked = true;
      else Object.assign(next, { row, column });
    } else next.blocked = true;
    return next;
  }

  /** Retain card indexes and loop frames for an exact route/code comparison. */
  function actions(solution, scenario) {
    return engine.execute(solution, scenario, { maxOperations: 10000, maxEvents: 500 }).events.filter(isAction);
  }

  /** Compare every action, not just the finishing square; turns matter too. */
  function evaluate(expectedEvents, actualActions, scenario) {
    const expected = expectedEvents.filter(isAction);
    let position = { ...scenario.start };
    for (let index = 0; index < Math.max(expected.length, actualActions.length); index += 1) {
      const wanted = expected[index] || null;
      const actual = actionType(actualActions[index]) || null;
      const next = actual == null ? position : step(position, actual, scenario);
      if (!wanted || !actual || wanted.type !== actual || next.blocked
          || next.row !== wanted.row || next.column !== wanted.column || next.direction !== wanted.direction) {
        return {
          ok: false, index, expected: wanted, actual, position: next,
          codeIndex: wanted?.index ?? expected[expected.length - 1]?.index ?? null,
        };
      }
      position = next;
    }
    return { ok: true, index: expected.length, expected: null, actual: null, position, codeIndex: null };
  }

  function verify(solution, scenario, expected, goalRequired) {
    const result = engine.execute(solution, scenario, { maxOperations: 10000, maxEvents: 500 });
    if (!result.ok || result.events.some(event => event.type === "obstacle")
        || !evaluate(result.events, expected, scenario).ok || (goalRequired && !result.state.goal_reached)) {
      throw new Error("The Python task has no faithful Blocks counterpart.");
    }
  }

  function readTask(difficulty, random) {
    const source = readSources[difficulty], reader = global.PipReadTutorialLocales?.en;
    if (!reader?.generateIsolated || !global.PipBlocksPython?.translate) throw new Error("Python Read counterparts are unavailable.");
    const level = reader.generateIsolated(source.difficulty, random, { templateIds: source.templates });
    const translated = global.PipBlocksPython.translate(level.starterCode, { allowPresentation: true });
    if (!translated.ok) throw new Error("Unsupported Python task: " + (translated.reason || translated.error?.code || level.templateId));
    const solution = [...translated.cards], scenario = clone(level.scenarios[0]);
    const available = new Set(types(difficulty, "read"));
    if (scenario.goal !== null || !source.templates.includes(level.templateId)
        || !solution.every(type => available.has(type))) throw new Error("Unsupported Python Read task.");
    verify(solution, scenario, level.previewActions, false);
    return {
      scenario, solution,
      source: { locale: "en", code: level.starterCode, lineMap: translated.lineMap },
    };
  }

  function buildTask(difficulty, random) {
    const generator = global.PipWorldGeneratorLocales?.en;
    if (!generator?.generateRoundWithRandom) throw new Error("Python Write counterparts are unavailable.");
    const round = buildDifficulties.find(item => item.id === difficulty).round;
    const world = generator.generateRoundWithRandom(round, random);
    if (!generator.validateRound(round, world)) throw new Error("The Python Write board failed validation.");
    const translations = { forward: F, left: L, right: R };
    const solution = world.solution.actions.map(action => translations[action]);
    if (solution.some(type => !type)) throw new Error("Unsupported Python Write route action.");
    const scenario = { width: 5, height: 5, ...clone(world.scenario) };
    verify(solution, scenario, world.solution.actions, true);
    return { scenario, solution };
  }

  function generate(seed, difficulty, mode = "read") {
    const choices = difficultiesFor(mode);
    if (!choices.length) throw new RangeError("Unsupported Blocks practice mode: " + mode);
    difficulty ??= choices[0].id;
    const choice = choices.find(item => item.id === difficulty);
    if (!choice) throw new RangeError("No Python counterpart for Blocks difficulty: " + difficulty);
    const random = randomFor(`${VERSION}|${seed}|${difficulty}|${mode}`);
    const task = mode === "read" ? readTask(difficulty, random) : buildTask(difficulty, random);
    const read = mode === "read", label = choice.label;
    return {
      id: `blocks-practice-v${VERSION}-${difficulty}-${mode}-${String(seed)}`,
      title: { en: `${read ? "Read" : "Build"}: ${label.en}`, hu: `${read ? "Olvasás" : "Építés"}: ${label.hu}` },
      ...task,
    };
  }

  global.PipBlocksPractice = Object.freeze({ VERSION, difficulties, difficultiesFor, types, generate, actions, step, evaluate });
})(typeof window !== "undefined" ? window : globalThis);
