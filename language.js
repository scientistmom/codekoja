(function startLocalizedGame() {
  "use strict";

  const LANGUAGE_KEY = "pip-python-lab.language.v1";
  const SUPPORTED_LANGUAGES = new Set(["en", "hu"]);
  const READ_DIFFICULTIES = new Set(["actions", "for", "if", "while", "mixed"]);
  const NAVIGATION_HANDOFF_VERSION = "1";
  const NAVIGATION_HANDOFF_KEYS = Object.freeze([
    "pip_nav",
    "pip_from",
    "pip_mode",
    "pip_read",
    "pip_round",
    "pip_scroll",
  ]);
  const LANGUAGE_DETAILS = Object.freeze({
    en: {
      htmlLanguage: "en",
      title: "CodeKoja",
      loadErrorTitle: "The game could not load",
      loadErrorCopy: "Refresh the page and try again.",
    },
    hu: {
      htmlLanguage: "hu",
      title: "CodeKoja",
      loadErrorTitle: "Nem sikerült betölteni a játékot",
      loadErrorCopy: "Frissítsd az oldalt, és próbáld újra.",
    },
  });

  function savedLanguage() {
    try {
      return localStorage.getItem(LANGUAGE_KEY);
    } catch {
      return null;
    }
  }

  function requestedLanguage() {
    const query = new URLSearchParams(location.search).get("lang");
    if (SUPPORTED_LANGUAGES.has(query)) return query;
    const saved = savedLanguage();
    return SUPPORTED_LANGUAGES.has(saved) ? saved : "en";
  }

  function rememberLanguage(language) {
    if (window.PipResetInProgress) return;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // The selector still works if private browsing blocks storage.
    }
  }

  function navigationFromUrl(language) {
    const params = new URLSearchParams(location.search);
    const sourceLanguage = params.get("pip_from");
    const activeMode = params.get("pip_mode");
    const readDifficulty = params.get("pip_read");
    const round = Number(params.get("pip_round"));
    if (
      params.get("pip_nav") !== NAVIGATION_HANDOFF_VERSION
      || !SUPPORTED_LANGUAGES.has(sourceLanguage)
      || sourceLanguage === language
      || !["read", "write"].includes(activeMode)
      || !READ_DIFFICULTIES.has(readDifficulty)
      || !Number.isInteger(round)
      || round < 1
    ) return null;
    return Object.freeze({ activeMode, readDifficulty, round });
  }

  function clearNavigationFromUrl() {
    const url = new URL(location.href);
    if (!NAVIGATION_HANDOFF_KEYS.some((key) => url.searchParams.has(key))) return;
    for (const key of NAVIGATION_HANDOFF_KEYS) url.searchParams.delete(key);
    try {
      if (typeof history !== "undefined" && typeof history.replaceState === "function") {
        history.replaceState(history.state, "", url);
      }
    } catch {
      // Navigation still works if this browser does not allow history updates.
    }
  }

  function setDocumentLanguage(language) {
    const details = LANGUAGE_DETAILS[language];
    document.documentElement.lang = details.htmlLanguage;
    document.documentElement.dataset.language = language;
    document.title = details.title;
  }

  const HUNGARIAN_SHELL = Object.freeze({
    text: [
      ["#read-mode", "Kódolvasás"],
      ["#write-mode", "Kódírás"],
      ["#stop-code", "Leállítás"],
      ["#console-title", "Python-konzol"],
      ["#trace-undo", "Utolsó törlése"],
      ["#trace-clear", "Válasz törlése"],
      ["#trace-evaluate", "Válasz ellenőrzése"],
    ],
  });

  function requiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error("Missing interface element: " + selector);
    return element;
  }

  // UI copy is translated separately from Python and from the child's output.
  const copyPairs = new Map(), copyMatchers = new Map();
  function register(english, hungarian) {
    if (typeof english === "string" && typeof hungarian === "string" && english && hungarian
      && copyPairs.get(english) !== hungarian) {
      copyPairs.set(english, hungarian);
      copyMatchers.clear();
    }
  }
  function translateCopy(value, from, to) {
    if (from === to || typeof value !== "string") return value;
    let matcher = copyMatchers.get(from);
    if (!matcher) {
      const pairs = [...copyPairs].map(([en, hu]) => from === "en" ? [en, hu] : [hu, en]);
      const exact = new Map();
      for (const [key, text] of pairs) if (!exact.has(key)) exact.set(key, text);
      // Reuse the matcher for composed labels until a translation changes.
      const keys = pairs.filter(([key]) => key.length > 3 && !key.includes("<"))
        .sort((a, b) => b[0].length - a[0].length);
      const pattern = keys.map(([key]) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      matcher = { exact, replacements: new Map(keys), pattern: pattern ? new RegExp(pattern, "g") : null };
      copyMatchers.set(from, matcher);
    }
    const trimmed = value.trim();
    if (matcher.exact.has(trimmed)) return value.replace(trimmed, matcher.exact.get(trimmed));
    return matcher.pattern ? value.replace(matcher.pattern, match => matcher.replacements.get(match)) : value;
  }
  function translateTree(root, from, to) {
    if (!root || from === to) return;
    function visit(node) {
      if (node.nodeType === 3) {
        node.nodeValue = translateCopy(node.nodeValue, from, to);
        return;
      }
      if (node.nodeType !== 1) return;
      if (node.matches("textarea, #monaco-editor, #console-output, script, style, .tutorial-workspace, .tutorial-header")) return;
      for (const child of node.childNodes) visit(child);
    }
    visit(root);
  }
  function captureShellCopy() {
    for (const [selector, value] of HUNGARIAN_SHELL.text) register(requiredElement(selector).textContent, value);
  }

  function finishLanguageSwitch(language) {
    setDocumentLanguage(language);
    rememberLanguage(language);
    updateResetLabel(language);
    const picker = document.querySelector("#language-picker");
    for (const button of picker.querySelectorAll("[data-language]")) {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    try { history.replaceState(history.state, "", url); } catch { /* Switching still works offline. */ }
  }
  window.PipI18n = { register, translateCopy, translateTree, finishLanguageSwitch };

  function installLocalizedShell(language) {
    if (language !== "hu") return;
    for (const [selector, value] of HUNGARIAN_SHELL.text) {
      requiredElement(selector).textContent = value;
    }
    const difficultyLabels = {
      actions: "Parancsok", for: "for", if: "if", while: "while", mixed: "Vegyes",
    };
    for (const button of document.querySelectorAll("#read-difficulty [data-difficulty]")) {
      button.querySelector(".difficulty-name").textContent = difficultyLabels[button.dataset.difficulty];
    }
    for (const button of document.querySelectorAll("[data-trace-action]")) {
      const labels = { left: "balra()", forward: "előre()", right: "jobbra()" };
      button.querySelector("code").textContent = labels[button.dataset.traceAction];
    }
  }

  function updateResetLabel(language) {
    const button = document.querySelector("#reset-all");
    if (!button) return;
    const label = language === "hu" ? "Mindent újrakezd" : "Reset everything";
    button.querySelector(".reset-all-label").textContent = label;
  }
  function resetEverything() {
    if (window.PipResetInProgress) return;
    const hu = window.PipLocale === "hu";
    if (!window.confirm(hu
      ? "Mindent újrakezdesz? Minden mentett kód, pálya, válasz, tanfolyami haladás, érme, megvett kinézet és beállítás törlődik mindkét nyelven. Ezt nem lehet visszavonni."
      : "Reset everything? All saved code, boards, answers, course progress, coins, purchased looks and settings will be deleted in both languages. This cannot be undone.")) return;
    window.PipResetInProgress = true;
    try {
      // Only this game's data. Other apps sharing the same origin are untouched.
      for (const storage of [window.localStorage, window.sessionStorage]) {
        if (!storage) continue;
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith("pip-python-lab.")) keys.push(key);
        }
        for (const key of keys) storage.removeItem(key);
      }
      const fresh = new URL(location.href); fresh.search = ""; fresh.hash = "";
      location.replace(fresh.href);
    } catch {
      window.PipResetInProgress = false;
      window.alert(hu ? "Nem sikerült minden mentést törölni. Ellenőrizd a böngésző tárhelybeállításait." : "Could not clear all saved data. Check your browser's storage settings.");
    }
  }
  // Both the game header and map use the same confirmed reset action.
  window.PipResetEverything = resetEverything;

  function installLanguagePicker(language) {
    const topbar = document.querySelector(".topbar");
    const runtime = document.querySelector("#runtime-pill");
    if (!topbar || !runtime) throw new Error("The game header is incomplete");

    const controls = document.createElement("div");
    controls.className = "topbar-controls";

    const picker = document.createElement("div");
    picker.className = "language-picker";
    picker.id = "language-picker";
    picker.setAttribute("role", "group");

    const languageButtons = [
      ["en", "English"],
      ["hu", "Magyar"],
    ].map(([buttonLanguage, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-button";
      button.dataset.language = buttonLanguage;
      button.lang = buttonLanguage;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(buttonLanguage === language));
      return button;
    });

    picker.append(...languageButtons);
    runtime.replaceWith(controls);
    const reset = document.createElement("button"); reset.type = "button"; reset.id = "reset-all";
    reset.innerHTML = '<span aria-hidden="true">↺</span><span class="reset-all-label"></span>';
    reset.addEventListener("click", resetEverything);
    controls.append(picker, reset, runtime);
    updateResetLabel(language);

    for (const button of languageButtons) {
      button.addEventListener("click", () => {
        const nextLanguage = button.dataset.language;
        if (!SUPPORTED_LANGUAGES.has(nextLanguage) || nextLanguage === window.PipLocale) return;
        // The app owns the live session. Never navigate or reload to translate it.
        if (typeof window.PipSetLanguage === "function") window.PipSetLanguage(nextLanguage);
      });
    }
  }

  // Start fetching the whole local graph together; execution remains ordered.
  // One URL per module also keeps preload and execution cache keys identical.
  const BOOT_SCRIPTS = Object.freeze({
    core: [
      "code-translation.js?v=53", "world-generator.js?v=53", "read-tutorial.js?v=59",
      "playback.js?v=4", "code-symbols.js?v=4",
      "code-fit.js?v=2", "python-editor.js?v=11", "pip-skins.js?v=11",
      "learning-progress.js?v=1", "python-runtime.js?v=2", "editor-loader.js?v=3", "app.js?v=83",
    ],
    registry: ["lesson-registry.js?v=15", "lessons/manifest.js?v=2"],
    course: ["course-engine.js?v=9", "course-content.js?v=13", "tutorial-mode.js?v=53"],
    blocks: [
      "blocks-engine.js?v=10", "block-palette.js?v=5",
      "blocks-python.js?v=8", "blocks-lessons.js?v=10", "blocks-state.js?v=7", "blocks-practice.js?v=11",
      "blocks-practice-state.js?v=3", "blocks-course-goals.js?v=3",
    ],
    hybrid: ["hybrid-engine.js?v=8", "learning-bridges.js?v=3", "hybrid-mode.js?v=25"],
    blockMode: ["blocks-mode.js?v=25"],
    sharedLayout: ["shared-layout.js?v=4"],
    map: ["course-map-model.js?v=11", "course-map.js?v=25"],
  });

  function preloadScripts(sources) {
    for (const source of sources) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = source;
      (document.head || document.body).appendChild(link);
    }
  }

  async function loadScripts(sources) {
    // Await each execution, not each download: a failed dependency must still
    // stop its group instead of evaluating dependants against missing globals.
    for (const source of sources) await loadScript(source);
  }

  const afterWelcomePaint = [];
  let welcomePainted = false;
  let welcomePaintScheduled = false;
  window.PipAfterWelcomePaint = (callback) => {
    if (welcomePainted) callback();
    else afterWelcomePaint.push(callback);
  };
  function releaseStartupWork() {
    if (welcomePaintScheduled) return;
    welcomePaintScheduled = true;
    const nextFrame = typeof window.requestAnimationFrame === "function"
      ? callback => window.requestAnimationFrame(callback)
      : callback => window.setTimeout(callback, 0);
    // The second frame gives the real map (or its error fallback) a paint
    // before Monaco and Python compete for bandwidth and the main thread.
    nextFrame(() => nextFrame(() => {
      welcomePainted = true;
      for (const callback of afterWelcomePaint.splice(0)) {
        try { callback(); } catch (error) { console.warn("Background startup failed", error); }
      }
    }));
  }

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = source;
      script.async = false;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error("Could not load " + source)), { once: true });
      (document.head || document.body).appendChild(script);
    });
  }

  function showLoadError(language, error) {
    console.error("Localized game startup failed.", error);
    const details = LANGUAGE_DETAILS[language];
    const runtimeLabel = document.querySelector("#runtime-label");
    const runtimePill = document.querySelector("#runtime-pill");
    const summaryTitle = document.querySelector("#summary-title");
    const summaryCopy = document.querySelector("#summary-copy");
    if (runtimePill) runtimePill.dataset.state = "error";
    if (runtimeLabel) runtimeLabel.textContent = details.loadErrorTitle;
    if (summaryTitle) summaryTitle.textContent = details.loadErrorTitle;
    if (summaryCopy) summaryCopy.textContent = details.loadErrorCopy;
  }

  async function start() {
    const language = requestedLanguage();
    window.PipLocale = language;
    window.PipNavigationHandoff = navigationFromUrl(language);
    const scrollParameter = new URLSearchParams(location.search).get("pip_scroll");
    const scrollTop = scrollParameter === null ? NaN : Number(scrollParameter);
    window.PipScrollHandoff = window.PipNavigationHandoff && Number.isFinite(scrollTop) && scrollTop >= 0
      ? scrollTop : null;
    if (window.PipScrollHandoff !== null && typeof history !== "undefined") {
      history.scrollRestoration = "manual";
    }
    // Apply the incoming layout before loading the game modules, so Read mode
    // never briefly paints the Write-mode panels during a language switch.
    const shell = document.querySelector(".app-shell");
    if (shell && window.PipNavigationHandoff) {
      shell.dataset.uiMode = window.PipNavigationHandoff.activeMode;
      shell.dataset.readDifficulty = window.PipNavigationHandoff.readDifficulty;
      shell.dataset.round = String(window.PipNavigationHandoff.round);
    }
    clearNavigationFromUrl();
    rememberLanguage(language);
    setDocumentLanguage(language);

    try {
      captureShellCopy();
      installLocalizedShell(language);
      installLanguagePicker(language);
      preloadScripts(Object.values(BOOT_SCRIPTS).flat());
      await loadScripts(BOOT_SCRIPTS.core);
      // Tutorial is optional: its failure must not block either free-play mode.
      void loadScripts(BOOT_SCRIPTS.registry)
        .then(() => Promise.all(window.PipCourseManifest.map(item => loadScript(item.file + "?v=17"))))
        .then(() => window.PipLessonRegistry.ordered(window.PipCourseManifest))
        .then(() => loadScripts(BOOT_SCRIPTS.course))
        .catch((error) => {
          console.warn("Tutorial could not load", error);
          const entry = document.querySelector("#tutorial-mode");
          if (entry) entry.hidden = true;
        })
        .then(() => loadScripts(BOOT_SCRIPTS.blocks))
        .then(() => loadScripts(BOOT_SCRIPTS.hybrid)
          .catch(error => console.warn("Hybrid could not load; Blocks and Python are still available", error)))
        .then(() => loadScripts(BOOT_SCRIPTS.blockMode))
        .catch(error => console.warn("Blocks could not load; Python is still available", error))
        .then(() => loadScripts(BOOT_SCRIPTS.sharedLayout))
        .catch(error => console.warn("Shared navigation unavailable:", error))
        .then(() => loadScripts(BOOT_SCRIPTS.map))
        .catch(error => {
          console.warn("Lesson map could not load; the game is still available", error);
          window.PipReleaseWelcome?.();
        })
        .finally(releaseStartupWork);
    } catch (error) {
      if (!document.querySelector("#language-picker")) {
        try {
          installLanguagePicker(language);
        } catch {
          // The localized error below is still useful without the picker.
        }
      }
      window.PipReleaseWelcome?.();
      showLoadError(language, error);
      releaseStartupWork();
    }
  }

  start();
})();
