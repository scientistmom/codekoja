// Lesson files contain data only. Validate them before installing a course.
(function (global) {
  "use strict";
  const lessons = new Map();
  const registrationErrors = [];
  const kinds = ["watch", "predict", "complete", "create"];
  const toolNames = ["for", "if", "while", "def", "call", "whats", "variable", "update", "print", "parameter", "return", "elif", "else", "in", "and", "or", "not", "nested", "flag", "break"];
  function validate(lesson) {
    const fail = (path, message) => { throw new Error(`Lesson ${lesson?.id || "(unnamed)"}: ${path} ${message}`); };
    const pair = (value, path) => {
      if (!Array.isArray(value) || value.length !== 2 || value.some(text => typeof text !== "string" || !text.trim())) fail(path, "must contain [English, Hungarian] text");
    };
    const ranges = (items, path) => {
      if (!Array.isArray(items)) fail(path, "must be an array of code ranges");
      for (const range of items) {
        if (!Array.isArray(range) || range.length < 1 || range.length > 4 || range.some(n => n !== null && (!Number.isInteger(n) || n < 1)) || range[0] == null || (range[1] != null && range[1] < range[0])) fail(path, "contains an invalid [firstLine, lastLine, firstColumn, lastColumn] range");
      }
    };
    if (lesson?.schemaVersion !== 1) fail("schemaVersion", "must be 1");
    if (typeof lesson.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(lesson.id)) fail("id", "must be a stable lowercase identifier");
    pair(lesson.label, "label"); pair(lesson.title, "title");
    pair(lesson.summary?.idea, "summary.idea");
    if (lesson.summary.blocksIdea != null) pair(lesson.summary.blocksIdea, "summary.blocksIdea");
    if (!Array.isArray(lesson.summary?.vocabulary) || lesson.summary.vocabulary.some(x => typeof x !== "string")) fail("summary.vocabulary", "must be a list of code terms");
    if (!Array.isArray(lesson.tools) || lesson.tools.some(x => !toolNames.includes(x))) fail("tools", "contains an unknown code tool");
    if (!["actions", "for", "if", "while", "mixed"].includes(lesson.practice?.read) || !["easy", "medium", "hard", "mastery"].includes(lesson.practice?.write)) fail("practice", "must select existing Read and Write difficulty IDs");
    if (!Array.isArray(lesson.stages) || lesson.stages.length !== 4 || new Set(lesson.stages.map(s => s.kind)).size !== 4 || lesson.stages.some(s => !kinds.includes(s.kind))) fail("stages", "must contain exactly one watch, complete, predict, and create activity");
    for (const stage of lesson.stages) {
      const path = `stages.${stage.kind}`;
      if (!(typeof stage.program === "string" || Array.isArray(stage.program) && stage.program.every(line => typeof line === "string"))) fail(`${path}.program`, "must be Python text or an array of Python lines");
      if (["complete", "create"].includes(stage.kind) !== (stage.editable === true)) fail(`${path}.editable`, "must be true only for complete/create");
      if (stage.revision != null && (!Number.isInteger(stage.revision) || stage.revision < 1)) fail(path + ".revision", "must be a positive integer");
      // Legacy authored comments translate only if already present in a saved
      // draft; they are never inserted into a new independent-writing starter.
      if (stage.commentTranslations != null) {
        if (stage.kind !== "create" || !Array.isArray(stage.commentTranslations) || stage.commentTranslations.length > 2) fail(path + ".commentTranslations", "supports at most two legacy bilingual comments on a create task");
        for (const comment of stage.commentTranslations) {
          pair(comment, path + ".commentTranslations");
          if (comment.some(text => !text.startsWith("# ") || /[\r\n]/.test(text))) fail(path + ".commentTranslations", "must be whole-line comments");
        }
      }
      const board = stage.scenario;
      if (board?.width !== 5 || board?.height !== 5) fail(`${path}.scenario`, "must use the standard 5 × 5 Koja board");
      const inside = point => point && Number.isInteger(point.row) && Number.isInteger(point.column) && point.row >= 0 && point.row < board.height && point.column >= 0 && point.column < board.width;
      if (!inside(board.start) || !["up", "right", "down", "left"].includes(board.start.direction)) fail(`${path}.scenario.start`, "must be on the board with a valid facing direction");
      if (board.goal !== null && !inside(board.goal)) fail(`${path}.scenario.goal`, "must be null or a square on the board");
      if (["watch", "predict"].includes(stage.kind) && board.goal !== null) fail(`${path}.scenario.goal`, "must be null for demonstration/reading activities");
      if (stage.editable && board.goal === null) fail(`${path}.scenario.goal`, "is required for a writing activity");
      if (!Array.isArray(board.obstacles) || board.obstacles.some(p => !Array.isArray(p) || p.length !== 2 || !inside({row: p[0], column: p[1]}))) fail(`${path}.scenario.obstacles`, "must contain [row, column] pairs on the board");
      const occupied = new Set(board.obstacles.map(p => p.join(",")));
      if (occupied.size !== board.obstacles.length || occupied.has(`${board.start.row},${board.start.column}`) || board.goal && occupied.has(`${board.goal.row},${board.goal.column}`)) fail(`${path}.scenario.obstacles`, "must not overlap Koja, the goal, or another obstacle");
      if (board.coins != null) {
        if (!Array.isArray(board.coins) || board.coins.some(p => !Array.isArray(p) || p.length !== 2 || !inside({row:p[0], column:p[1]}))) fail(path + ".scenario.coins", "must contain [row, column] pairs on the board");
        const keys = board.coins.map(p => p.join(","));
        if (new Set(keys).size !== keys.length || keys.some(key => occupied.has(key) || key === board.start.row + "," + board.start.column || board.goal && key === board.goal.row + "," + board.goal.column)) fail(path + ".scenario.coins", "must not overlap another coin, obstacle, start or goal");
      }
      // Historical reward coordinates need not be empty floor anymore.
      // They are restore-only metadata, never active collection targets.
      if (stage.legacyCoins != null) {
        if (!Array.isArray(stage.legacyCoins) || stage.legacyCoins.some(p => !Array.isArray(p) || p.length !== 2 || !inside({ row: p[0], column: p[1] }))) fail(path + ".legacyCoins", "must contain [row, column] pairs on the board");
        const keys = stage.legacyCoins.map(p => p.join(","));
        if (new Set(keys).size !== keys.length) fail(path + ".legacyCoins", "must not repeat a historical coin square");
      }
      if (stage.solutions && (!Array.isArray(stage.solutions) || stage.solutions.some(code => !(typeof code === "string" || Array.isArray(code) && code.every(line => typeof line === "string"))))) fail(`${path}.solutions`, "must contain Python strings");
      if (stage.editSelection) {
        if (stage.kind !== "complete") fail(`${path}.editSelection`, "is only supported for completion activities");
        const lineCount = (Array.isArray(stage.program) ? stage.program : stage.program.split("\n")).length;
        for (const language of ["en", "hu"]) {
          const range = stage.editSelection[language];
          if (!Array.isArray(range) || range.length !== 3 || range.some(value => !Number.isInteger(value) || value < 1)
            || range[0] > lineCount || range[2] < range[1]) fail(`${path}.editSelection.${language}`, "must be [line, firstColumn, endColumn] within the completion code");
        }
      }
      if (stage.focus) {
        for (const language of ["en", "hu"]) {
          const spec = stage.focus[language];
          if (!spec) fail(`${path}.focus.${language}`, "is required when focus is provided");
          ranges(spec.preview, `${path}.focus.${language}.preview`);
        }
      }
    }
    if (lesson.observation && (lesson.observation.direction !== "ahead" || !["start", "before"].includes(lesson.observation.from))) fail("observation", "must highlight ahead from start or before");
    return lesson;
  }
  function register(definition) {
    try {
      validate(definition);
      if (lessons.has(definition.id)) throw new Error(`Duplicate lesson ID: ${definition.id}`);
      lessons.set(definition.id, definition);
    } catch (error) {
      registrationErrors.push(error);
      throw error;
    }
  }
  function ordered(manifest) {
    if (registrationErrors.length) throw registrationErrors[0];
    if (!Array.isArray(manifest) || !manifest.length) throw new Error("The lesson manifest must not be empty");
    if (new Set(manifest.map(item => item.id)).size !== manifest.length) throw new Error("Duplicate lesson ID in manifest");
    return manifest.map(item => {
      const lesson = lessons.get(item.id);
      if (!lesson) throw new Error(`Missing lesson ${item.id} (${item.file})`);
      return lesson;
    });
  }
  global.PipLessonRegistry = Object.freeze({ register, validate, ordered });
})(window);
