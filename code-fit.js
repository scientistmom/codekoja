// Fit authored examples and children’s drafts without shrinking the type or
// changing their text, caret, selection, or editor history.
(function (global) {
  "use strict";
  const PROPERTY = "--pip-code-height";
  const number = value => Number.parseFloat(value) || 0;

  function attach({ host, textarea, getEditor = () => null, getCode = () => textarea.value }) {
    if (!host || !textarea) throw new Error("Code fitting needs an editor host and textarea.");
    const document = host.ownerDocument || global.document;
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    Object.assign(mirror.style, {
      position: "fixed", left: "-100000px", top: "0", display: "block", visibility: "hidden",
      pointerEvents: "none", boxSizing: "border-box", height: "auto", minHeight: "0", maxHeight: "none",
      margin: "0", border: "0", overflow: "hidden", whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "normal",
    });
    (document.body || host).append(mirror);
    host.setAttribute("data-code-fit", "");
    let frame = null, editor = null, editorEvents = [], lastValue = null, lastSource = null, lines = [];
    const requestFrame = callback => global.requestAnimationFrame ? global.requestAnimationFrame(callback) : global.setTimeout(callback, 0);
    const style = element => global.getComputedStyle(element);
    function visibleWidth() {
      // A hidden workspace must not collapse its cached size to zero.
      if (!host.clientWidth) return 0;
      return textarea.clientWidth || textarea.getBoundingClientRect().width
        || (editor ? editor.getLayoutInfo?.().width || host.clientWidth : 0);
    }
    function bindEditor() {
      const next = getEditor();
      if (next === editor) return;
      editorEvents.forEach(event => event?.dispose()); editorEvents = []; editor = next;
      if (editor) {
        for (const name of ["onDidContentSizeChange", "onDidChangeModel"]) {
          const event = editor[name]?.(refresh);
          if (event) editorEvents.push(event);
        }
      }
    }
    function measureFallback() {
      const width = visibleWidth();
      if (!width) return null;
      const source = String(getCode() ?? ""), computed = style(textarea);
      const lineHeight = number(computed.lineHeight) || number(computed.fontSize) * 1.2 || 24;
      Object.assign(mirror.style, {
        width: `${width}px`, font: computed.font, fontFamily: computed.fontFamily,
        fontSize: computed.fontSize, fontWeight: computed.fontWeight, fontStyle: computed.fontStyle,
        lineHeight: `${lineHeight}px`, letterSpacing: computed.letterSpacing,
        tabSize: computed.tabSize || "4", paddingTop: computed.paddingTop, paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom, paddingLeft: computed.paddingLeft,
      });
      if (source !== lastSource) {
        lastSource = source;
        lines = source.split("\n").map(text => {
          const line = document.createElement("span");
          line.style.display = "block";
          // An empty final line still occupies a line after the last newline.
          line.textContent = text || "\u200b";
          return line;
        });
        mirror.replaceChildren(...lines);
      }
      for (const line of lines) line.style.minHeight = `${lineHeight}px`;
      return mirror.getBoundingClientRect();
    }
    function measure() {
      frame = null;
      bindEditor();
      if (!visibleWidth()) return;
      const contentHeight = editor ? editor.getContentHeight() : measureFallback()?.height;
      if (!Number.isFinite(contentHeight) || contentHeight <= 0) return;
      const computed = style(host);
      const value = `${Math.ceil(contentHeight + number(computed.borderTopWidth) + number(computed.borderBottomWidth))}px`;
      if (value === lastValue && host.style.getPropertyValue(PROPERTY) === value) return;
      lastValue = value; host.style.setProperty(PROPERTY, value);
    }
    function refresh() {
      if (frame !== null) return;
      frame = requestFrame(measure);
    }
    function lineBox(startLine, endLine = startLine) {
      if (!Number.isInteger(startLine) || !Number.isInteger(endLine) || startLine < 1 || endLine < startLine) return null;
      const rect = measureFallback(), first = lines[startLine - 1], last = lines[endLine - 1];
      if (!rect || !first || !last) return null;
      const a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
      return { top: a.top - rect.top, height: b.bottom - a.top };
    }
    textarea.addEventListener("input", refresh);
    const observer = global.ResizeObserver ? new global.ResizeObserver(refresh) : null;
    observer?.observe(host);
    refresh();
    return Object.freeze({ refresh, lineBox });
  }
  global.PipCodeFit = Object.freeze({ attach });
})(typeof window !== "undefined" ? window : globalThis);
