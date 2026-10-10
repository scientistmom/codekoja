// Blocks course content is a projection of authored Python lessons, never a
// separately invented route. The named if-only introduction is the one
// deliberate if simplification; the nested-repeat reading adaptation keeps
// that chapter at one concept. Other unsupported stages do not appear.
(function (global) {
  "use strict";
  const python = global.PipBlocksPython;
  const course = global.PipTutorialCampaign;
  if (!python || !course) throw new Error("Load Python lessons and blocks-python.js before blocks-lessons.js.");
  const clone = value => JSON.parse(JSON.stringify(value));
  const bilingual = pair => ({ en: pair[0], hu: pair[1] });
  const kinds = ["watch", "complete", "predict", "create"];
  const actions = ["FORWARD", "TURN_LEFT", "TURN_RIGHT"];

  // These exact-source guards are curriculum exceptions, never general rules
  // for stripping unsupported Python. Changed examples require a fresh review.
  function adaptIf(stage) {
    const source = python.fromLines(stage.program);
    if (!["if-watch", "if-predict"].includes(stage.id)
      || source !== 'if whats("ahead") == "wall":\n    right()\nelse:\n    forward()\nforward()') return stage;
    return { ...stage, program: 'if whats("ahead") == "wall":\n    right()\nforward()' };
  }
  function adaptNestedFor(stage) {
    const source = python.fromLines(stage.program);
    if (stage.id !== "nested-for-predict" || stage.kind !== "predict"
      || source !== "distance = 1\nfor side in range(2):\n    for step in range(distance):\n        forward()\n    distance += 1\n    left()") return stage;
    return { ...stage, program: "for side in range(2):\n    for step in range(2):\n        forward()\n    left()" };
  }

  // An authored empty completion slot stays empty in Blocks. GAP is editor
  // metadata, not an executable card. In particular, a missing repeat count
  // becomes a missing repeat tile rather than a pre-filled correct answer.
  function completionStarter(stage, reference, solutionCode) {
    const source = python.fromLines(stage.program);
    const lines = source.split("\n"), answer = solutionCode.split("\n");
    const selection = stage.editSelection?.en;
    if (selection && lines.length === answer.length) {
      const lineIndex = selection[0] - 1;
      const original = lines[lineIndex] || "";
      const blankAction = !original.trim();
      const blankRepeat = /^\s*for\s+[A-Za-z_]\w*\s+in\s+range\(\s*\)\s*:$/.test(original);
      const unchangedElsewhere = lines.every((line, index) => index === lineIndex || line === answer[index]);
      const slot = reference.lineMap.map((line, index) => line === selection[0] ? index : -1).filter(index => index >= 0);
      if ((blankAction || blankRepeat) && unchangedElsewhere && slot.length === 1) {
        const cards = reference.cards.slice();
        cards[slot[0]] = "GAP";
        return cards;
      }
    }
    const translated = python.translate(source);
    return translated.ok ? translated.cards : null;
  }

  function derive(campaign) {
    const lessons = [];
    for (const [chapterIndex, chapter] of campaign.chapters.entries()) {
      for (const kind of kinds) {
        const original = campaign.stages.find(item => item.chapter === chapterIndex && item.kind === kind);
        if (!original) continue;
        const stage = adaptNestedFor(adaptIf(original));
        const candidates = stage.editable ? stage.solutions || [] : [stage.program];
        const supported = candidates.map(source => {
          const code = python.fromLines(source);
          return { code, translated: python.translate(code) };
        }).find(item => item.translated.ok);
        if (!supported) continue;
        const reference = supported.translated;
        const starter = kind === "complete" ? completionStarter(stage, reference, supported.code)
          : kind === "create" ? (() => {
            const translated = python.translate(python.fromLines(stage.program));
            return translated.ok ? translated.cards : null;
          })() : reference.cards.slice();
        if (!starter) continue;
        lessons.push({
          id: `blocks-python-${stage.id}`,
          sourceChapterId: chapter.id,
          sourceStageId: stage.id,
          kind,
          chapterTitle: bilingual(chapter.title),
          chapterLabel: bilingual(chapter.label),
          practice: clone(chapter.practice),
          exampleStepDuration: chapter.presentation?.exampleStepDuration || 1800,
          scenario: clone(stage.scenario),
          legacyCoins: clone(stage.legacyCoins || []),
          starter,
          solution: reference.cards.slice(),
          lineMap: reference.lineMap.slice(),
          referenceCode: supported.code,
          inventory: [],
        });
      }
    }
    const learned = new Set(actions);
    for (const chapter of campaign.chapters) {
      const chapterLessons = lessons.filter(lesson => lesson.sourceChapterId === chapter.id);
      for (const lesson of chapterLessons) {
        for (const card of [...lesson.solution, ...lesson.starter]) if (card !== "END" && card !== "GAP") learned.add(card);
      }
      for (const lesson of chapterLessons) lesson.inventory = [...learned];
    }
    return lessons;
  }

  const lessons = derive(course);
  global.PipBlocksLessons = lessons;
  global.PipBlocksChapters = course.chapters.flatMap(chapter => {
    const matching = lessons.filter(lesson => lesson.sourceChapterId === chapter.id);
    return matching.length ? [{ id: chapter.id, title: bilingual(chapter.title), label: bilingual(chapter.label), lessonIds: matching.map(lesson => lesson.id) }] : [];
  });
})(typeof window !== "undefined" ? window : globalThis);
