// Course-only learning goals. A successful route must also use the concept
// taught by the source chapter; practice remains open-ended.
(function (global) {
  "use strict";

  const actionCards = { forward: "FORWARD", left: "TURN_LEFT", right: "TURN_RIGHT" };
  const concepts = new Set(["for", "if", "while", "nested-for"]);
  const typeOf = card => typeof card === "string" ? card : card?.type;
  function conceptOf(lesson) {
    if (!["complete", "create"].includes(lesson?.kind)) return null;
    const concept = lesson.sourceChapterId;
    return concepts.has(concept) ? concept : null;
  }

  function instruction(lesson, locale = "en") {
    const concept = conceptOf(lesson);
    if (!concept) return "";
    if (locale === "hu") {
      const beginning = {
        for: "Ismétlő lapkával",
        if: "„Ha…” lapkával",
        while: "„Amíg…” lapkával",
        "nested-for": "Egymásba tett ismétlő lapkákkal",
      }[concept];
      return beginning + " gyűjtsd össze az érméket, és juss el a csillaghoz!";
    }
    const beginning = {
      for: "Use a repeat block",
      if: "Use an if block",
      while: "Use a while block",
      "nested-for": "Put one repeat inside another",
    }[concept];
    return beginning + " to collect the coins and reach the star.";
  }

  function check(lesson, sequence, events) {
    const concept = conceptOf(lesson);
    // No inferred goals for practice, observation phases or future chapters.
    if (!concept) return true;
    const scope = global.PipBlocksScope;
    if (!Array.isArray(sequence) || !Array.isArray(events) || typeof scope?.structure !== "function") return false;
    const parsed = scope.structure(sequence);
    if (!parsed.ok) return false;
    const ends = new Map(parsed.pairs);
    for (const index of parsed.openers || []) ends.set(index, sequence.length);
    const contains = (opener, index) => Number.isInteger(opener) && opener < index && index < ends.get(opener);
    const meaningful = events.filter(event => event && Number.isInteger(event.index)
      && Object.hasOwn(actionCards, event.type) && actionCards[event.type] === typeOf(sequence[event.index]));
    if (concept === "if") {
      const conditions = [...ends.keys()].filter(index => typeOf(sequence[index])?.startsWith("IF_"));
      return meaningful.some(event => conditions.some(index => contains(index, event.index)));
    }
    return meaningful.some(event => {
      if (!Array.isArray(event.loops)) return false;
      const prefix = concept === "while" ? "WHILE_" : "FOR_";
      const loops = new Set(event.loops.filter(index => contains(index, event.index) && typeOf(sequence[index])?.startsWith(prefix)));
      return loops.size >= (concept === "nested-for" ? 2 : 1);
    });
  }

  global.PipBlocksCourseGoals = Object.freeze({ instruction, check });
})(typeof window !== "undefined" ? window : globalThis);
