// Shared teaching presentation. Content and focus ranges come from each lesson.
(function (global) {
  "use strict";
  const lesson = global.PipTutorialCampaign;
  const topics = lesson.chapters.map(chapter => chapter.summary);
  const practiceLevels = lesson.chapters.map(chapter => chapter.practice);
  const kinds = ["watch", "complete", "predict", "create"];
  function stageLabel(kind, locale) {
    return { watch: ["Watch", "Figyeld"], complete: ["Complete", "Egészítsd ki"],
      predict: ["Act out", "Játszd el"], create: ["Write", "Írd meg"] }[kind]?.[locale === "hu" ? 1 : 0] || "";
  }
  function sequence(chapter) { return kinds.map(kind => lesson.stages.find(stage => stage.chapter === chapter && stage.kind === kind)); }
  function focus(stage, locale) {
    if (!["watch", "complete"].includes(stage.kind)) return [];
    const spec = stage.focus?.[locale === "hu" ? "hu" : "en"];
    const ranges = spec?.preview || [];
    return ranges.map(([startLine, endLine = startLine, startColumn = 1, endColumn = null]) => ({ startLine, endLine, startColumn, endColumn }));
  }
  // Authored selection: an empty range puts the caret in a gap; a nonempty
  // range selects only the token/indentation to replace. Never applied to drafts.
  function completionSelection(stage, locale) {
    if (stage.kind !== "complete") return null;
    const language = locale === "hu" ? "hu" : "en";
    const target = stage.editSelection?.[language];
    const fallback = focus(stage, language)[0];
    if (!target && !fallback) return null;
    const lines = lesson.source(stage, language).split("\n");
    const [line, first, last] = target || [fallback.startLine, fallback.startColumn, fallback.startColumn];
    const startColumn = Math.min(first, lines[line - 1].length + 1);
    const endColumn = Math.min(last, lines[line - 1].length + 1);
    const base = lines.slice(0, line - 1).reduce((total, value) => total + value.length + 1, 0);
    return { line, startColumn, endColumn, start: base + startColumn - 1, end: base + endColumn - 1 };
  }
  global.PipCourse = Object.freeze({ topics, kinds, stageLabel, sequence, focus, completionSelection, practiceLevels });
})(window);
