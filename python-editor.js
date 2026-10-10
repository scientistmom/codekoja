// Shared presentation for Python surfaces. The native app owns Monaco loading;
// additional editors reuse that runtime and the same presentation.
(function (global) {
  "use strict";
  const THEME = "pip-dark";
  const theme = {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "keyword", foreground: "C7A9FF" }, { token: "number", foreground: "F4C875" },
      { token: "string", foreground: "9BE6C3" }, { token: "comment", foreground: "8589A3", fontStyle: "italic" },
      { token: "identifier", foreground: "ECECF5" },
    ],
    colors: {
      "editor.background": "#24263A", "editor.foreground": "#ECECF5",
      "editorLineNumber.foreground": "#666A84", "editorLineNumber.activeForeground": "#B7A8F4",
      "editorCursor.foreground": "#B7A8F4", "editor.selectionBackground": "#51477A88",
      "editor.lineHighlightBackground": "#2B2D4388", "editorIndentGuide.background1": "#3A3C54",
      "editorIndentGuide.activeBackground1": "#7163A8",
    },
  };
  const defined = new WeakSet(), sourceViews = new Map();
  let nativeTools = null, runtime = null;
  const clone = value => JSON.parse(JSON.stringify(value));
  function options(locale = "en", overrides = {}) {
    return {
      theme: THEME, fontSize: 14, lineHeight: 24,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      minimap: { enabled: false }, glyphMargin: true, folding: false, lineNumbersMinChars: 3,
      overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollBeyondLastLine: false,
      smoothScrolling: true, padding: { top: 16, bottom: 16 }, automaticLayout: true,
      tabSize: 4, insertSpaces: true, detectIndentation: false, quickSuggestions: false,
      suggestOnTriggerCharacters: false, wordBasedSuggestions: "off",
      wordWrap: "on", contextmenu: locale !== "hu",
      hover: { enabled: false }, parameterHints: { enabled: false },
      suggest: { showWords: false }, inlineSuggest: { enabled: false },
      renderWhitespace: "selection", bracketPairColorization: { enabled: true },
      ...overrides,
    };
  }
  function defineTheme(monaco) {
    if (!monaco?.editor?.defineTheme || defined.has(monaco)) return;
    monaco.editor.defineTheme(THEME, clone(theme)); defined.add(monaco);
  }
  function registerMonaco(monaco) {
    if (!monaco?.editor?.create) return false;
    runtime = monaco; defineTheme(monaco);
    global.dispatchEvent?.(new global.CustomEvent("pip-monaco-ready", { detail: { monaco } }));
    for (const [host, value] of sourceViews) {
      if (host.isConnected === false) { sourceViews.delete(host); continue; }
      renderSource(host, value.source, value.markedLine);
    }
    return true;
  }
  function setNativeTools(provider) { nativeTools = typeof provider === "function" ? provider : null; }
  function getNativeTools(locale = global.PipLocale || "en") {
    const provided = nativeTools?.();
    const from = provided?.locale === "hu" ? "hu" : "en";
    return (provided?.tools || []).map(tool => {
      const result = { ...tool, code: tool.code ?? tool.snippet ?? "" };
      if (from !== locale && global.PipCodeTranslation) {
        const translated = global.PipCodeTranslation.translate(result.code, from, locale);
        if (tool.selection) {
          const start = result.code.indexOf(tool.selection);
          if (start >= 0) result.selection = translated.code.slice(
            global.PipCodeTranslation.mapOffset(start, translated.edits),
            global.PipCodeTranslation.mapOffset(start + tool.selection.length, translated.edits));
        }
        result.code = translated.code;
        result.label = global.PipCodeTranslation.translate(result.label, from, locale).code;
      }
      return result;
    });
  }

  function attach({ textarea, host, getLocale = () => global.PipLocale || "en", getEnabled = () => true,
    onChange = () => {}, onRun = () => {} }) {
    if (!textarea || !host) throw new Error("A Python editor needs its textarea and containing host.");
    let editor = null, model = null, syncing = false, notifying = false, decorations = [];
    const document = host.ownerDocument || global.document;
    const pane = document.createElement("div"); pane.className = "pip-python-monaco"; pane.setAttribute("aria-hidden", "true"); host.append(pane);
    host.classList.add("pip-python-editor"); textarea.classList.add("pip-python-textarea");
    const enabled = () => Boolean(getEnabled());
    const disposables = [];
    function getSelection() { return [textarea.selectionStart, textarea.selectionEnd, textarea.selectionDirection || "none"]; }
    function mirror() {
      if (!editor || syncing) return;
      const selection = editor.getSelection(); textarea.value = editor.getValue();
      if (selection) {
        const start = model.getOffsetAt({ lineNumber: selection.startLineNumber, column: selection.startColumn });
        const end = model.getOffsetAt({ lineNumber: selection.endLineNumber, column: selection.endColumn });
        const anchor = model.getOffsetAt({ lineNumber: selection.selectionStartLineNumber ?? selection.startLineNumber, column: selection.selectionStartColumn ?? selection.startColumn });
        textarea.setSelectionRange(start, end, anchor > start ? "backward" : "forward");
      }
      textarea.scrollTop = editor.getScrollTop(); textarea.scrollLeft = editor.getScrollLeft();
    }
    const codeFit = global.PipCodeFit?.attach({ host, textarea, getEditor: () => editor,
      getCode: () => editor ? editor.getValue() : textarea.value });
    function changed() {
      if (syncing) return;
      codeFit?.refresh();
      mirror(); notifying = true;
      try { onChange(); } finally { notifying = false; }
    }
    function applySelection(selection) {
      const [start, end, direction = "none"] = selection;
      textarea.setSelectionRange(start, end, direction);
      if (!editor) return;
      const a = model.getPositionAt(direction === "backward" ? end : start), b = model.getPositionAt(direction === "backward" ? start : end);
      editor.setSelection({ selectionStartLineNumber: a.lineNumber, selectionStartColumn: a.column,
        positionLineNumber: b.lineNumber, positionColumn: b.column });
    }
    function mount() {
      const monaco = runtime || global.PipEditorLoader?.runtime;
      if (editor || !monaco?.editor?.create || !monaco.editor.createModel) return;
      const selection = getSelection(), scroll = [textarea.scrollTop, textarea.scrollLeft], focused = document.activeElement === textarea;
      try {
        defineTheme(monaco);
        model = monaco.editor.createModel(textarea.value, "python");
        editor = monaco.editor.create(pane, options(getLocale(), { model, readOnly: !enabled() || textarea.readOnly }));
        disposables.push(editor.onDidChangeModelContent(changed));
        disposables.push(editor.onDidChangeCursorSelection(mirror));
        disposables.push(editor.onDidScrollChange(mirror));
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => { if (enabled()) onRun(); });
        host.classList.add("monaco-ready"); pane.setAttribute("aria-hidden", "false");
        syncing = true; applySelection(selection); editor.setScrollTop(scroll[0]); editor.setScrollLeft(scroll[1]); syncing = false;
        if (focused) editor.focus();
      } catch {
        syncing = false;
        for (const disposable of disposables.splice(0)) disposable?.dispose();
        editor?.dispose(); model?.dispose(); editor = model = null;
        host.classList.remove("monaco-ready"); pane.setAttribute("aria-hidden", "true");
      }
    }
    function sync({ preserveHistory = false } = {}) {
      mount();
      if (editor) {
        if (!notifying) {
          const selection = getSelection(), scroll = [textarea.scrollTop, textarea.scrollLeft];
          syncing = true;
          try {
            if (editor.getValue() !== textarea.value) {
              if (preserveHistory) {
                editor.pushUndoStop();
                editor.executeEdits("pip", [{ range: model.getFullModelRange(), text: textarea.value }]);
                editor.pushUndoStop();
              } else editor.setValue(textarea.value);
            }
            applySelection(selection); editor.setScrollTop(scroll[0]); editor.setScrollLeft(scroll[1]);
          } finally { syncing = false; }
        }
        editor.updateOptions({ readOnly: !enabled() || textarea.readOnly, contextmenu: getLocale() !== "hu" });
        if (host.clientWidth && host.clientHeight) editor.layout();
      }
      codeFit?.refresh();
    }
    function focus() { if (editor) editor.focus(); else textarea.focus({ preventScroll: true }); }
    function setSelection(selection) { syncing = true; try { applySelection(selection); } finally { syncing = false; } }
    function getView() {
      mirror();
      return { selection: getSelection(), scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft,
        monaco: editor?.saveViewState() || null };
    }
    function restoreView(view) {
      if (!view) return;
      sync(); syncing = true;
      try {
        if (editor && view.monaco) editor.restoreViewState(view.monaco);
        if (Array.isArray(view.selection)) applySelection(view.selection);
        textarea.scrollTop = view.scrollTop || 0; textarea.scrollLeft = view.scrollLeft || 0;
        editor?.setScrollTop(textarea.scrollTop); editor?.setScrollLeft(textarea.scrollLeft);
      } finally { syncing = false; }
    }
    function insert(text, { selection = "", inline = false } = {}) {
      if (!enabled()) return false;
      mirror();
      const start = textarea.selectionStart, end = textarea.selectionEnd;
      const before = textarea.value.slice(0, start), line = before.slice(before.lastIndexOf("\n") + 1);
      const prefix = !inline && before && !before.endsWith("\n") && !/^[ \t]*$/.test(line) ? "\n" : "";
      const suffix = !inline && !/\n[ \t]*$/.test(text) ? "\n" : "";
      const inserted = prefix + text + suffix;
      textarea.setRangeText(inserted, start, end, "end");
      if (selection && text.includes(selection)) {
        const at = start + prefix.length + text.indexOf(selection);
        textarea.setSelectionRange(at, at + selection.length);
      }
      sync({ preserveHistory: true }); focus(); changed(); return true;
    }
    function clearMarks() {
      textarea.classList.remove("hybrid-invalid");
      if (editor) decorations = editor.deltaDecorations(decorations, []);
    }
    function showLine(line) {
      if (!Number.isInteger(line) || line < 1) return;
      sync(); const lines = textarea.value.split("\n"); if (line > lines.length) return;
      const start = lines.slice(0, line - 1).reduce((sum, text) => sum + text.length + 1, 0);
      setSelection([start, start + lines[line - 1].length, "forward"]);
      textarea.classList.add("hybrid-invalid");
      if (editor) {
        const monaco = runtime || global.PipEditorLoader?.runtime;
        decorations = editor.deltaDecorations(decorations, [{ range: new monaco.Range(line, 1, line, 1),
          options: { isWholeLine: true, className: "pip-python-error-line" } }]);
        editor.revealLineInCenterIfOutsideViewport(line);
      } else textarea.scrollTop = Math.max(0, (line - 3) * 24);
      focus();
    }
    textarea.addEventListener("input", () => {
      // Textarea remains the public draft mirror, including programmatic input.
      if (editor) sync({ preserveHistory: true });
      changed();
    });
    textarea.addEventListener("keydown", event => {
      if (!enabled() || event.defaultPrevented || event.isComposing) return;
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); onRun(); return; }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (event.key === "Tab") { event.preventDefault(); textarea.setRangeText("    ", textarea.selectionStart, textarea.selectionEnd, "end"); changed(); }
      else if (event.key === "Enter") {
        event.preventDefault(); const before = textarea.value.slice(0, textarea.selectionStart), line = before.slice(before.lastIndexOf("\n") + 1);
        const indent = line.match(/^[ \t]*/)[0] + (/:[ \t]*$/.test(line) ? "    " : "");
        textarea.setRangeText("\n" + indent, textarea.selectionStart, textarea.selectionEnd, "end"); changed();
      }
    });
    global.addEventListener("pip-monaco-ready", sync);
    sync();
    return Object.freeze({ sync, insert, setValue(value) { textarea.value = String(value); sync(); },
      getView, restoreView, showLine, clearMarks });
  }

  const keywords = new Set("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
  function fallbackTokens(source) {
    const result = source.split("\n").map(() => []);
    const pattern = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|#[^\n]*|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|\b\d+(?:\.\d+)?\b|[\p{L}_][\p{L}\p{N}_]*)/gu;
    let line = 0, column = 0, last = 0;
    const push = (text, type) => {
      const chunks = text.split("\n");
      chunks.forEach((chunk, index) => { if (index) { line++; column = 0; } if (chunk) { result[line].push({ offset: column, type }); column += chunk.length; } });
    };
    for (const match of source.matchAll(pattern)) {
      push(source.slice(last, match.index), "");
      const text = match[0], type = text[0] === "#" ? "comment" : /^["']/.test(text) ? "string" : /^\d/.test(text) ? "number" : keywords.has(text) ? "keyword" : "identifier";
      push(text, type); last = match.index + text.length;
    }
    push(source.slice(last), ""); return result;
  }
  function renderSource(host, source, markedLine = null) {
    if (!host) return;
    source = String(source ?? ""); sourceViews.set(host, { source, markedLine });
    host.classList.add("pip-python-source");
    const document = host.ownerDocument || global.document, lines = source.split("\n");
    let tokens;
    try { tokens = (runtime || global.PipEditorLoader?.runtime)?.editor?.tokenize(source, "python"); } catch { /* Offline syntax colors remain available. */ }
    tokens ||= fallbackTokens(source);
    host.replaceChildren();
    lines.forEach((text, index) => {
      const line = document.createElement("span"); line.className = "hybrid-code-line"; line.dataset.line = index + 1;
      line.classList.toggle("hybrid-error-line", index + 1 === markedLine);
      const parts = tokens[index] || [];
      if (!parts.length) line.textContent = text || " ";
      else parts.forEach((part, i) => {
        const token = document.createElement("span"), kind = String(part.type).split(".")[0];
        if (["keyword", "number", "string", "comment", "identifier"].includes(kind)) token.className = "pip-python-token-" + kind;
        token.textContent = text.slice(part.offset, parts[i + 1]?.offset ?? text.length); line.append(token);
      });
      host.append(line);
    });
  }
  global.PipPythonEditor = Object.freeze({ options, defineTheme, registerMonaco, setNativeTools, getNativeTools,
    attach, renderSource });
})(typeof window !== "undefined" ? window : globalThis);
