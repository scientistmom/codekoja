// Translation practice compares what programs do, never their spelling.
(function (global) {
  "use strict";
  const ACTIONS = new Set(["forward", "left", "right", "obstacle"]);
  function actions(events) {
    return (Array.isArray(events) ? events : []).filter(event => ACTIONS.has(event?.type));
  }
  function compare(expectedEvents, actualEvents) {
    const expected = actions(expectedEvents), actual = actions(actualEvents);
    const count = Math.max(expected.length, actual.length);
    for (let index = 0; index < count; index++) {
      const wanted = expected[index], received = actual[index];
      if (!wanted || !received || ["type", "row", "column", "direction"].some(key => wanted[key] !== received[key])) {
        return { ok: false, index, expected: wanted || null, actual: received || null,
          reason: !wanted ? "extra" : !received ? "missing" : "different" };
      }
    }
    return { ok: true, count: expected.length };
  }
  function sourceCode(task, locale = "en") {
    if (typeof task.source?.code !== "string") throw new Error("Hybrid requires a canonical Python source.");
    const from = task.source.locale || "en";
    return from === locale ? task.source.code : global.PipCodeTranslation.translate(task.source.code, from, locale).code;
  }
  function taskKey(seed, difficulty) { return `${difficulty}:${Number(seed) >>> 0}`; }
  function restore(raw, difficulties) {
    const ids = difficulties.map(item => item.id);
    const difficulty = ids.includes(raw?.difficulty) ? raw.difficulty : ids[0];
    const version = global.PipBlocksPractice?.VERSION || 1;
    const changed = raw && ((raw.difficulty != null && !ids.includes(raw.difficulty))
      || (raw.generatorVersion != null ? raw.generatorVersion !== version : Boolean((typeof raw.code === "string" && raw.code.trim()) || raw.blocks?.length)));
    const available = global.PipBlocksPractice?.types(difficulty, "read");
    // Retiring Mixed must not remove coins already earned with its old tasks.
    const earnedIDs = new Set([...ids, "commands", "loops", "choices", "while", "mixed"]);
    const retired = raw?.retired && typeof raw.retired === "object" ? JSON.parse(JSON.stringify(raw.retired)) : {};
    if (changed) {
      const key = "generator" + (Number.isInteger(raw.generatorVersion) ? raw.generatorVersion : "Legacy");
      if (!retired[key]) {
        const { retired: previousArchives, ...checkpoint } = raw;
        retired[key] = JSON.parse(JSON.stringify(checkpoint));
      }
    }
    const tiles = Array.isArray(raw?.blocks) ? raw.blocks.filter(type => typeof type === "string"
      && global.PipBlocksScope.definition(type) && (!available || available.includes(type))).slice(0, 160) : [];
    return {
      ...(Object.keys(retired).length ? { retired } : {}),
      generatorVersion: version, seed: !changed && Number.isInteger(raw?.seed) && raw.seed >= 0 && raw.seed <= 4294967295 ? raw.seed : null,
      difficulty, direction: raw?.direction === "to-blocks" ? "to-blocks" : "to-python",
      code: !changed && typeof raw?.code === "string" ? raw.code.slice(0, 50000) : "",
      codeLocale: raw?.codeLocale === "hu" ? "hu" : "en", blocks: changed ? [] : tiles,
      earned: [...new Set((Array.isArray(raw?.earned) ? raw.earned : []).filter(value =>
        typeof value === "string" && /^.+:\d+$/.test(value) && earnedIDs.has(value.split(":")[0])
        && Number(value.split(":")[1]) <= 4294967295))],
    };
  }
  function award(state) {
    const key = taskKey(state.seed, state.difficulty);
    if (state.earned.includes(key)) return 0;
    state.earned.push(key);
    return 1;
  }
  global.PipHybridEngine = Object.freeze({ actions, compare, sourceCode, restore, award });
})(typeof window !== "undefined" ? window : globalThis);
