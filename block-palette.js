// Compact, reusable tile shelves. This changes presentation, not permissions.
(function (global) {
  "use strict";
  const typeOf = value => typeof value === "string" ? value : value?.type;
  const unique = values => [...new Set((Array.isArray(values) ? values : []).map(typeOf).filter(type => typeof type === "string" && type !== "GAP"))];
  const actions = new Set(["FORWARD", "TURN_LEFT", "TURN_RIGHT"]);
  const isOpener = type => /^(FOR_|IF_|WHILE_)/.test(type);
  const family = type => actions.has(type) ? "action" : /^(FOR_|IF_|WHILE_)/.exec(type || "")?.[1] || type;

  function partition({ available = [], reference = [], starter = [], completion = false } = {}) {
    const allowed = unique(available), relevant = new Set([...actions, ...unique(reference), ...unique(starter)]);
    // A missing repeat tile must still offer the learned alternatives, rather
    // than advertise the answer by showing only its correct count.
    if (completion && Array.isArray(starter)) starter.forEach((card, index) => {
      if (typeOf(card) !== "GAP") return;
      const missing = family(typeOf(reference[index]));
      for (const type of allowed) if (missing && family(type) === missing) relevant.add(type);
    });
    const all = allowed.filter(type => type !== "END");
    return { primary: all.filter(type => relevant.has(type)), more: all.filter(type => !relevant.has(type)),
      pinned: allowed.includes("END") || allowed.some(isOpener) ? ["END"] : [], all };
  }

  function attach({ pile, toolbar, createTile }) {
    if (!pile || typeof createTile !== "function") throw new TypeError("A palette needs its pile and tile factory.");
    const doc = pile.ownerDocument, win = doc.defaultView || global;
    const make = (name, className, text) => { const element = doc.createElement(name); element.className = className; if (text) element.textContent = text; return element; };
    const previous = make("button", "block-palette-prev", "‹"), next = make("button", "block-palette-next", "›");
    const rail = make("div", "block-palette-rail"), end = make("div", "block-palette-end");
    const more = make("button", "block-palette-more");
    for (const button of [previous, next, more]) button.type = "button";
    rail.setAttribute("role", "group"); end.setAttribute("role", "group");
    pile.classList.add("block-palette"); pile.replaceChildren(previous, rail, next, end);
    (toolbar || pile.parentElement).append(more);
    let options = {}, parts = partition(), identity = null, expanded = false, frame = null, gesture = null;
    const remembered = new Map();
    const on = (element, name, handler, settings) => element.addEventListener(name, handler, settings);
    const t = (en, hu) => options.locale === "hu" ? hu : en;
    const scrollKey = () => identity + (expanded ? ":more" : ":main");
    const remember = () => { if (identity !== null) remembered.set(scrollKey(), rail.scrollLeft); };
    function refresh() {
      const overflow = rail.scrollWidth > rail.clientWidth + 1;
      pile.dataset.overflow = String(overflow);
      previous.disabled = !overflow || rail.scrollLeft <= 1;
      next.disabled = !overflow || rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
    }
    function schedule() {
      if (frame === null) frame = win.requestAnimationFrame(() => { frame = null; refresh(); });
    }
    function render() {
      rail.replaceChildren(); end.replaceChildren();
      const all = unique(options.available), visible = expanded ? parts.all : parts.primary;
      if (!options.hidden) {
        for (const type of visible) rail.append(createTile(type, all.indexOf(type)));
        for (const type of parts.pinned) end.append(createTile(type, all.indexOf(type)));
      }
      end.hidden = options.hidden || !parts.pinned.length;
      pile.dataset.hasEnd = String(!end.hidden);
      pile.hidden = Boolean(options.hidden);
      more.hidden = Boolean(options.hidden) || parts.more.length === 0;
      more.disabled = Boolean(options.disabled);
      more.textContent = expanded ? t("Fewer blocks", "Kevesebb lapka") : t("More blocks", "Több lapka");
      more.setAttribute("aria-expanded", String(expanded));
      rail.scrollLeft = remembered.get(scrollKey()) || 0;
      refresh(); schedule();
    }
    function update(nextOptions) {
      remember();
      const nextIdentity = String(nextOptions.key ?? "palette");
      if (identity !== nextIdentity) { identity = nextIdentity; expanded = remembered.get(identity + ":expanded") === true; gesture = null; }
      options = nextOptions;
      parts = partition(options);
      render();
    }
    function nudge(direction) {
      rail.scrollBy({ left: direction * Math.max(70, rail.clientWidth * .72), behavior: win.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      schedule();
    }
    on(previous, "click", () => nudge(-1)); on(next, "click", () => nudge(1));
    on(more, "click", () => {
      remember(); expanded = !expanded; remembered.set(identity + ":expanded", expanded);
      render();
    });
    on(rail, "scroll", () => { remember(); refresh(); }, { passive: true });
    on(pile, "wheel", event => {
      if (event.ctrlKey || event.metaKey || options.hidden) return;
      const raw = Math.abs(event.deltaX) >= Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = raw * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1);
      if (!delta || rail.scrollWidth <= rail.clientWidth + 1) return;
      const before = rail.scrollLeft; rail.scrollLeft += delta;
      if (rail.scrollLeft !== before) event.preventDefault();
      refresh();
    }, { passive: false });

    function pointerDown(event) {
      if (event.pointerType === "mouse" || options.hidden || !pile.contains(event.target)) return false;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rail.scrollLeft, time: win.performance.now(), mode: "pending" };
      return true;
    }
    function pointerMove(event) {
      if (!gesture || gesture.id !== event.pointerId) return false;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (gesture.mode === "pending") {
        if (Math.hypot(dx, dy) <= 8) return true;
        gesture.mode = win.performance.now() - gesture.time >= 350 || Math.abs(dy) > Math.abs(dx) ? "drag" : "pan";
      }
      if (gesture.mode === "drag") return false;
      event.preventDefault(); rail.scrollLeft = gesture.left - dx; refresh();
      return true;
    }
    function pointerUp(event) {
      if (!gesture || gesture.id !== event.pointerId) return false;
      const consumed = gesture.mode === "pan"; gesture = null;
      if (consumed) event.preventDefault();
      return consumed;
    }
    function pointerCancel() { gesture = null; }
    // Empty shelf space also pans, without involving the host's tile dragging.
    let background = null;
    on(pile, "pointerdown", event => {
      if (event.target.closest("button,[data-type]")) return;
      if (pointerDown(event)) { background = event.pointerId; pile.setPointerCapture?.(event.pointerId); }
    });
    on(pile, "pointermove", event => { if (event.pointerId === background) pointerMove(event); });
    on(pile, "pointerup", event => { if (event.pointerId === background) { pointerUp(event); background = null; } });
    on(pile, "pointercancel", () => { background = null; pointerCancel(); });
    const observer = win.ResizeObserver ? new win.ResizeObserver(schedule) : null;
    observer?.observe(pile); observer?.observe(rail);
    on(win, "resize", schedule);
    return Object.freeze({ update, refresh, pointerDown, pointerMove, pointerUp, pointerCancel });
  }
  global.PipBlockPalette = Object.freeze({ attach });
})(typeof window !== "undefined" ? window : globalThis);
