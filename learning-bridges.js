// Directional concept checks reuse authored, goal-free course demonstrations.
// They are assessments inside Hybrid, never new lessons or course completions.
(function (global) {
  "use strict";
  const ASSESSMENT_VERSION = 1;
  const topics = ["commands", "for", "if", "while", "nested-for"];
  const tiers = { commands: "commands", for: "loops", if: "choices", while: "while", "nested-for": "loops" };
  const clone = value => JSON.parse(JSON.stringify(value));
  function valid(config) {
    return config && ["blocks", "python"].includes(config.from) && ["blocks", "python"].includes(config.to)
      && config.from !== config.to && topics.includes(config.topic);
  }
  function key(config) { return valid(config) ? `${config.from}:${config.to}:${config.topic}` : null; }
  function sourceComplete(config, snapshots) {
    if (!valid(config)) return false;
    const chapter = snapshots?.[config.from]?.chapters?.find(item => item.id === config.topic);
    return Number.isInteger(chapter?.total) && chapter.total >= 4
      && Number.isInteger(chapter.completed) && chapter.completed >= chapter.total;
  }
  function create(config) {
    if (!valid(config)) return null;
    const original = global.PipBlocksLessons?.find(lesson => lesson.sourceStageId === config.topic + "-watch");
    if (!original || original.scenario.goal !== null || original.scenario.width !== 5 || original.scenario.height !== 5) return null;
    const metadata = { from: config.from, to: config.to, topic: config.topic,
      taskId: `bridge:${key(config)}:v${ASSESSMENT_VERSION}`, assessmentVersion: ASSESSMENT_VERSION };
    return { ...metadata, direction: config.to === "python" ? "to-python" : "to-blocks",
      task: { id: metadata.taskId, difficulty: tiers[config.topic], solution: clone(original.solution),
        scenario: clone(original.scenario), inventory: [...original.inventory, "END"],
        title: clone(original.chapterLabel), source: { code: original.referenceCode, locale: "en",
          lineMap: clone(original.lineMap) } } };
  }
  function assess(bridge, answer) {
    if (!valid(bridge) || bridge.assessmentVersion !== ASSESSMENT_VERSION) return { ok: false, reason: "unsupported" };
    const scope = global.PipBlocksScope, converter = global.PipBlocksPython, model = global.PipHybridEngine;
    let sequence;
    if (bridge.to === "python") {
      if (typeof answer?.code !== "string") return { ok: false, reason: "unsupported" };
      let code = answer.code;
      try {
        if (answer.locale === "hu") code = global.PipCodeTranslation.translate(code, "hu", "en").code;
      } catch { return { ok: false, reason: "unsupported" }; }
      const translated = converter.translate(code, { allowPresentation: true });
      if (!translated.ok) return { ok: false, reason: "unsupported" };
      sequence = translated.cards;
    } else sequence = answer?.blocks;
    if (!Array.isArray(sequence) || sequence.some(type => !bridge.task.inventory.includes(typeof type === "string" ? type : type?.type)))
      return { ok: false, reason: "unsupported" };
    const result = scope.execute(sequence, bridge.task.scenario, { maxOperations: 8000, maxEvents: 160 });
    if (!result.ok) return { ok: false, reason: "unsupported" };
    // The canonical converter and real interpreter must agree; no comments or
    // unexecuted token can stand in for the concept in the learner's answer.
    if (Array.isArray(answer?.events) && !model.compare(result.events, answer.events).ok) return { ok: false, reason: "unsupported" };
    if (!global.PipBlocksCourseGoals.check({ kind: "create", sourceChapterId: bridge.topic }, sequence, result.events))
      return { ok: false, reason: "missing-concept" };
    const expected = scope.execute(bridge.task.solution, bridge.task.scenario);
    if (!model.compare(expected.events, result.events).ok) return { ok: false, reason: "different" };
    return { ok: true };
  }
  global.PipLearningBridges = Object.freeze({ ASSESSMENT_VERSION, topics: Object.freeze(topics), valid, key, sourceComplete, create, assess });
})(typeof window !== "undefined" ? window : globalThis);
