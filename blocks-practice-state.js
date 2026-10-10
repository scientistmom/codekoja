// Practice checkpoints follow their canonical generator and keep earned coins
// when an obsolete generated task is retired.
(function (global) {
  "use strict";
  const modes = ["read", "build"];
  const copy = value => JSON.parse(JSON.stringify(value));
  function restore(raw) {
    const practice = global.PipBlocksPractice, version = practice.VERSION;
    const state = { generatorVersion: version, mode: ["course", ...modes].includes(raw?.mode) ? raw.mode : "course", difficulties: {}, sessions: {}, earned: 0 };
    state.earned = Number.isSafeInteger(raw?.earned) ? Math.max(0, Math.min(1000000, raw.earned)) : 0;
    if (raw?.retired && typeof raw.retired === "object") state.retired = copy(raw.retired);
    const changed = raw && raw.generatorVersion !== version;
    if (changed && raw.sessions && Object.keys(raw.sessions).length) {
      state.retired ||= {};
      const key = "generator" + (Number.isInteger(raw.generatorVersion) ? raw.generatorVersion : "Legacy");
      if (!state.retired[key]) {
        const { retired, ...checkpoint } = raw;
        state.retired[key] = copy(checkpoint);
      }
    }
    for (const mode of modes) {
      const tiers = practice.difficultiesFor(mode).map(level => level.id);
      state.difficulties[mode] = tiers.includes(raw?.difficulties?.[mode]) ? raw.difficulties[mode] : tiers[0];
      if (changed) continue;
      for (const tier of tiers) {
        const key = mode + ":" + tier, saved = raw?.sessions?.[key];
        if (!Number.isInteger(saved?.seed) || saved.seed < 0 || saved.seed > 4294967295) continue;
        const available = new Set(practice.types(tier, mode));
        state.sessions[key] = {
          seed: saved.seed, solved: saved.solved === true, revealed: saved.revealed === true,
          draft: Array.isArray(saved.draft) ? saved.draft.filter(type => typeof type === "string" && global.PipBlocksScope.definition(type) && available.has(type)).slice(0, 160) : [],
          actions: Array.isArray(saved.actions) ? saved.actions.filter(action => ["forward", "left", "right"].includes(action)).slice(0, 1000) : [],
        };
      }
    }
    return state;
  }
  function fresh(seed) { return { seed: seed >>> 0, solved: false, revealed: false, draft: [], actions: [] }; }
  function award(state, session) {
    if (session.solved || session.revealed) return 0;
    session.solved = true; state.earned += 1; return 1;
  }
  global.PipBlocksPracticeState = Object.freeze({ restore, fresh, award });
})(typeof window !== "undefined" ? window : globalThis);
