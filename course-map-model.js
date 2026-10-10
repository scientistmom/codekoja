// Read-only navigation metadata. Lesson files remain the course's source of truth.
(function (global) {
  "use strict";

  const readTiers = new Set(["actions", "for", "if", "while", "mixed"]);
  const writeTiers = new Set(["easy", "medium", "hard", "mastery"]);
  const sharedTiers = { actions: "commands", for: "loops", if: "choices", while: "while", mixed: "mixed" };

  function textPair(value, fallback) {
    const en = Array.isArray(value) ? value[0] : value?.en;
    const hu = Array.isArray(value) ? value[1] : value?.hu;
    const english = typeof en === "string" && en.trim() ? en : fallback;
    return { en: english, hu: typeof hu === "string" && hu.trim() ? hu : english };
  }

  function iconFor(lesson) {
    const topic = lesson.concept || lesson.id || "";
    const tools = new Set(lesson.tools || []);
    if (/mixed/.test(topic)) return "mixed";
    if (/nested/.test(topic)) return "nested";
    if (/parameter/.test(topic)) return "parameter";
    if (/variable/.test(topic)) return "variable";
    if (/function/.test(topic)) return "function";
    if (/direction/.test(topic)) return "directions";
    if (/boolean/.test(topic)) return "boolean";
    if (/break/.test(topic)) return "break";
    if (/while/.test(topic)) return "while";
    if (/choice|condition|^if(?:-|$)/.test(topic)) return "choice";
    if (/repeat|^for$/.test(topic)) return "repeat";
    if (/command|turn/.test(topic)) return "commands";
    for (const [tool, icon] of [["parameter", "parameter"], ["def", "function"], ["variable", "variable"],
      ["break", "break"], ["and", "boolean"], ["or", "boolean"], ["nested", "nested"],
      ["while", "while"], ["if", "choice"], ["for", "repeat"]]) {
      if (tools.has(tool)) return icon;
    }
    const tier = blockTier(lesson);
    return { commands: "commands", loops: "repeat", choices: "choice", while: "while", mixed: "mixed" }[tier];
  }

  function blockTier(lesson) {
    const topic = lesson.concept || "";
    const types = (lesson.inventory || [])
      .map(type => typeof type === "string" ? type : type?.type || "");
    const has = prefix => types.some(type => type.startsWith(prefix));
    if (topic === "mixed" || topic === "nested-conditions" || has("FOR_") && has("IF_") && has("WHILE_")) return "mixed";
    if (/while/.test(topic) || has("WHILE_")) return "while";
    if (/^if-|condition|choice/.test(topic) || has("IF_")) return "choices";
    if (/repeat/.test(topic) || has("FOR_")) return "loops";
    return "commands";
  }

  function pythonHybrid(read) {
    // This is the same native Read difficulty, not a guessed substitute for
    // the chapter. Unsupported generators have no translation destination.
    return { actions: "commands", for: "loops", if: "choices", while: "while" }[read] || null;
  }

  function pythonLessons() {
    if (global.PipLessonRegistry?.ordered && Array.isArray(global.PipCourseManifest) && global.PipCourseManifest.length) {
      try { return global.PipLessonRegistry.ordered(global.PipCourseManifest); }
      catch { /* An optional course that failed to load must not hide Blocks. */ }
    }
    return Array.isArray(global.PipTutorialCampaign?.chapters) ? global.PipTutorialCampaign.chapters : [];
  }

  function catalog() {
    const authored = pythonLessons();
    const byId = new Map(authored.map(lesson => [lesson.id, lesson]));
    const activities = Array.isArray(global.PipBlocksLessons) ? global.PipBlocksLessons : [];
    // A lesson is one coherent chapter, not four separate destinations. The
    // exact source chapter IDs provide grouping even if optional metadata is
    // unavailable; array positions never determine a topic or completion.
    const grouped = new Map();
    for (const activity of activities) {
      if (!activity?.sourceChapterId) continue;
      if (!grouped.has(activity.sourceChapterId)) grouped.set(activity.sourceChapterId, []);
      grouped.get(activity.sourceChapterId).push(activity);
    }
    const chapters = Array.isArray(global.PipBlocksChapters) ? global.PipBlocksChapters
      : [...grouped].map(([id, parts]) => ({ id, title: parts[0].chapterTitle, label: parts[0].chapterLabel }));
    const blocks = chapters.flatMap(chapter => {
      const parts = grouped.get(chapter.id) || [];
      if (!parts.length) return [];
      const first = parts[0], tier = pythonHybrid(first.practice?.read);
      return [{ id: chapter.id, label: textPair(chapter.label || first.chapterLabel, chapter.id),
        title: textPair(chapter.title || first.chapterTitle, chapter.id),
        description: textPair(byId.get(chapter.id)?.summary?.blocksIdea || byId.get(chapter.id)?.summary?.idea, ""),
        icon: iconFor({ ...chapter, concept: chapter.id }), total: 4, sourceChapterId: chapter.id,
        referenceTypes: [...new Set(parts.flatMap(part => part.reference || part.solution || []))],
        practice: { read: tier, write: first.practice?.write || null, hybrid: tier } }];
    }).map((chapter, index) => ({ ...chapter, index }));
    const python = authored.map((lesson, index) => {
      const read = readTiers.has(lesson.practice?.read) ? lesson.practice.read : "actions";
      const write = writeTiers.has(lesson.practice?.write) ? lesson.practice.write : "easy";
      return { id: lesson.id, index, label: textPair(lesson.label || lesson.title, lesson.id),
        title: textPair(lesson.title || lesson.label, lesson.id), icon: iconFor(lesson),
        description: textPair(lesson.summary?.idea, ""),
        total: Array.isArray(lesson.stages) && lesson.stages.length ? lesson.stages.length : 4,
        practice: { read, write, hybrid: pythonHybrid(read) } };
    });
    return { blocks, python };
  }

  // One row per authored Python topic, with one associated Blocks chapter.
  // Empty cells mean the Blocks course has no equivalent;
  // the map does not invent a function/variable lesson or repeat an old one.
  // Optional snapshots have the same per-track shape accepted by project().
  function rows(snapshots = {}) {
    const authored = catalog();
    const blocks = project(authored.blocks, snapshots?.blocks);
    const python = project(authored.python, snapshots?.python);
    const result = python.map(node => ({ id: node.id, index: node.index,
      label: { ...node.label }, title: { ...node.title }, icon: node.icon, blocks: [], python: [node] }));
    const byTopic = new Map(result.map(row => [row.id, row]));
    blocks.forEach(node => {
      const topic = node.sourceChapterId;
      let row = byTopic.get(topic);
      if (!row) {
        row = { id: topic, index: result.length, label: { ...node.label }, title: { ...node.title }, icon: node.icon, blocks: [], python: [] };
        result.push(row); byTopic.set(topic, row);
      }
      row.blocks.push(node);
    });
    for (const row of result) {
      const source = row.python[0]?.practice;
      const read = source ? sharedTiers[source.read] : row.blocks[0]?.practice.read;
      const supported = ["commands", "loops", "choices", "while"].includes(read) ? read : null;
      const write = source?.write || row.blocks[0]?.practice.write || null;
      row.practice = {
        blocks: { read: supported, write, hybrid: supported },
        python: source ? { ...source } : { read: null, write: null, hybrid: null },
      };
    }
    return result;
  }

  // Practice is generated by difficulty, not by lesson. Represent a shared
  // destination once across consecutive rows, while keeping separated runs
  // separate. Hybrid has one engine; its origin is the first row in its group.
  function practiceGroups(topicRows, preferredTrack = "python") {
    const track = preferredTrack === "blocks" ? "blocks" : "python";
    const groups = [];
    for (const kind of ["read", "write", "hybrid"]) {
      let previous = null;
      topicRows.forEach((row, index) => {
        const chosen = row.practice[track];
        const difficulty = chosen[kind];
        if (!difficulty) { previous = null; return; }
        if (previous && previous.difficulty === difficulty) {
          previous.span += 1; previous.topicIds.push(row.id);
        } else {
          previous = { kind, track, difficulty, start: index, span: 1, topicIds: [row.id] };
          groups.push(previous);
        }
      });
    }
    return groups;
  }

  // Chapters own progress for both tracks. A Blocks snapshot can retain its
  // flat activity fields for other consumers, but they never override the
  // explicit chapter totals/current chapter supplied by its runtime.
  // Selection/order never implies completion, and no lesson becomes locked.
  function project(nodes, snapshot = {}) {
    const entries = Array.isArray(snapshot?.chapters) ? snapshot.chapters : snapshot?.lessons;
    const saved = new Map((Array.isArray(entries) ? entries : []).filter(entry => entry?.id).map(entry => [entry.id, entry]));
    const current = snapshot?.currentChapterId ?? snapshot?.currentLessonId;
    const positiveInteger = (value, fallback) => Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
    const projected = nodes.map(node => {
      const entry = saved.get(node.id);
      const total = positiveInteger(node.total, positiveInteger(entry?.total, 1));
      const completed = Math.min(total, Number.isFinite(entry?.completed) ? Math.max(0, Math.floor(entry.completed)) : 0);
      const started = entry?.started === true || completed > 0;
      return { ...node, completed, total, started, progress: completed / total,
        status: completed === total ? "complete" : started ? "partial" : "new",
        current: node.id === current, available: true, recommended: false };
    });
    const next = projected.find(node => node.status !== "complete");
    if (next) next.recommended = true;
    return projected;
  }

  // Prerequisites describe the actual four-phase lesson programs, not their
  // old list order. In particular, sensor while and for can start in parallel;
  // functions need for because their completion task contains a repeat.
  const graphRules = {
    blocks: {
      commands: { requires: [], x: 10, y: 8 },
      for: { requires: ["commands"], x: 10, y: 25 },
      if: { requires: ["for"], x: 10, y: 42 },
      while: { requires: ["commands"], x: 10, y: 59 },
      "nested-for": { requires: ["for"], x: 10, y: 76 },
    },
    python: {
      commands: { requires: [], x: 65, y: 8 },
      for: { requires: ["commands"], x: 44, y: 21 },
      while: { requires: ["commands"], x: 86, y: 21 },
      if: { requires: ["for"], x: 44, y: 34 },
      functions: { requires: ["for"], x: 65, y: 34 },
      variables: { requires: ["for", "while"], x: 86, y: 34 },
      parameters: { requires: ["functions", "variables"], x: 65, y: 47 },
      directions: { requires: ["if", "variables"], needsElse: true, x: 44, y: 47 },
      "nested-for": { requires: ["for", "variables"], x: 86, y: 47 },
      boolean: { requires: ["directions", "variables", "while"], x: 44, y: 60 },
      "loop-choices": { requires: ["directions", "variables", "while"], x: 65, y: 60 },
      "nested-while": { requires: ["while", "variables", "nested-for"], x: 86, y: 60 },
      break: { requires: ["directions", "while", "nested-for"], x: 44, y: 73 },
      // The current Mixed programs use helpers but no parameters, return, or
      // break. Those useful side branches must not become artificial gates.
      mixed: { requires: ["functions", "variables", "directions", "boolean", "loop-choices", "nested-while"], needsElse: true, x: 75, y: 86 },
    },
  };
  const bridgeTopics = ["commands", "for", "if", "while", "nested-for"];
  const graphTracks = ["blocks", "python"];
  const graphKey = (track, id) => `${track}:${id}`;
  const safeTaskId = value => typeof value === "string" && value.length > 0
    && value.length <= 2048 && value.trim() === value && !/[\u0000-\u001f]/.test(value);

  function graph(snapshots = {}) {
    const authored = catalog();
    const nodes = graphTracks.flatMap(track => project(authored[track], snapshots?.[track]).map(node => {
      const rule = graphRules[track][node.id];
      return { ...node, key: graphKey(track, node.id), track,
        prerequisites: (rule?.requires || []).map(id => graphKey(track, id)),
        x: rule?.x ?? 65, y: rule?.y ?? 94, configured: Boolean(rule) };
    }));
    const byKey = new Map(nodes.map(node => [node.key, node]));
    const ownComplete = key => {
      const node = byKey.get(key);
      return Boolean(node && node.completed === node.total && node.total > 0);
    };
    const savedBridges = (Array.isArray(snapshots?.progress?.bridges) ? snapshots.progress.bridges : []).filter(record =>
      record && graphTracks.includes(record.from) && graphTracks.includes(record.to) && record.from !== record.to
      && bridgeTopics.includes(record.topic) && record.assessmentVersion === 1 && safeTaskId(record.taskId));
    const transferred = (track, topic) => savedBridges.some(record => record.to === track && record.topic === topic);
    function credited(key, needsElse = false) {
      if (ownComplete(key)) return true;
      const node = byKey.get(key);
      if (!node || !transferred(node.track, node.id)) return false;
      // The Blocks introduction deliberately omits else. Passing that bridge
      // demonstrates a basic if, never Python's full two-branch lesson.
      return !(node.track === "python" && node.id === "if" && needsElse);
    }
    const satisfies = (source, target) => credited(source, graphRules[target.track]?.[target.id]?.needsElse && source === "python:if");
    for (const node of nodes) {
      node.credited = transferred(node.track, node.id);
      node.unmetPrerequisites = node.prerequisites.filter(key => !satisfies(key, node));
      node.resumable = node.started || node.current;
      node.status = ownComplete(node.key) ? "complete"
        : node.resumable || node.configured && node.unmetPrerequisites.length === 0 ? "available" : "locked";
      // Knowledge status guides the next recommendation; it never prevents
      // choosing a lesson. Directional assessment credit stays gated below.
      node.accessible = true;
      node.available = true;
    }

    // Keep all prerequisite checks above, but omit visually redundant edges.
    // A bridge may still make the explicit variable check important even when
    // variables also occur earlier on another displayed path.
    function hasAncestor(from, wanted, seen = new Set()) {
      if (from === wanted) return true;
      if (seen.has(from)) return false;
      seen.add(from);
      return (byKey.get(from)?.prerequisites || []).some(key => hasAncestor(key, wanted, seen));
    }
    const edges = nodes.flatMap(target => target.prerequisites.filter(source =>
      !target.prerequisites.some(other => other !== source && hasAncestor(other, source)))
      .map(source => ({ key: `${source}->${target.key}`, source, target: target.key,
        status: satisfies(source, target) ? "complete" : byKey.get(source)?.status === "available" ? "available" : "locked" })));
    const bridges = bridgeTopics.flatMap(topic => graphTracks.map(from => {
      const to = from === "blocks" ? "python" : "blocks";
      const source = graphKey(from, topic), target = graphKey(to, topic);
      const completed = savedBridges.some(record => record.from === from && record.to === to && record.topic === topic);
      return { key: `${from}:${to}:${topic}`, from, to, topic, source, target,
        status: completed ? "complete" : ownComplete(source) ? "available" : "locked",
        completed, accessible: completed || ownComplete(source) };
    })).filter(bridge => byKey.has(bridge.source) && byKey.has(bridge.target));

    const savedPractices = Array.isArray(snapshots?.progress?.practices) ? snapshots.progress.practices : [];
    const practice = [];
    function addPractice(track, kind, difficulty, prerequisiteSets) {
      const completed = savedPractices.some(record => record && record.track === track && record.kind === kind
        && record.difficulty === difficulty && safeTaskId(record.taskId));
      const known = prerequisiteSets.some(requirements => requirements.every(key => credited(key, key === "python:if" && difficulty === "if")));
      practice.push({ key: `practice:${track}:${kind}:${difficulty}`, track, kind, difficulty,
        completed, known,
        status: completed ? "complete" : known ? "available" : "locked", accessible: true,
        prerequisites: [...new Set(prerequisiteSets.flat())] });
    }
    for (const track of graphTracks) {
      const read = track === "blocks" ? {
        commands: ["commands"], loops: ["for"], choices: ["if"], while: ["while"],
      } : {
        actions: ["commands"], for: ["for"], if: ["if", "directions"], while: ["while", "variables"],
        mixed: ["for", "while", "variables", "directions", "boolean", "nested-for", "break", "nested-while", "loop-choices"],
      };
      for (const [difficulty, topics] of Object.entries(read)) addPractice(track, "read", difficulty, [topics.map(topic => graphKey(track, topic))]);
      // Write/Build boards change route difficulty, not their required syntax:
      // literal movement commands can solve every generated board.
      for (const difficulty of ["easy", "medium", "hard", "mastery"]) addPractice(track, "write", difficulty, [[graphKey(track, "commands")]]);
    }
    for (const [difficulty, topic] of Object.entries({ commands: "commands", loops: "for", choices: "if", while: "while" })) {
      addPractice("shared", "hybrid", difficulty, graphTracks.map(track => [graphKey(track, topic)]));
    }
    return { nodes, edges, bridges, practice };
  }

  global.PipCourseMapModel = Object.freeze({ catalog, project, rows, practiceGroups, graph });
})(typeof window !== "undefined" ? window : globalThis);
