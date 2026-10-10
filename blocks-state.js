// Canonical Python-counterpart checkpoints. Retired courses retain their coins,
// not completion credit on unrelated replacement lessons.
(function (global) {
  "use strict";
  const scope = global.PipBlocksScope;
  if (!scope) throw new Error("Load blocks-engine.js before blocks-state.js.");
  const VERSION = 3, CURRENT_SCORE_VERSION = 2;
  const copy = value => JSON.parse(JSON.stringify(value));
  const price = type => type.startsWith("FOR_") ? Number(type.slice(4)) : type.startsWith("WHILE_") ? 4 : type.startsWith("IF_") ? 3 : 1;
  const validCount = count => Number.isInteger(count) && count > 0 && count <= 160;
  const cellKey = cell => Array.isArray(cell) ? cell.join(",") : `${cell.row},${cell.column}`;

  // Migration-only accounting metadata, not runnable levels. Pars, allowed coins
  // and cumulative shop vocabulary match the retired independent Blocks course.
  const legacyLessons = [
    ["first-steps", 3, 3, "3,2 3,3", ["FORWARD"]],
    ["first-turn", 5, 5, "2,0 2,1", ["TURN_RIGHT"]],
    ["repeat-two", 7, 6, "4,2 3,2", ["FOR_2", "TURN_LEFT"]],
    ["repeat-three", 7, 6, "4,3 3,3", ["FOR_3"]],
    ["repeat-pattern", 6, 5, "3,1 3,2", []],
    ["nested-repeats", 6, 5, "4,1 4,3 3,3", []],
    ["if-wall", 6, 5, "0,0 0,2", ["FOR_4", "IF_WALL"]],
    ["if-obstacle", 6, 5, "4,1 2,1", ["IF_OBSTACLE"]],
    ["if-clear", 8, 8, "4,1 4,0 3,0", ["IF_CLEAR"]],
    ["if-goal", 8, 8, "4,2 2,2 2,1", ["IF_GOAL"]],
    ["while-clear", 8, 8, "1,0 1,2", ["WHILE_CLEAR"]],
    ["while-wall", 7, 7, "0,1 0,2 0,3", ["WHILE_WALL"]],
    ["while-obstacle", 7, 7, "3,2", ["WHILE_OBSTACLE"]],
    ["until-goal", 10, 10, "3,1 2,4", ["WHILE_NOT_GOAL"]],
    ["nested-choice", 13, 13, "3,0 4,2 4,3", []],
    ["round-trip", 11, 9, "0,0 0,4 4,4", []],
  ];
  function summary(count, par) {
    return { stars: count <= par ? 3 : count <= par + Math.max(1, Math.ceil(par * .25)) ? 2 : 1, earned: count < par ? 3 : count === par ? 2 : 1 };
  }
  function rewardOf(award, physicalPar, canonicalPar) {
    const scoreVersion = award.scoreVersion === CURRENT_SCORE_VERSION ? CURRENT_SCORE_VERSION : 1;
    const held = [1, CURRENT_SCORE_VERSION].includes(award.scoreVersion)
      && Number.isInteger(award.completionReward) && award.completionReward >= 1 && award.completionReward <= 3;
    return { scoreVersion, completionReward: held ? award.completionReward : summary(award.bestCount, scoreVersion === 1 ? physicalPar : canonicalPar).earned };
  }
  function legacyCredit(checkpoint) {
    const credit = { earned: 0, spent: 0 }, known = new Set();
    if (!checkpoint || typeof checkpoint !== "object") return credit;
    for (const [suffix, physical, canonical, coinList, additions] of legacyLessons) {
      additions.forEach(type => known.add(type));
      const id = "blocks-" + suffix, award = checkpoint.awards?.[id];
      if (validCount(award?.bestCount)) {
        const allowed = new Set(coinList.split(" "));
        const coins = new Set(Array.isArray(award.coins) ? award.coins.filter(key => allowed.has(key)) : []);
        credit.earned += rewardOf(award, physical, canonical).completionReward + coins.size;
      }
      const purchases = checkpoint.purchases?.[id];
      if (Array.isArray(purchases)) credit.spent += purchases.filter(type => known.has(type)).slice(0, 64).reduce((sum, type) => sum + price(type), 0);
    }
    return credit;
  }
  function restore(raw, lessons) {
    const state = { version: VERSION, index: 0, lessonId: lessons[0]?.id ?? null, chapterStages: {}, drafts: {}, purchases: {}, awards: {}, routes: {} };
    if (!raw || typeof raw !== "object") {
      if (lessons[0]?.sourceChapterId) state.chapterStages[lessons[0].sourceChapterId] = lessons[0].id;
      return state;
    }
    if (raw.retired && typeof raw.retired === "object") state.retired = copy(raw.retired);
    const legacyIDs = new Set(legacyLessons.map(([id]) => "blocks-" + id));
    const hasLegacy = [raw.awards, raw.drafts, raw.purchases].some(records => records && Object.keys(records).some(id => legacyIDs.has(id)));
    if ((hasLegacy || (raw.version !== VERSION && Object.hasOwn(raw, "index"))) && !state.retired?.independentCourse) {
      state.retired ||= {};
      // Preserve the old checkpoint verbatim for recovery. Never guess which
      // different, replacement lessons the child has completed.
      state.retired.independentCourse = copy(raw);
    }
    if (state.retired?.independentCourse) state.legacyCredit = legacyCredit(state.retired.independentCourse);
    const namedIndex = lessons.findIndex(lesson => lesson.id === raw.lessonId || (raw.sourceStageId && lesson.sourceStageId === raw.sourceStageId));
    if (namedIndex >= 0) state.index = namedIndex;
    else if (raw.version === VERSION && Number.isInteger(raw.index)) state.index = Math.max(0, Math.min(Math.max(0, lessons.length - 1), raw.index));
    state.lessonId = lessons[state.index]?.id ?? null;
    const remembered = raw.chapterStages && typeof raw.chapterStages === "object" && !Array.isArray(raw.chapterStages)
      ? raw.chapterStages : {};
    for (const lesson of lessons) {
      if (lesson.sourceChapterId && Object.hasOwn(remembered, lesson.sourceChapterId) && remembered[lesson.sourceChapterId] === lesson.id)
        state.chapterStages[lesson.sourceChapterId] = lesson.id;
      const allowed = new Set(lesson.inventory);
      // Every offered tile is reusable; a saved draft never consumes a copy.
      if (Array.isArray(raw.drafts?.[lesson.id])) state.drafts[lesson.id] = raw.drafts[lesson.id].slice(0, 160).filter(type =>
        allowed.has(type) || type === "END" || (type === "GAP" && lesson.kind === "complete"));
      if (lesson.kind === "predict" && Array.isArray(raw.routes?.[lesson.id])) state.routes[lesson.id] = raw.routes[lesson.id]
        .filter(action => ["forward", "left", "right"].includes(action)).slice(0, 1000);
      const award = raw.awards?.[lesson.id];
      if (lesson.kind === "watch") {
        if (award?.bestCount === 0 && award.completionReward === 0) state.awards[lesson.id] = {
          bestCount: 0, scoreVersion: CURRENT_SCORE_VERSION, completionReward: 0, coins: [],
        };
      } else if (validCount(award?.bestCount)) {
        const coins = new Set([...(lesson.scenario.coins || []), ...(lesson.legacyCoins || [])].map(cellKey));
        state.awards[lesson.id] = {
          bestCount: award.bestCount,
          ...rewardOf(award, lesson.solution.length, scope.scoreSize(lesson.solution)),
          coins: [...new Set(Array.isArray(award.coins) ? award.coins.filter(key => coins.has(key)) : [])],
        };
      }
    }
    const selected = lessons[state.index];
    if (selected?.sourceChapterId && !Object.hasOwn(state.chapterStages, selected.sourceChapterId))
      state.chapterStages[selected.sourceChapterId] = selected.id;
    return state;
  }

  // Chapter navigation remembers a phase without changing its independent
  // draft, reading route, completion reward or source lesson identity.
  function recommendedStage(state, chapterId, lessons) {
    const indexes = lessons.flatMap((lesson, index) => lesson.sourceChapterId === chapterId ? [index] : []);
    if (!indexes.length) return -1;
    if (Number.isInteger(state?.index) && indexes.includes(state.index)) return state.index;
    const remembered = state?.chapterStages && Object.hasOwn(state.chapterStages, chapterId) ? state.chapterStages[chapterId] : null;
    const saved = indexes.find(index => lessons[index].id === remembered);
    if (saved !== undefined) return saved;
    const unfinished = indexes.find(index => !Object.hasOwn(state?.awards || {}, lessons[index].id));
    return unfinished ?? indexes.find(index => lessons[index].kind === "watch") ?? indexes[0];
  }
  function earnings(state, lessons) {
    return (state.legacyCredit?.earned || 0) + lessons.reduce((total, lesson) => {
      const award = state.awards[lesson.id];
      return total + (award ? award.completionReward + award.coins.length : 0);
    }, 0);
  }
  function spending(state) { return (state.legacyCredit?.spent || 0) + Object.values(state.purchases).flat().reduce((sum, type) => sum + price(type), 0); }
  function award(state, lesson, count, coins) {
    if (lesson.kind === "watch") {
      state.awards[lesson.id] = { bestCount: 0, scoreVersion: CURRENT_SCORE_VERSION, completionReward: 0, coins: [] };
      return;
    }
    if (!validCount(count)) return;
    const previous = state.awards[lesson.id], allowed = new Set((lesson.scenario.coins || []).map(cellKey));
    // Historical coins preserve earlier earnings only. A fresh run cannot
    // claim a square that is no longer a coin on this board.
    const banked = new Set([...allowed, ...(lesson.legacyCoins || []).map(cellKey)]);
    const earned = summary(count, scope.scoreSize(lesson.solution)).earned;
    state.awards[lesson.id] = {
      bestCount: previous?.scoreVersion === CURRENT_SCORE_VERSION ? Math.min(previous.bestCount, count) : count,
      scoreVersion: CURRENT_SCORE_VERSION,
      completionReward: Math.max(previous?.completionReward ?? 0, earned),
      coins: [...new Set([...(previous?.coins || []).filter(key => banked.has(key)), ...(coins || []).filter(key => allowed.has(key))])],
    };
  }
  global.PipBlocksState = Object.freeze({ restore, recommendedStage, summary, earnings, spending, award });
})(window);
