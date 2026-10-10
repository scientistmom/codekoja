// Shared navigation and action locations. Mode controllers keep ownership of
// their original buttons, handlers, visibility and saved state.
(function (global) {
  "use strict";
  const document = global.document;
  const shell = document?.querySelector(".app-shell");
  if (!shell) return;

  function installActivitySelector() {
    const topbar = shell.querySelector(":scope > .topbar");
    if (!topbar || shell.querySelector(":scope > .shared-activity-nav")) return;
    const selectors = {
      python: ".practice-workspace .mode-switch",
      course: ".tutorial-workspace .mode-switch",
      blocks: ".blocks-header .blocks-mode-switch",
      hybrid: ".hybrid-header .hybrid-activity-nav",
    };
    const activities = ["course", "read", "write", "hybrid"];
    const nav = document.createElement("nav");
    nav.className = "shared-activity-nav";
    nav.hidden = true;
    const buttons = new Map(activities.map(activity => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.sharedActivity = activity;
      button.setAttribute("aria-pressed", "false");
      nav.append(button);
      return [activity, button];
    }));
    topbar.after(nav);

    function activityOf(button) {
      const value = button.dataset.blocksMode || button.dataset.hybridActivity || button.dataset.tutorialTab;
      if (value) return value === "tutorial" ? "course" : value === "build" ? "write" : value;
      if (button.classList.contains("native-hybrid-entry")) return "hybrid";
      return { "tutorial-mode": "course", "read-mode": "read", "write-mode": "write" }[button.id];
    }
    function sourceKind() {
      const stage = shell.dataset.learningStage;
      if (stage === "blocks" || stage === "hybrid") return stage;
      return shell.dataset.tutorialActive === "true" ? "course" : "python";
    }
    function sourceButtons(group) {
      return new Map([...group.querySelectorAll("button")].map(button => [activityOf(button), button]).filter(([activity]) => activities.includes(activity)));
    }
    function setAttribute(element, name, value) {
      if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    }
    const observed = new WeakSet();
    let frame = null;
    function scheduleRefresh() {
      if (frame === null) frame = requestAnimationFrame(() => { frame = null; refresh(); });
    }
    const observer = new MutationObserver(scheduleRefresh);
    function refresh() {
      for (const selector of Object.values(selectors)) {
        const group = shell.querySelector(selector);
        if (!group || observed.has(group)) continue;
        observed.add(group);
        observer.observe(group, { subtree: true, childList: true, characterData: true, attributes: true,
          attributeFilter: ["aria-pressed", "disabled", "hidden"] });
      }
      const kind = sourceKind(), group = shell.querySelector(selectors[kind]);
      const sources = group ? sourceButtons(group) : new Map();
      // If a mode failed to load, keep its own controls usable as a fallback.
      const usable = activities.every(activity => sources.has(activity));
      nav.hidden = !usable;
      shell.toggleAttribute("data-shared-controls", usable);
      if (!usable) return;
      nav.dataset.source = kind;
      for (const [activity, button] of buttons) {
        const source = sources.get(activity), label = source.textContent.trim();
        if (button.textContent !== label) button.textContent = label;
        button.disabled = source.disabled;
        button.hidden = source.hidden;
        setAttribute(button, "aria-pressed", source.getAttribute("aria-pressed") || "false");
      }
      for (const selector of Object.values(selectors)) {
        const original = shell.querySelector(selector);
        if (!original) continue;
        const originalSources = sourceButtons(original);
        if (activities.every(activity => originalSources.has(activity)))
          original.setAttribute("data-shared-control-source", "activity");
      }
    }

    nav.addEventListener("click", event => {
      const activity = event.target.closest("[data-shared-activity]")?.dataset.sharedActivity;
      if (!activities.includes(activity)) return;
      // Resolve at click time: language/track changes must not send actions
      // to a parked editor. Existing confirmation and saving stay intact.
      const group = shell.querySelector(selectors[sourceKind()]);
      const source = group && sourceButtons(group).get(activity);
      if (!source || source.disabled || source.hidden) return;
      source.click();
      refresh();
    });
    // Navigation handles Enter before Read's document-capture route check.
    global.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const button = event.target.closest?.("[data-shared-activity]");
      if (!button || !nav.contains(button)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!event.repeat && !button.disabled) button.click();
    }, true);
    observer.observe(shell, { attributes: true, attributeFilter: ["data-learning-stage", "data-tutorial-active", "data-ui-mode"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    refresh();
  }

  function installActionDocks() {
    if (shell.dataset.sharedActions === "true") return;
    function dock(workspace, controls, kind) {
      controls.classList.add("play-controls", "shared-action-dock", kind + "-action-dock");
      workspace.append(controls);
      workspace.dataset.sharedActions = "true";
    }
    for (const kind of ["blocks", "hybrid"]) {
      const workspace = document.querySelector("." + kind + "-workspace");
      const controls = workspace?.querySelector("." + kind + "-controls");
      const reset = workspace?.querySelector("#" + kind + "-reset");
      const run = workspace?.querySelector("#" + kind + "-run");
      if (!controls || !reset || !run) continue;
      // Clear edits an answer; Reset/New/Run belong to the shared board dock.
      const clear = kind === "hybrid" && controls.querySelector("#hybrid-clear");
      if (clear) controls.parentElement.insertBefore(clear, controls);
      const next = document.querySelector("#" + kind + "-new");
      controls.append(reset);
      if (next) controls.append(next);
      controls.append(run);
      dock(workspace, controls, kind);
    }
    // Keep the translation direction's original delegated handler intact.
    const hybridHeader = document.querySelector(".hybrid-header");
    const direction = document.querySelector(".hybrid-workspace")?.querySelector(".hybrid-task-options");
    const navigation = hybridHeader?.querySelector(".hybrid-navigation");
    if (direction && navigation) hybridHeader.insertBefore(direction, navigation);

    const course = document.querySelector(".tutorial-workspace");
    const courseControls = course?.querySelector(".tutorial-play-controls");
    if (courseControls) {
      const reset = course.querySelector("#tutorial-reset");
      if (reset) courseControls.prepend(reset);
      const actions = course.querySelector(".tutorial-editor-actions");
      if (actions) courseControls.append(actions);
      dock(course, courseControls, "tutorial");
    }
    shell.dataset.sharedActions = "true";
  }

  installActivitySelector();
  installActionDocks();
})(typeof window !== "undefined" ? window : globalThis);
