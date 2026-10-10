(function attachWorldGenerator(global) {
  "use strict";

  function createForLocale(LOCALE, randomSource = null) {
  const isHungarian = LOCALE === "hu";
  const text = (english, hungarian) => {
    global.PipI18n?.register(english, hungarian);
    return isHungarian ? hungarian : english;
  };

  const SIZE = 5;
  const WORLD_VERSION = 10;
  const LEGACY_WORLD_VERSIONS = new Set([6, 7, 8, 9]);
  const RANDOM_ATTEMPTS = 1800;
  const DIRECTIONS = ["up", "right", "down", "left"];
  const CELLS = Array.from({ length: SIZE * SIZE }, (_, index) => [Math.floor(index / SIZE), index % SIZE]);
  const PYTHON = Object.freeze(isHungarian
    ? {
        actions: { forward: "előre", right: "jobbra" },
        loopVariable: "lépés",
        sensor: "mit_lát",
        directions: { ahead: "előre" },
        tiles: { wall: "fal", obstacle: "akadály" },
      }
    : {
        actions: { forward: "forward", right: "right" },
        loopVariable: "step",
        sensor: "whats",
        directions: { ahead: "ahead" },
        tiles: { wall: "wall", obstacle: "obstacle" },
      });
  const DELTAS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const EARLY_PROFILES = [
    { label: text("First steps", "Első lépések"), obstacleCount: 1, minimumMoves: 4, maximumMoves: 8, minimumPathTurns: 0, minimumActionTurns: 1, minimumDetour: 0 },
    { label: text("Warm-up", "Bemelegítés"), obstacleCount: 2, minimumMoves: 5, maximumMoves: 9, minimumPathTurns: 1, minimumActionTurns: 1, minimumDetour: 0 },
    { label: text("Pathfinder", "Útkereső"), obstacleCount: 3, minimumMoves: 5, maximumMoves: 10, minimumPathTurns: 1, minimumActionTurns: 2, minimumDetour: 0 },
    { label: text("Navigator", "Navigátor"), obstacleCount: 4, minimumMoves: 6, maximumMoves: 11, minimumPathTurns: 1, minimumActionTurns: 2, minimumDetour: 2 },
    { label: text("Problem solver", "Problémamegoldó"), obstacleCount: 5, minimumMoves: 7, maximumMoves: 12, minimumPathTurns: 2, minimumActionTurns: 2, minimumDetour: 2 },
    { label: text("Trailblazer", "Úttörő"), obstacleCount: 6, minimumMoves: 8, maximumMoves: 13, minimumPathTurns: 2, minimumActionTurns: 3, minimumDetour: 2 },
  ];

  const LATE_PROFILES = [
    { obstacleCount: 6 },
    { obstacleCount: 7 },
  ];

  const FALLBACK_LAYOUTS = {
    1: { start: { row: 3, column: 4, direction: "up" }, goal: { row: 1, column: 1 }, obstacles: [[0, 0]] },
    2: { start: { row: 4, column: 0, direction: "right" }, goal: { row: 0, column: 3 }, obstacles: [[0, 1], [1, 2]] },
    3: { start: { row: 4, column: 1, direction: "down" }, goal: { row: 1, column: 4 }, obstacles: [[3, 3], [4, 2], [3, 2]] },
    4: { start: { row: 1, column: 0, direction: "left" }, goal: { row: 3, column: 4 }, obstacles: [[1, 1], [0, 3], [2, 0], [3, 0]] },
    5: { start: { row: 1, column: 1, direction: "right" }, goal: { row: 4, column: 0 }, obstacles: [[2, 1], [0, 0], [4, 2], [1, 0], [1, 2]] },
    6: { start: { row: 2, column: 4, direction: "down" }, goal: { row: 4, column: 0 }, obstacles: [[4, 1], [2, 3], [3, 4], [0, 3], [2, 1], [3, 1]] },
    7: { start: { row: 1, column: 0, direction: "left" }, goal: { row: 4, column: 3 }, obstacles: [[1, 2], [2, 3], [3, 1], [4, 1], [0, 0], [2, 0], [3, 2]] },
  };

  function normalizeRound(value) {
    return Math.max(1, Math.floor(Number(value) || 1));
  }

  function randomInt(maximum) {
    if (maximum <= 0) return 0;
    if (typeof randomSource === "function") {
      const sampled = Number(randomSource());
      const unit = Number.isFinite(sampled) ? Math.min(Math.max(sampled, 0), 0.999999999999) : 0;
      return Math.floor(unit * maximum);
    }
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const value = new Uint32Array(1);
      global.crypto.getRandomValues(value);
      return value[0] % maximum;
    }
    return Math.floor(Math.random() * maximum);
  }

  function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = randomInt(index + 1);
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function cellKey(row, column) {
    return String(row) + "," + String(column);
  }

  function inBounds(row, column) {
    return Number.isInteger(row) && Number.isInteger(column) &&
      row >= 0 && row < SIZE && column >= 0 && column < SIZE;
  }

  function validPoint(point) {
    return Boolean(point && inBounds(point.row, point.column));
  }

  function shortestPath(start, goal, obstacles = []) {
    if (!validPoint(start) || !validPoint(goal) || !Array.isArray(obstacles)) return null;

    const blocked = new Set();
    for (const cell of obstacles) {
      if (!Array.isArray(cell) || cell.length !== 2 || !inBounds(cell[0], cell[1])) return null;
      blocked.add(cellKey(cell[0], cell[1]));
    }

    const startKey = cellKey(start.row, start.column);
    const goalKey = cellKey(goal.row, goal.column);
    if (blocked.has(startKey) || blocked.has(goalKey)) return null;

    const queue = [[start.row, start.column]];
    const previous = new Map([[startKey, null]]);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const [row, column] = queue[cursor];
      if (cellKey(row, column) === goalKey) break;

      for (const [rowDelta, columnDelta] of DELTAS) {
        const nextRow = row + rowDelta;
        const nextColumn = column + columnDelta;
        const nextKey = cellKey(nextRow, nextColumn);
        if (!inBounds(nextRow, nextColumn) || blocked.has(nextKey) || previous.has(nextKey)) continue;
        previous.set(nextKey, [row, column]);
        queue.push([nextRow, nextColumn]);
      }
    }

    if (!previous.has(goalKey)) return null;

    const path = [];
    let current = [goal.row, goal.column];
    while (current) {
      path.push(current);
      current = previous.get(cellKey(current[0], current[1]));
    }
    return path.reverse();
  }

  function directionBetween(from, to) {
    const rowDelta = to[0] - from[0];
    const columnDelta = to[1] - from[1];
    return DELTAS.findIndex(
      ([expectedRow, expectedColumn]) =>
        expectedRow === rowDelta && expectedColumn === columnDelta
    );
  }

  function pathToActions(path, startingDirection) {
    let direction = DIRECTIONS.indexOf(startingDirection);
    const actions = [];

    for (let index = 1; index < path.length; index += 1) {
      const targetDirection = directionBetween(path[index - 1], path[index]);
      const difference = (targetDirection - direction + 4) % 4;

      if (difference === 1) actions.push("right");
      else if (difference === 2) actions.push("right", "right");
      else if (difference === 3) actions.push("left");

      actions.push("forward");
      direction = targetDirection;
    }

    return actions;
  }

  function countActionTurns(actions) {
    return actions.filter((action) => action !== "forward").length;
  }

  function countPathTurns(path) {
    let previousDirection = null;
    let turns = 0;
    for (let index = 1; index < path.length; index += 1) {
      const direction = directionBetween(path[index - 1], path[index]);
      if (previousDirection !== null && direction !== previousDirection) turns += 1;
      previousDirection = direction;
    }
    return turns;
  }

  function previousLoopStarterProgram() {
    return [
      "def main():",
      "    for " + PYTHON.loopVariable + " in range(3):",
      "        if " + PYTHON.sensor + "(\"" + PYTHON.directions.ahead + "\") in (\"" + PYTHON.tiles.wall + "\", \"" + PYTHON.tiles.obstacle + "\"):",
      "            " + PYTHON.actions.right + "()",
      "        " + PYTHON.actions.forward + "()",
      "",
      "",
      "main()",
      "",
    ].join("\n");
  }

  function previousFullStarterProgram() {
    return [
      "def main():",
      "    print(\"" + text("Hello, Pip!", "Szia, Pip!") + "\")",
      "    for " + PYTHON.loopVariable + " in range(3):",
      "        if " + PYTHON.sensor + "(\"" + PYTHON.directions.ahead + "\") in (\"" + PYTHON.tiles.wall + "\", \"" + PYTHON.tiles.obstacle + "\"):",
      "            " + PYTHON.actions.right + "()",
      "        " + PYTHON.actions.forward + "()",
      "",
      "",
      "main()",
      "",
    ].join("\n");
  }

  function legacyHeaderLines(round) {
    const missionNote = round <= 2
      ? text(
          "This route starts correctly but stops early. Finish it or replace it.",
          "Az útvonal eleje helyes, de túl korán megáll. Fejezd be vagy írd át."
        )
      : text(
          "Only the beginning is provided. Build your own route to the star.",
          "Csak a kezdetet adtuk meg. Készíts saját útvonalat a csillagig."
        );
    const explanation = isHungarian
      ? [
          "    # A mit_lát(irány) Pip nézési irányához képest vizsgálódik.",
          "    # Pontosan ezeket fogadja el: \"előre\", \"balra\", \"jobbra\" vagy \"mögötte\".",
          "    # Ezt adja vissza: \"szabad\", \"fal\", \"akadály\" vagy \"cél\".",
          "    # A \"fal\" a tábla széle; az \"akadály\" egy szürke blokk.",
          "    # A \"szabad\" üres mező; a \"cél\" a csillag.",
          "    # Használd a mit_lát(...) függvényt if/elif feltételekben; szükség esetén kombináld a vizsgálatokat and/or segítségével.",
        ]
      : [
          "    # whats(direction) looks relative to where Pip faces.",
          "    # It accepts exactly \"ahead\", \"left\", \"right\", or \"behind\".",
          "    # It returns \"clear\", \"wall\", \"obstacle\", or \"goal\".",
          "    # \"wall\" is the board edge; \"obstacle\" is a grey block.",
          "    # \"clear\" is open floor; \"goal\" is the star.",
          "    # Use whats(...) in if/elif; combine calls with and/or when useful.",
        ];
    return [...explanation, "    # " + missionNote];
  }

  function roundProfile(value) {
    const round = normalizeRound(value);
    if (round <= EARLY_PROFILES.length) return { round, ...EARLY_PROFILES[round - 1] };

    const late = LATE_PROFILES[(round - 7) % LATE_PROFILES.length];
    return {
      round,
      label: text("Mastery", "Mesterfok"),
      minimumMoves: 8,
      maximumMoves: 14,
      minimumPathTurns: 2,
      minimumActionTurns: 3,
      minimumDetour: 2,
      ...late,
    };
  }

  function randomObstacleSet(excluded, count) {
    return shuffle(CELLS.filter(([row, column]) => !excluded.has(cellKey(row, column)))).slice(0, count);
  }

  function roundCandidateIsSuitable(profile, start, goal, path, direction) {
    if (!path || !DIRECTIONS.includes(direction)) return false;
    const moves = path.length - 1;
    const directDistance = Math.abs(start.row - goal.row) + Math.abs(start.column - goal.column);
    if (moves < profile.minimumMoves || moves > profile.maximumMoves) return false;
    if (moves < directDistance + profile.minimumDetour) return false;
    if (countPathTurns(path) < profile.minimumPathTurns) return false;
    return countActionTurns(pathToActions(path, direction)) >= profile.minimumActionTurns;
  }

  function buildRoundWorld(profile, start, goal, obstacles, direction, path) {
    const actions = pathToActions(path, direction);
    return {
      schemaVersion: WORLD_VERSION,
      round: profile.round,
      scenario: {
        start: { ...start, direction },
        goal: { ...goal },
        obstacles: obstacles.map(([row, column]) => [row, column]),
      },
      solution: {
        path: path.map(([row, column]) => [row, column]),
        actions: [...actions],
        shortestMoves: path.length - 1,
      },
    };
  }

  function generateRound(value) {
    const profile = roundProfile(value);
    const minimumDistance = Math.min(5, Math.max(3, profile.minimumMoves - 3));

    for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt += 1) {
      const [startCell, goalCell] = shuffle(CELLS).slice(0, 2);
      const start = { row: startCell[0], column: startCell[1] };
      const goal = { row: goalCell[0], column: goalCell[1] };
      const directDistance = Math.abs(start.row - goal.row) + Math.abs(start.column - goal.column);
      if (directDistance < minimumDistance) continue;

      const excluded = new Set([cellKey(start.row, start.column), cellKey(goal.row, goal.column)]);
      const obstacles = randomObstacleSet(excluded, profile.obstacleCount);
      const path = shortestPath(start, goal, obstacles);
      const direction = DIRECTIONS[randomInt(DIRECTIONS.length)];
      if (!roundCandidateIsSuitable(profile, start, goal, path, direction)) continue;
      return buildRoundWorld(profile, start, goal, obstacles, direction, path);
    }

    const fallback = FALLBACK_LAYOUTS[profile.obstacleCount];
    const { direction, ...start } = fallback.start;
    const path = shortestPath(start, fallback.goal, fallback.obstacles);
    if (!roundCandidateIsSuitable(profile, start, fallback.goal, path, direction)) {
      throw new Error("Could not generate a valid board for round " + profile.round + ".");
    }
    return buildRoundWorld(profile, start, fallback.goal, fallback.obstacles, direction, path);
  }

  function sameCoordinate(first, second) {
    return first[0] === second[0] && first[1] === second[1];
  }

  function validSolutionPath(path, scenario, obstacleKeys) {
    if (!Array.isArray(path) || path.length < 2) return false;
    const seen = new Set();

    for (let index = 0; index < path.length; index += 1) {
      const point = path[index];
      if (!Array.isArray(point) || point.length !== 2 || !inBounds(point[0], point[1])) return false;
      const pointKey = cellKey(point[0], point[1]);
      if (obstacleKeys.has(pointKey) || seen.has(pointKey)) return false;
      seen.add(pointKey);

      if (index > 0) {
        const distance = Math.abs(point[0] - path[index - 1][0]) +
          Math.abs(point[1] - path[index - 1][1]);
        if (distance !== 1) return false;
      }
    }

    return sameCoordinate(path[0], [scenario.start.row, scenario.start.column]) &&
      sameCoordinate(path[path.length - 1], [scenario.goal.row, scenario.goal.column]);
  }

  function arraysMatch(first, second) {
    return first.length === second.length && first.every((value, index) => value === second[index]);
  }

  function validateSemanticRound(value, world) {
    const profile = roundProfile(value);
    const scenario = world?.scenario;
    const solution = world?.solution;

    if (
      world?.round !== profile.round ||
      !validPoint(scenario?.start) ||
      !validPoint(scenario?.goal) ||
      !DIRECTIONS.includes(scenario.start.direction) ||
      !Array.isArray(scenario.obstacles) ||
      scenario.obstacles.length !== profile.obstacleCount ||
      cellKey(scenario.start.row, scenario.start.column) === cellKey(scenario.goal.row, scenario.goal.column) ||
      !solution ||
      !Number.isInteger(solution.shortestMoves) ||
      !Array.isArray(solution.actions)
    ) return false;

    const obstacleKeys = new Set();
    for (const cell of scenario.obstacles) {
      if (!Array.isArray(cell) || cell.length !== 2 || !inBounds(cell[0], cell[1])) return false;
      const obstacleKey = cellKey(cell[0], cell[1]);
      if (obstacleKeys.has(obstacleKey)) return false;
      obstacleKeys.add(obstacleKey);
    }
    if (obstacleKeys.has(cellKey(scenario.start.row, scenario.start.column))) return false;
    if (obstacleKeys.has(cellKey(scenario.goal.row, scenario.goal.column))) return false;

    if (!validSolutionPath(solution.path, scenario, obstacleKeys)) return false;
    if (solution.shortestMoves !== solution.path.length - 1) return false;

    const computedShortestPath = shortestPath(scenario.start, scenario.goal, scenario.obstacles);
    if (!computedShortestPath || computedShortestPath.length !== solution.path.length) return false;
    if (!roundCandidateIsSuitable(profile, scenario.start, scenario.goal, solution.path, scenario.start.direction)) return false;

    const expectedActions = pathToActions(solution.path, scenario.start.direction);
    // Every adjacent path step contributes exactly one forward command.
    return arraysMatch(solution.actions, expectedActions);
  }

  function neutralRoundCopy(world) {
    return {
      schemaVersion: WORLD_VERSION,
      round: world.round,
      scenario: {
        start: {
          row: world.scenario.start.row,
          column: world.scenario.start.column,
          direction: world.scenario.start.direction,
        },
        goal: {
          row: world.scenario.goal.row,
          column: world.scenario.goal.column,
        },
        obstacles: world.scenario.obstacles.map(([row, column]) => [row, column]),
      },
      solution: {
        path: world.solution.path.map(([row, column]) => [row, column]),
        actions: [...world.solution.actions],
        shortestMoves: world.solution.shortestMoves,
      },
    };
  }

  function validateRound(value, world) {
    return Boolean(
      world?.schemaVersion === WORLD_VERSION &&
      !Object.prototype.hasOwnProperty.call(world, "starterCode") &&
      !Object.prototype.hasOwnProperty.call(world?.scenario || {}, "name") &&
      !Object.prototype.hasOwnProperty.call(world?.scenario || {}, "shortName") &&
      validateSemanticRound(value, world)
    );
  }

  function presentRound(value, world) {
    if (!validateRound(value, world)) return null;

    const presented = neutralRoundCopy(world);
    presented.starterCode = "";
    return presented;
  }

  function migrateRound(value, world) {
    if (!LEGACY_WORLD_VERSIONS.has(world?.schemaVersion)) return null;
    if (!validateSemanticRound(value, world)) return null;

    const migrated = neutralRoundCopy(world);
    return validateRound(value, migrated) ? migrated : null;
  }

  function migrateDraft(value, draft) {
    if (typeof draft !== "string") return draft;
    if (
      draft === previousFullStarterProgram() ||
      draft === previousLoopStarterProgram()
    ) return "";

    const marker = [
      "def main():",
      ...legacyHeaderLines(normalizeRound(value)),
      "",
    ].join("\n");
    let index = draft.indexOf(marker);

    while (index !== -1) {
      if (index === 0 || draft[index - 1] === "\n") {
        return draft.slice(0, index) + "def main():\n" + draft.slice(index + marker.length);
      }
      index = draft.indexOf(marker, index + 1);
    }
    return draft;
  }

  return {
    generateRound,
    // An independent RNG keeps reproducible Blocks boards on this exact
    // Python generator, without changing native randomness or global state.
    generateRoundWithRandom(value, random) {
      if (typeof random !== "function") throw new TypeError("A random source is required.");
      return createForLocale(LOCALE, random).generateRound(value);
    },
    migrateDraft,
    migrateRound,
    presentRound,
    roundProfile,
    validateRound,
  };
  }
  global.PipWorldGeneratorLocales = { en: createForLocale("en"), hu: createForLocale("hu") };
  global.PipWorldGenerator = global.PipWorldGeneratorLocales[global.PipLocale === "hu" ? "hu" : "en"];
})(typeof window === "undefined" ? globalThis : window);
