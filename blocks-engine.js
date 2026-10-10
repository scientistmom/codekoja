// Standalone Blocks mechanics. Programs stay as editable, flat card sequences.
(function (global) {
  "use strict";

  const cards = {
    FORWARD: ["Forward", "Előre", "↑", "#4ade80", "action"],
    TURN_LEFT: ["Left", "Balra", "↺", "#60a5fa", "action"],
    TURN_RIGHT: ["Right", "Jobbra", "↻", "#f97316", "action"],
    FOR_2: ["× 2", "× 2", "⟳", "#a78bfa", "for"],
    FOR_3: ["× 3", "× 3", "⟳", "#c084fc", "for"],
    FOR_4: ["× 4", "× 4", "⟳", "#a78bfa", "for"],
    FOR_7: ["× 7", "× 7", "⟳", "#a78bfa", "for"],
    FOR_12: ["× 12", "× 12", "⟳", "#a78bfa", "for"],
    END: ["End", "Vége", "⤵", "#fb7185", "end"],
    IF_CLEAR: ["If clear", "Ha szabad", "?", "#67e8f9", "if"],
    IF_WALL: ["If wall", "Ha fal", "?", "#67e8f9", "if"],
    IF_OBSTACLE: ["If obstacle", "Ha akadály", "?", "#67e8f9", "if"],
    IF_GOAL: ["If goal", "Ha cél", "?", "#67e8f9", "if"],
    WHILE_CLEAR: ["While clear", "Amíg szabad", "⟳", "#fbbf24", "while"],
    WHILE_WALL: ["While wall", "Amíg fal", "⟳", "#fbbf24", "while"],
    WHILE_OBSTACLE: ["While obstacle", "Amíg akadály", "⟳", "#fbbf24", "while"],
    WHILE_NOT_GOAL: ["While not goal", "Amíg nem cél", "⟳", "#fbbf24", "while"],
  };
  const directions = ["up", "right", "down", "left"];
  const deltas = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const typeOf = card => typeof card === "string" ? card : card?.type;
  const known = type => typeof type === "string" && Object.hasOwn(cards, type);

  function definition(type, locale = "en") {
    const entry = cards[typeOf(type)];
    if (!known(typeOf(type))) return null;
    return { label: entry[locale === "hu" ? 1 : 0], icon: entry[2], color: entry[3], group: entry[4] };
  }

  function isOpener(type) {
    const value = typeOf(type);
    return known(value) && ["for", "if", "while"].includes(cards[value][4]);
  }

  // Incomplete programs still have useful depths while a child edits them.
  // END pops first, so it lines up with its opener instead of its children.
  function depths(sequence) {
    let depth = 0;
    return (Array.isArray(sequence) ? sequence : []).map(card => {
      const type = typeOf(card);
      if (type === "END") depth = Math.max(0, depth - 1);
      const current = depth;
      if (isOpener(type)) depth += 1;
      return current;
    });
  }

  function structure(sequence) {
    const stack = [], pairs = [];
    const result = error => ({ ok: error === null, pairs: pairs.sort((a, b) => a[0] - b[0]), error, openers: stack.slice() });
    if (!Array.isArray(sequence)) return result({ index: -1, code: "invalid-sequence" });
    for (let index = 0; index < sequence.length; index += 1) {
      const type = typeOf(sequence[index]);
      if (!known(type)) return result({ index, code: "unknown-block" });
      if (isOpener(type)) stack.push(index);
      else if (type === "END") {
        if (!stack.length) return result({ index, code: "extra-end" });
        pairs.push([stack.pop(), index]);
      }
    }
    return result(null);
  }

  // Missing ENDs close at EOF without becoming editable cards. Limit errors
  // on a synthetic END stay attached to its visible opening card.
  function prepare(sequence) {
    const parsed = structure(sequence), indices = [];
    if (parsed.ok && parsed.openers?.length) {
      sequence = sequence.slice();
      for (const opener of parsed.openers.slice().reverse()) {
        parsed.pairs.push([opener, sequence.length]);
        indices[sequence.length] = opener;
        sequence.push("END");
      }
    }
    return { sequence, parsed, visibleIndex: index => indices[index] ?? index };
  }

  function validScenario(scenario, width, height) {
    const inside = (row, column) => Number.isInteger(row) && Number.isInteger(column)
      && row >= 0 && row < height && column >= 0 && column < width;
    return Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0
      && scenario?.start && inside(scenario.start.row, scenario.start.column)
      && directions.includes(scenario.start.direction ?? "right")
      && (scenario.goal == null || inside(scenario.goal.row, scenario.goal.column))
      && (scenario.obstacles == null || (Array.isArray(scenario.obstacles)
        && scenario.obstacles.every(cell => Array.isArray(cell)
          ? inside(cell[0], cell[1]) : inside(cell?.row, cell?.column))));
  }

  function boundedLimit(value, fallback, ceiling) {
    return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), ceiling) : fallback;
  }

  /**
   * Run directly, without Python or browser services. Coins are handled by the
   * caller from forward events and are never changed here. Limits count every
   * evaluated card (including END and while rechecks), and emitted events.
   * Defaults: 10,000 operations / 500 events; hard caps: 100,000 / 5,000.
   */
  function execute(sequence, scenario, limits = {}) {
    const state = {
      row: scenario?.start?.row ?? 0,
      column: scenario?.start?.column ?? 0,
      direction: scenario?.start?.direction ?? "right",
      goal_reached: false,
    };
    const events = [];
    const prepared = prepare(sequence), { parsed, visibleIndex } = prepared;
    sequence = prepared.sequence;
    const fail = (index, code) => ({ ok: false, events, state, error: { index: visibleIndex(index), code } });
    if (!parsed.ok) return fail(parsed.error.index, parsed.error.code);
    const width = scenario?.width ?? 5, height = scenario?.height ?? 5;
    if (!validScenario(scenario, width, height)) return fail(-1, "invalid-scenario");

    const maxOperations = boundedLimit(limits?.maxOperations, 10000, 100000);
    const maxEvents = boundedLimit(limits?.maxEvents, 500, 5000);
    const endFor = new Map(parsed.pairs);
    const obstacles = new Set((scenario.obstacles || []).map(cell => Array.isArray(cell)
      ? `${cell[0]},${cell[1]}` : `${cell.row},${cell.column}`));
    const goal = scenario.goal;
    const atGoal = (row, column) => goal != null && goal.row === row && goal.column === column;
    const frames = [], loops = [];
    const emit = (type, index) => events.push({
      type, row: state.row, column: state.column, direction: state.direction, index, loops: loops.slice(),
    });
    const ahead = () => {
      const [dr, dc] = deltas[directions.indexOf(state.direction)];
      const row = state.row + dr, column = state.column + dc;
      const tile = row < 0 || row >= height || column < 0 || column >= width ? "wall"
        : obstacles.has(`${row},${column}`) ? "obstacle"
          : atGoal(row, column) ? "goal" : "clear";
      return { row, column, tile };
    };
    const condition = type => {
      const tile = ahead().tile;
      return type === "WHILE_NOT_GOAL" ? tile !== "goal"
        : tile === type.slice(type.indexOf("_") + 1).toLowerCase();
    };

    if (atGoal(state.row, state.column)) {
      if (maxEvents < 1) return fail(-1, "event-limit");
      state.goal_reached = true;
      emit("goal", -1);
      return { ok: true, events, state };
    }

    // An explicit frame stack keeps deeply nested child programs off the JS
    // call stack. Even an empty while body consumes the evaluation budget.
    let index = 0, operations = 0;
    while (index < sequence.length && !state.goal_reached) {
      if (operations >= maxOperations) return fail(index, "operation-limit");
      operations += 1;
      const type = typeOf(sequence[index]);
      if (type === "END") {
        const frame = frames[frames.length - 1];
        if (frame.kind === "for" && --frame.remaining > 0) {
          index = frame.index + 1;
        } else {
          frames.pop();
          if (frame.kind !== "if") loops.pop();
          index = frame.kind === "while" ? frame.index : index + 1;
        }
      } else if (isOpener(type)) {
        const kind = cards[type][4];
        if (kind !== "for" && !condition(type)) {
          index = endFor.get(index) + 1;
        } else {
          frames.push({ kind, index, remaining: kind === "for" ? Number(type.slice(4)) : 0 });
          if (kind !== "if") loops.push(index);
          index += 1;
        }
      } else {
        const target = type === "FORWARD" ? ahead() : null;
        // Reserve the whole action, so reaching a goal always has both its
        // forward and goal event and a capped run never silently moves Koja.
        const count = target?.tile === "goal" ? 2 : 1;
        if (events.length + count > maxEvents) return fail(index, "event-limit");
        if (target) {
          if (target.tile === "wall" || target.tile === "obstacle") emit("obstacle", index);
          else {
            state.row = target.row;
            state.column = target.column;
            emit("forward", index);
            if (target.tile === "goal") {
              state.goal_reached = true;
              emit("goal", index);
            }
          }
        } else {
          const turn = type === "TURN_LEFT" ? 3 : 1;
          state.direction = directions[(directions.indexOf(state.direction) + turn) % 4];
          emit(type === "TURN_LEFT" ? "left" : "right", index);
        }
        index += 1;
      }
    }
    return { ok: true, events, state };
  }

  // EOF-closing ENDs do not change program meaning or rewards; an END between
  // actions still counts.
  function scoreSize(sequence) {
    if (!Array.isArray(sequence)) return 0;
    let length = sequence.length;
    while (length && typeOf(sequence[length - 1]) === "END") length -= 1;
    return length;
  }
  global.PipBlocksScope = Object.freeze({ definition, isOpener, depths, structure, scoreSize, execute });
})(typeof window !== "undefined" ? window : globalThis);
