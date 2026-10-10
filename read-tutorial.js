(function attachReadTutorial(global) {
  "use strict";

  function createForLocale(LOCALE, options = {}) {
  const isHungarian = LOCALE === "hu";
  const text = (english, hungarian) => {
    global.PipI18n?.register(english, hungarian);
    return isHungarian ? hungarian : english;
  };

  const SIZE = 5;
  const DIRECTIONS = ["up", "right", "down", "left"];
  const DELTAS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const DIFFICULTIES = Object.freeze([
    {
      id: "actions",
    },
    {
      id: "for",
    },
    {
      id: "if",
    },
    {
      id: "while",
    },
    {
      id: "mixed",
    },
  ]);

  const DIFFICULTY_IDS = new Set(DIFFICULTIES.map((item) => item.id));

  function defaultRandom() {
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const value = new Uint32Array(1);
      global.crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  }

  function randomInt(maximum, random) {
    if (!Number.isInteger(maximum) || maximum <= 0) return 0;
    const value = Number(random());
    const unit = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999999999) : 0;
    return Math.floor(unit * maximum);
  }

  function choose(values, random) {
    return values[randomInt(values.length, random)];
  }

  function shuffled(values, random) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = randomInt(index + 1, random);
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function cellKey(row, column) {
    return String(row) + "," + String(column);
  }

  function inBounds(row, column) {
    return row >= 0 && row < SIZE && column >= 0 && column < SIZE;
  }

  function turnDirection(direction, action) {
    const amount = action === "right" ? 1 : -1;
    return (direction + amount + DIRECTIONS.length) % DIRECTIONS.length;
  }

  function applyAction(state, action) {
    if (action === "left" || action === "right") {
      return { ...state, direction: turnDirection(state.direction, action) };
    }
    const [rowDelta, columnDelta] = DELTAS[state.direction];
    return {
      row: state.row + rowDelta,
      column: state.column + columnDelta,
      direction: state.direction,
    };
  }

  function relativeTarget(state, relativeDirection = "ahead") {
    const offsets = { ahead: 0, right: 1, behind: 2, left: -1 };
    const direction = (state.direction + offsets[relativeDirection] + DIRECTIONS.length)
      % DIRECTIONS.length;
    const [rowDelta, columnDelta] = DELTAS[direction];
    return { row: state.row + rowDelta, column: state.column + columnDelta };
  }

  function traceRelativeRoute(actions, startingDirection) {
    let state = { row: 0, column: 0, direction: startingDirection };
    const states = [{ ...state }];
    for (const action of actions) {
      state = applyAction(state, action);
      states.push({ ...state });
    }
    return states;
  }

  function routePlacements(actions) {
    const placements = [];
    for (let direction = 0; direction < DIRECTIONS.length; direction += 1) {
      const relativeStates = traceRelativeRoute(actions, direction);
      const rows = relativeStates.map((state) => state.row);
      const columns = relativeStates.map((state) => state.column);
      const minimumRow = Math.min(...rows);
      const maximumRow = Math.max(...rows);
      const minimumColumn = Math.min(...columns);
      const maximumColumn = Math.max(...columns);

      for (let rowOffset = -minimumRow; rowOffset < SIZE - maximumRow; rowOffset += 1) {
        for (
          let columnOffset = -minimumColumn;
          columnOffset < SIZE - maximumColumn;
          columnOffset += 1
        ) {
          const states = relativeStates.map((state) => ({
            row: state.row + rowOffset,
            column: state.column + columnOffset,
            direction: state.direction,
          }));
          placements.push({
            start: states[0],
            states,
            visited: new Set(states.map((state) => cellKey(state.row, state.column))),
          });
        }
      }
    }
    return placements;
  }

  function addFillerObstacles(blocked, count, random) {
    const available = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        if (!blocked.has(cellKey(row, column))) available.push([row, column]);
      }
    }
    return shuffled(available, random).slice(0, count);
  }

  // Programs are assembled from controlled templates. Translate only complete Python
  // identifiers and exact string literals so Python keywords and user-facing text
  // cannot be changed accidentally by a broad source-code replacement.
  const PYTHON_IDENTIFIER_TRANSLATIONS = Object.freeze({
    forward: "előre",
    left: "balra",
    right: "jobbra",
    whats: "mit_lát",
    steps_left: "hátralévő_lépések",
    left_side: "bal_oldal",
    right_side: "jobb_oldal",
    corridors: "bejárt_folyosók",
    exploring: "mehetünk_tovább",
    distance: "távolság",
    section: "szakasz",
    corridor: "folyosó",
    corner: "sarok",
    repeat: "ismétlés",
    check: "vizsgálat",
    steps: "lépések",
    turns: "fordulatok",
    step: "lépés",
    side: "oldal",
    ahead: "előtte",
  });

  const PYTHON_STRING_TRANSLATIONS = Object.freeze({
    ahead: "előre",
    left: "balra",
    right: "jobbra",
    behind: "mögötte",
    clear: "szabad",
    wall: "fal",
    obstacle: "akadály",
    "Straight ahead": "Egyenesen előre",
  });

  function localizePythonLine(line) {
    if (!isHungarian) return line;
    return line.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z_][A-Za-z0-9_]*/g,
      (token) => {
        const quote = token[0];
        if (quote === '"' || quote === "'") {
          const value = token.slice(1, -1);
          const translated = PYTHON_STRING_TRANSLATIONS[value];
          return translated ? quote + translated + quote : token;
        }
        return PYTHON_IDENTIFIER_TRANSLATIONS[token] || token;
      }
    );
  }

  // Templates share one outer indentation level. Present their instructions
  // directly, preserving the indentation inside loops and conditionals.
  function program(lines) {
    return lines.map(line => localizePythonLine(line.replace(/^ {4}/, ""))).join("\n");
  }

  function actionLines(actions, indentation = "    ") {
    return actions.map((action) => indentation + action + "()");
  }

  function repeatAction(action, count) {
    return Array.from({ length: count }, () => action);
  }

  function makeScenario(start, obstacles) {
    return {
      width: SIZE,
      height: SIZE,
      start: {
        row: start.row,
        column: start.column,
        direction: DIRECTIONS[start.direction],
      },
      goal: null,
      obstacles,
    };
  }

  function makeLevel(difficultyId, starterCode, scenario, serial, details = {}) {
    const difficultyIndex = DIFFICULTIES.findIndex((item) => item.id === difficultyId);
    return {
      id: "read-" + difficultyId + "-" + serial,
      difficulty: difficultyId,
      difficultyIndex,
      fileName: text("follow_code.py", "kövesd_a_kódot.py"),
      starterCode,
      scenarios: [scenario],
      ...details,
    };
  }

  const lastTemplateFactoryByDifficulty = new Map();
  const allowedTemplates = Array.isArray(options.templateIds) ? new Set(options.templateIds) : null;

  function generateFromFactories(difficultyId, random, serial, factories) {
    const previousFactory = lastTemplateFactoryByDifficulty.get(difficultyId);
    const choices = shuffled(
      factories.filter((factory) => factory.name !== previousFactory),
      random
    );
    const fallback = factories.find((factory) => factory.name === previousFactory);
    if (fallback) choices.push(fallback);
    let lastError = null;

    for (const factory of choices) {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const level = factory(random, serial);
          if (allowedTemplates && !allowedTemplates.has(level.templateId)) break;
          lastTemplateFactoryByDifficulty.set(difficultyId, factory.name);
          return level;
        } catch (error) {
          lastError = error;
        }
      }
    }

    throw lastError || new Error("Could not construct a " + difficultyId + " challenge.");
  }

  function commandZigzag(random, serial) {
    const firstLength = 1 + randomInt(2, random);
    const middleLength = 1 + randomInt(2, random);
    const lastLength = 1 + randomInt(2, random);
    const firstTurn = choose(["left", "right"], random);
    const secondTurn = firstTurn === "left" ? "right" : "left";
    const actions = [
      ...repeatAction("forward", firstLength),
      firstTurn,
      ...repeatAction("forward", middleLength),
      secondTurn,
      ...repeatAction("forward", lastLength),
    ];
    return buildReadFromSpec("actions", random, serial, {
      templateId: "commands-zigzag",
      variantId: [firstLength, middleLength, lastLength, firstTurn].join("-"),
      actions,
      observations: [],
      lines: actionLines(actions),
    });
  }

  function commandTurnFirst(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const firstLength = 1 + randomInt(2, random);
    const secondLength = 1 + randomInt(2, random);
    const actions = [
      side,
      ...repeatAction("forward", firstLength),
      other,
      ...repeatAction("forward", secondLength),
      side,
      "forward",
    ];
    return buildReadFromSpec("actions", random, serial, {
      templateId: "commands-turn-first",
      variantId: [side, firstLength, secondLength].join("-"),
      actions,
      observations: [],
      lines: actionLines(actions),
    });
  }

  function commandStairSteps(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actions = ["forward", side, "forward", other, "forward", side, "forward"];
    return buildReadFromSpec("actions", random, serial, {
      templateId: "commands-stair-steps",
      variantId: side,
      actions,
      observations: [],
      lines: actionLines(actions),
    });
  }

  function commandUTurn(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actions = ["forward", "forward", side, side, "forward", other, "forward"];
    return buildReadFromSpec("actions", random, serial, {
      templateId: "commands-u-turn",
      variantId: side,
      actions,
      observations: [],
      lines: actionLines(actions),
    });
  }

  function commandFaceAndReturn(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const lastLength = 1 + randomInt(2, random);
    const actions = [
      side,
      other,
      "forward",
      "forward",
      other,
      side,
      ...repeatAction("forward", lastLength),
    ];
    return buildReadFromSpec("actions", random, serial, {
      templateId: "commands-face-return",
      variantId: side + "-" + lastLength,
      actions,
      observations: [],
      lines: actionLines(actions),
    });
  }

  const ACTION_TEMPLATE_FACTORIES = [
    commandZigzag,
    commandTurnFirst,
    commandStairSteps,
    commandUTurn,
    commandFaceAndReturn,
  ];

  function forTwoStretches(random, serial) {
    const firstLength = 2 + randomInt(2, random);
    const secondLength = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const actions = [
      ...repeatAction("forward", firstLength),
      turn,
      ...repeatAction("forward", secondLength),
    ];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-two-stretches",
      variantId: [firstLength, secondLength, turn].join("-"),
      actions,
      observations: [],
      lines: [
        "    for step in range(" + firstLength + "):",
        "        forward()",
        "    " + turn + "()",
        "    for step in range(" + secondLength + "):",
        "        forward()",
      ],
    });
  }

  function forOneLoopWithTail(random, serial) {
    const distance = 2 + randomInt(2, random);
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actions = [side, ...repeatAction("forward", distance), other, "forward", "forward"];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-one-loop-tail",
      variantId: side + "-" + distance,
      actions,
      observations: [],
      lines: [
        "    " + side + "()",
        "    for step in range(" + distance + "):",
        "        forward()",
        "    " + other + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function forRepeatedCorner(random, serial) {
    const side = choose(["left", "right"], random);
    const actions = ["forward", side, "forward", side, "forward", "forward"];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-repeated-corner",
      variantId: side,
      actions,
      observations: [],
      lines: [
        "    for corner in range(2):",
        "        forward()",
        "        " + side + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function forWideCorner(random, serial) {
    const side = choose(["left", "right"], random);
    const actions = [
      "forward", "forward", side,
      "forward", "forward", side,
      "forward",
    ];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-wide-corner",
      variantId: side,
      actions,
      observations: [],
      lines: [
        "    for corner in range(2):",
        "        forward()",
        "        forward()",
        "        " + side + "()",
        "    forward()",
      ],
    });
  }

  function forTurnThenGo(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actions = [side, "forward", side, "forward", other, "forward", "forward"];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-turn-then-go",
      variantId: side,
      actions,
      observations: [],
      lines: [
        "    for repeat in range(2):",
        "        " + side + "()",
        "        forward()",
        "    " + other + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function forTwoBodyShapes(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actions = ["forward", "forward", side, "forward", other, "forward", other, "forward"];
    return buildReadFromSpec("for", random, serial, {
      templateId: "for-two-body-shapes",
      variantId: side,
      actions,
      observations: [],
      lines: [
        "    for step in range(2):",
        "        forward()",
        "    " + side + "()",
        "    for corner in range(2):",
        "        forward()",
        "        " + other + "()",
        "    forward()",
      ],
    });
  }

  const FOR_TEMPLATE_FACTORIES = [
    forTwoStretches,
    forOneLoopWithTail,
    forRepeatedCorner,
    forWideCorner,
    forTurnThenGo,
    forTwoBodyShapes,
  ];

  function ifAheadObstacle(random, serial) {
    const turn = choose(["left", "right"], random);
    const oppositeTurn = turn === "left" ? "right" : "left";
    const actual = choose(["obstacle", "clear"], random);
    const actions = actual === "obstacle"
      ? [turn, "forward", oppositeTurn, "forward"]
      : ["forward", "forward", oppositeTurn, "forward"];
    return buildReadFromSpec("if", random, serial, {
      templateId: "if-ahead-obstacle",
      variantId: actual + "-" + turn,
      actions,
      observations: [{ step: 0, direction: "ahead", value: actual }],
      lines: [
        "    if whats(\"ahead\") == \"obstacle\":",
        "        " + turn + "()",
        "    else:",
        "        forward()",
        "    forward()",
        "    " + oppositeTurn + "()",
        "    forward()",
      ],
    });
  }

  function ifSideChoice(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actual = choose(["wall", "clear"], random);
    const branchAction = actual === "wall" ? other : side;
    const tailTurn = choose(["left", "right"], random);
    const actions = [branchAction, "forward", "forward", tailTurn, "forward"];
    return buildReadFromSpec("if", random, serial, {
      templateId: "if-side-choice",
      variantId: [side, actual, tailTurn].join("-"),
      actions,
      observations: [{ step: 0, direction: side, value: actual }],
      lines: [
        "    if whats(\"" + side + "\") == \"wall\":",
        "        " + other + "()",
        "    else:",
        "        " + side + "()",
        "    forward()",
        "    forward()",
        "    " + tailTurn + "()",
        "    forward()",
      ],
    });
  }

  function ifOptionalBody(random, serial) {
    const turn = choose(["left", "right"], random);
    const other = turn === "left" ? "right" : "left";
    const actual = choose(["obstacle", "clear"], random);
    const actions = [
      ...(actual === "obstacle" ? [turn] : []),
      "forward",
      other,
      "forward",
      "forward",
    ];
    return buildReadFromSpec("if", random, serial, {
      templateId: "if-optional-body",
      variantId: actual + "-" + turn,
      actions,
      observations: [{ step: 0, direction: "ahead", value: actual }],
      lines: [
        "    if whats(\"ahead\") == \"obstacle\":",
        "        " + turn + "()",
        "    forward()",
        "    " + other + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function ifBehindChoice(random, serial) {
    const side = choose(["left", "right"], random);
    const other = side === "left" ? "right" : "left";
    const actual = choose(["wall", "clear"], random);
    const branchAction = actual === "wall" ? side : other;
    const actions = [branchAction, "forward", "forward", side, "forward"];
    return buildReadFromSpec("if", random, serial, {
      templateId: "if-behind-choice",
      variantId: actual + "-" + side,
      actions,
      observations: [{ step: 0, direction: "behind", value: actual }],
      lines: [
        "    if whats(\"behind\") == \"wall\":",
        "        " + side + "()",
        "    else:",
        "        " + other + "()",
        "    forward()",
        "    forward()",
        "    " + side + "()",
        "    forward()",
      ],
    });
  }

  function ifTwoDecisions(random, serial) {
    const firstValue = choose(["obstacle", "clear"], random);
    const secondValue = choose(["wall", "clear"], random);
    const actions = [];
    const observations = [{ step: 0, direction: "ahead", value: firstValue }];
    actions.push(firstValue === "obstacle" ? "left" : "forward");
    observations.push({ step: actions.length, direction: "ahead", value: secondValue });
    actions.push(secondValue === "wall" ? "right" : "forward", "right", "forward");
    return buildReadFromSpec("if", random, serial, {
      templateId: "if-two-decisions",
      variantId: firstValue + "-" + secondValue,
      actions,
      observations,
      lines: [
        "    if whats(\"ahead\") == \"obstacle\":",
        "        left()",
        "    else:",
        "        forward()",
        "    if whats(\"ahead\") == \"wall\":",
        "        right()",
        "    else:",
        "        forward()",
        "    right()",
        "    forward()",
      ],
    });
  }

  const IF_TEMPLATE_FACTORIES = [
    ifAheadObstacle,
    ifSideChoice,
    ifOptionalBody,
    ifBehindChoice,
    ifTwoDecisions,
  ];

  function whileOneCorridor(random, serial) {
    const distance = 2 + randomInt(3, random);
    const turn = choose(["left", "right"], random);
    const actions = [...repeatAction("forward", distance), turn, "forward", "forward"];
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-one-corridor",
      variantId: distance + "-" + turn,
      actions,
      observations: observationsAlongForwardRun(0, distance, "blocked"),
      lines: [
        "    while whats(\"ahead\") == \"clear\":",
        "        forward()",
        "    " + turn + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function whileTwoCorridors(random, serial) {
    const firstDistance = 2 + randomInt(2, random);
    const secondDistance = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const secondStart = firstDistance + 1;
    const actions = [
      ...repeatAction("forward", firstDistance),
      turn,
      ...repeatAction("forward", secondDistance),
    ];
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-two-corridors",
      variantId: [firstDistance, secondDistance, turn].join("-"),
      actions,
      observations: [
        ...observationsAlongForwardRun(0, firstDistance, "blocked"),
        ...observationsAlongForwardRun(secondStart, secondDistance, "blocked"),
      ],
      lines: [
        "    while whats(\"ahead\") == \"clear\":",
        "        forward()",
        "    " + turn + "()",
        "    while whats(\"ahead\") == \"clear\":",
        "        forward()",
      ],
    });
  }

  function whileCountUp(random, serial) {
    const distance = 2 + randomInt(3, random);
    const turn = choose(["left", "right"], random);
    const actions = [...repeatAction("forward", distance), turn, "forward", "forward"];
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-count-up",
      variantId: distance + "-" + turn,
      actions,
      observations: [{ step: distance, direction: "ahead", value: "clear" }],
      lines: [
        "    steps = 0",
        "    while steps < " + distance + ":",
        "        forward()",
        "        steps += 1",
        "    " + turn + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function whileCountDown(random, serial) {
    const distance = 2 + randomInt(3, random);
    const turn = choose(["left", "right"], random);
    const actions = [...repeatAction("forward", distance), turn, "forward", "forward"];
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-count-down",
      variantId: distance + "-" + turn,
      actions,
      observations: [{ step: distance, direction: "ahead", value: "clear" }],
      lines: [
        "    steps_left = " + distance,
        "    while steps_left > 0:",
        "        forward()",
        "        steps_left -= 1",
        "    " + turn + "()",
        "    forward()",
        "    forward()",
      ],
    });
  }

  function whileRepeatedCorner(random, serial) {
    const repetitions = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const actions = [];
    for (let index = 0; index < repetitions; index += 1) {
      actions.push("forward", turn);
    }
    actions.push("forward");
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-repeated-corner",
      variantId: repetitions + "-" + turn,
      actions,
      observations: [],
      lines: [
        "    turns = 0",
        "    while turns < " + repetitions + ":",
        "        forward()",
        "        " + turn + "()",
        "        turns += 1",
        "    forward()",
      ],
    });
  }

  function whileShortAndLong(random, serial) {
    const secondDistance = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const secondStart = 3;
    const actions = ["forward", "forward", turn, ...repeatAction("forward", secondDistance)];
    return buildReadFromSpec("while", random, serial, {
      templateId: "while-short-and-long",
      variantId: secondDistance + "-" + turn,
      actions,
      observations: [
        { step: 2, direction: "ahead", value: "clear" },
        ...observationsAlongForwardRun(secondStart, secondDistance, "blocked"),
      ],
      lines: [
        "    steps = 0",
        "    while steps < 2:",
        "        forward()",
        "        steps += 1",
        "    " + turn + "()",
        "    while whats(\"ahead\") == \"clear\":",
        "        forward()",
      ],
    });
  }

  const WHILE_TEMPLATE_FACTORIES = [
    whileOneCorridor,
    whileTwoCorridors,
    whileCountUp,
    whileCountDown,
    whileRepeatedCorner,
    whileShortAndLong,
  ];

  function buildReadFromSpec(difficultyId, random, serial, spec) {
    const candidates = [];

    for (const placement of shuffled(routePlacements(spec.actions), random)) {
      const requirements = new Map();
      const resolvedObservations = [];
      let valid = true;

      for (const observation of spec.observations || []) {
        const state = placement.states[observation.step];
        if (!state || !["ahead", "left", "right", "behind"].includes(observation.direction)) {
          valid = false;
          break;
        }

        const target = relativeTarget(state, observation.direction);
        let value = observation.value;
        if (value === "blocked") value = inBounds(target.row, target.column) ? "obstacle" : "wall";

        if (value === "wall") {
          if (inBounds(target.row, target.column)) {
            valid = false;
            break;
          }
        } else if (value === "clear" || value === "obstacle") {
          if (!inBounds(target.row, target.column)) {
            valid = false;
            break;
          }
          const key = cellKey(target.row, target.column);
          const existing = requirements.get(key);
          if ((existing && existing.value !== value)
            || (value === "obstacle" && placement.visited.has(key))) {
            valid = false;
            break;
          }
          requirements.set(key, { value, row: target.row, column: target.column });
        } else {
          valid = false;
          break;
        }

        resolvedObservations.push({
          step: observation.step,
          direction: observation.direction,
          value,
          row: target.row,
          column: target.column,
        });
      }

      if (!valid) continue;
      candidates.push({ placement, requirements, resolvedObservations });
    }

    if (!candidates.length) {
      throw new Error("Could not place the " + difficultyId + " template: " + spec.templateId);
    }

    const selected = choose(candidates, random);
    const reserved = new Set(selected.placement.visited);
    const obstacles = [];
    for (const [key, requirement] of selected.requirements) {
      reserved.add(key);
      if (requirement.value === "obstacle") {
        obstacles.push([requirement.row, requirement.column]);
      }
    }

    const fillerCount = Number.isInteger(spec.fillerCount)
      ? spec.fillerCount
      : 1 + randomInt(3, random);
    obstacles.push(...addFillerObstacles(reserved, fillerCount, random));

    return makeLevel(
      difficultyId,
      program(spec.lines),
      makeScenario(selected.placement.start, obstacles),
      serial,
      {
        previewActions: [...spec.actions],
        templateId: spec.templateId,
        variantId: spec.variantId || "default",
        resolvedObservations: selected.resolvedObservations,
      }
    );
  }

  function observationsAlongForwardRun(startStep, distance, finalValue = null) {
    const observations = [];
    for (let offset = 0; offset < distance; offset += 1) {
      observations.push({ step: startStep + offset, direction: "ahead", value: "clear" });
    }
    if (finalValue) {
      observations.push({ step: startStep + distance, direction: "ahead", value: finalValue });
    }
    return observations;
  }

  function mixedEdgePatrol(random, serial) {
    const sensorSide = choose(["left", "right"], random);
    const otherSide = sensorSide === "left" ? "right" : "left";
    const actions = [
      ...repeatAction("forward", 4),
      sensorSide,
      ...repeatAction("forward", 4),
      otherSide,
    ];
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "edge-patrol",
      variantId: sensorSide,
      actions,
      observations: [
        ...observationsAlongForwardRun(0, 4, "wall"),
        { step: 4, direction: sensorSide, value: "clear" },
        ...observationsAlongForwardRun(5, 4, "wall"),
        { step: 9, direction: sensorSide, value: "obstacle" },
      ],
      lines: [
        "    for section in range(2):",
        "        while whats(\"ahead\") == \"clear\":",
        "            forward()",
        "        if whats(\"" + sensorSide + "\") == \"clear\":",
        "            " + sensorSide + "()",
        "        else:",
        "            " + otherSide + "()",
      ],
    });
  }

  function mixedForWithChoices(random, serial) {
    const outcomes = choose([
      ["clear", "blocked", "clear"],
      ["blocked", "clear", "blocked"],
      ["clear", "clear", "blocked"],
      ["blocked", "blocked", "clear"],
    ], random);
    const actions = [];
    const observations = [];
    outcomes.forEach((outcome) => {
      observations.push({ step: actions.length, direction: "ahead", value: outcome });
      actions.push(outcome === "blocked" ? "right" : "left", "forward");
    });
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "for-choices",
      variantId: outcomes.join("-"),
      actions,
      observations,
      lines: [
        "    for corner in range(3):",
        "        if whats(\"ahead\") in (\"wall\", \"obstacle\"):",
        "            right()",
        "        else:",
        "            left()",
        "        forward()",
      ],
    });
  }

  function mixedCounterAnd(random, serial) {
    const turn = choose(["left", "right"], random);
    const distance = 2 + randomInt(2, random);
    const stopsOnSensor = randomInt(2, random) === 0;
    const limit = stopsOnSensor ? distance + 2 : distance;
    const observations = observationsAlongForwardRun(
      0,
      distance,
      stopsOnSensor ? "blocked" : "clear"
    );
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "counter-and",
      variantId: stopsOnSensor ? "sensor-stops" : "counter-stops",
      actions: [...repeatAction("forward", distance), turn, "forward"],
      observations,
      lines: [
        "    steps = 0",
        "    while steps < " + limit + " and whats(\"ahead\") == \"clear\":",
        "        forward()",
        "        steps += 1",
        "    " + turn + "()",
        "    forward()",
      ],
    });
  }

  function mixedMinimumOr(random, serial) {
    const turn = choose(["left", "right"], random);
    const minimum = 1 + randomInt(2, random);
    const distance = minimum + 1 + randomInt(2, random);
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "minimum-or",
      variantId: "minimum-" + minimum + "-distance-" + distance,
      actions: [...repeatAction("forward", distance), turn, "forward"],
      observations: [
        ...observationsAlongForwardRun(minimum, distance - minimum, "blocked"),
      ],
      lines: [
        "    steps = 0",
        "    while steps < " + minimum + " or whats(\"ahead\") == \"clear\":",
        "        forward()",
        "        steps += 1",
        "    " + turn + "()",
        "    forward()",
      ],
    });
  }

  function mixedEveryBranch(random, serial) {
    const obstacleTurn = choose(["left", "right"], random);
    const wallSide = obstacleTurn;
    const wallTurn = obstacleTurn === "left" ? "right" : "left";
    const outcomes = shuffled(["obstacle", "wall", "clear"], random);
    const actions = [];
    const observations = [];

    outcomes.forEach((outcome) => {
      const step = actions.length;
      if (outcome === "obstacle") {
        observations.push({ step, direction: "ahead", value: "obstacle" });
        actions.push(obstacleTurn);
      } else if (outcome === "wall") {
        observations.push(
          { step, direction: "ahead", value: "clear" },
          { step, direction: wallSide, value: "wall" }
        );
        actions.push(wallTurn);
      } else {
        observations.push(
          { step, direction: "ahead", value: "clear" },
          { step, direction: wallSide, value: "clear" }
        );
      }
      actions.push("forward");
    });

    return buildReadFromSpec("mixed", random, serial, {
      templateId: "every-branch",
      variantId: outcomes.join("-"),
      actions,
      observations,
      lines: [
        "    for check in range(3):",
        "        if whats(\"ahead\") == \"obstacle\":",
        "            " + obstacleTurn + "()",
        "        elif whats(\"" + wallSide + "\") == \"wall\":",
        "            " + wallTurn + "()",
        "        else:",
        "            print(\"Straight ahead\")",
        "        forward()",
      ],
    });
  }

  function mixedGrowingLoops(random, serial) {
    const firstDistance = 1 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const actions = [
      ...repeatAction("forward", firstDistance),
      turn,
      ...repeatAction("forward", firstDistance + 1),
      turn,
    ];
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "growing-loops",
      variantId: "starts-" + firstDistance + "-" + turn,
      actions,
      observations: [],
      lines: [
        "    distance = " + firstDistance,
        "    for side in range(2):",
        "        for step in range(distance):",
        "            forward()",
        "        distance += 1",
        "        " + turn + "()",
      ],
    });
  }

  function mixedGuardedBreak(random, serial) {
    const distance = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "guarded-break",
      variantId: turn + "-after-" + distance,
      actions: [...repeatAction("forward", distance), turn, "forward"],
      observations: observationsAlongForwardRun(0, distance, "blocked"),
      lines: [
        "    while True:",
        "        if whats(\"ahead\") in (\"wall\", \"obstacle\"):",
        "            " + turn + "()",
        "            break",
        "        forward()",
        "    forward()",
      ],
    });
  }

  // This task focuses on stored sensor answers; extra route loops belong to the other mixed families.
  function mixedStoredSensors(random, serial) {
    const branch = choose(["if", "elif", "else"], random);
    const observations = [];
    let actions;

    if (branch === "if") {
      observations.push(
        { step: 0, direction: "ahead", value: "clear" },
        { step: 0, direction: "left", value: "clear" },
        { step: 0, direction: "right", value: "clear" },
        { step: 0, direction: "behind", value: "clear" }
      );
      actions = ["forward", "forward"];
    } else if (branch === "elif") {
      observations.push(
        { step: 0, direction: "ahead", value: "obstacle" },
        { step: 0, direction: "left", value: "clear" },
        { step: 0, direction: "right", value: "clear" },
        { step: 0, direction: "behind", value: "clear" }
      );
      actions = ["right", "forward"];
    } else {
      observations.push(
        { step: 0, direction: "ahead", value: "obstacle" },
        { step: 0, direction: "left", value: "clear" },
        { step: 0, direction: "right", value: "obstacle" },
        { step: 0, direction: "behind", value: "clear" }
      );
      actions = ["left", "forward"];
    }

    return buildReadFromSpec("mixed", random, serial, {
      templateId: "stored-sensors",
      variantId: branch + "-branch",
      actions,
      observations,
      lines: [
        "    ahead = whats(\"ahead\") == \"clear\"",
        "    left_side = whats(\"left\") != \"obstacle\"",
        "    right_side = whats(\"right\") == \"clear\"",
        "    if ahead and left_side:",
        "        forward()",
        "    elif right_side or whats(\"behind\") == \"wall\":",
        "        right()",
        "    else:",
        "        left()",
        "    forward()",
      ],
    });
  }

  function mixedBooleanFlag(random, serial) {
    const distance = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "boolean-flag",
      variantId: turn + "-after-" + distance,
      actions: [...repeatAction("forward", distance), turn, "forward"],
      observations: observationsAlongForwardRun(0, distance, "blocked"),
      lines: [
        "    exploring = True",
        "    while exploring:",
        "        if whats(\"ahead\") in (\"wall\", \"obstacle\"):",
        "            exploring = False",
        "        else:",
        "            forward()",
        "    " + turn + "()",
        "    forward()",
      ],
    });
  }

  function mixedBoundedNested(random, serial) {
    const turn = choose(["left", "right"], random);
    const otherTurn = turn === "left" ? "right" : "left";
    const distance = 2;
    const actions = [
      ...repeatAction("forward", distance),
      turn,
      ...repeatAction("forward", distance),
      otherTurn,
    ];
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "bounded-nested",
      variantId: turn,
      actions,
      observations: [
        { step: distance, direction: "ahead", value: "wall" },
        { step: distance * 2 + 1, direction: "ahead", value: "obstacle" },
      ],
      lines: [
        "    for corridor in range(2):",
        "        steps = 0",
        "        while steps < " + distance + ":",
        "            forward()",
        "            steps += 1",
        "        if whats(\"ahead\") == \"wall\":",
        "            " + turn + "()",
        "        else:",
        "            " + otherTurn + "()",
      ],
    });
  }

  function mixedNestedCorridors(random, serial) {
    const firstDistance = 2 + randomInt(2, random);
    const secondDistance = 2 + randomInt(2, random);
    const turn = choose(["left", "right"], random);
    const secondStart = firstDistance + 1;
    const actions = [
      ...repeatAction("forward", firstDistance),
      turn,
      ...repeatAction("forward", secondDistance),
      turn,
    ];
    return buildReadFromSpec("mixed", random, serial, {
      templateId: "nested-corridors",
      variantId: firstDistance + "-" + secondDistance + "-" + turn,
      actions,
      observations: [
        ...observationsAlongForwardRun(0, firstDistance, "blocked"),
        ...observationsAlongForwardRun(secondStart, secondDistance, "blocked"),
      ],
      lines: [
        "    corridors = 0",
        "    while corridors < 2:",
        "        while whats(\"ahead\") == \"clear\":",
        "            forward()",
        "        " + turn + "()",
        "        corridors += 1",
      ],
    });
  }

  const MIXED_TEMPLATE_FACTORIES = [
    mixedEdgePatrol,
    mixedForWithChoices,
    mixedCounterAnd,
    mixedMinimumOr,
    mixedEveryBranch,
    mixedGrowingLoops,
    mixedGuardedBreak,
    mixedStoredSensors,
    mixedBooleanFlag,
    mixedBoundedNested,
    mixedNestedCorridors,
  ];

  const TEMPLATE_FACTORIES = Object.freeze({
    actions: ACTION_TEMPLATE_FACTORIES,
    for: FOR_TEMPLATE_FACTORIES,
    if: IF_TEMPLATE_FACTORIES,
    while: WHILE_TEMPLATE_FACTORIES,
    mixed: MIXED_TEMPLATE_FACTORIES,
  });

  function generate(difficultyId = "actions", random = defaultRandom) {
    const safeDifficulty = DIFFICULTY_IDS.has(difficultyId) ? difficultyId : "actions";
    const safeRandom = typeof random === "function" ? random : defaultRandom;
    const serial = String(randomInt(1000000000, safeRandom)).padStart(9, "0");
    return generateFromFactories(safeDifficulty, safeRandom, serial, TEMPLATE_FACTORIES[safeDifficulty]);
  }

  return Object.freeze({
    DIFFICULTIES,
    generate,
    // Counterparts share the authored templates without reading or changing
    // the native Read mode's previous-template history.
    generateIsolated(difficultyId, random, options = {}) {
      return createForLocale(LOCALE, options).generate(difficultyId, random);
    },
  });
  }
  global.PipReadTutorialLocales = { en: createForLocale("en"), hu: createForLocale("hu") };
  global.PipReadTutorial = global.PipReadTutorialLocales[global.PipLocale === "hu" ? "hu" : "en"];
})(window);
