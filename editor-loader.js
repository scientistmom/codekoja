// Pinned, integrity-checked Monaco runtime shared by every Python editor.
// These are unchanged files from the published monaco-editor 0.57.0 package.
// The published editor index retains its normal contributions and accessibility
// fixes without editor.main's implicit stylesheet/worker loading. No eval here.
(function (global) {
  "use strict";

  const VERSION = "0.57.0";
  const BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${VERSION}/min/vs/`;
  const TIMEOUT = 45000;
  const assets = Object.freeze({
    "loader.js": "sha384-jwxunh5pHKFzi60XobDcwOM7qnk4lSGpdBU/hNn9pUGp+ZUpaHJqadNLRF2k+jPu",
    "editorWorkerHost-B_VpI68A.js": "sha384-rIPG+WRVloxnbIjzdw7y2Okz9CDO0u8Vi8Gp09YBtnrkMwRn5dEhgAkE5greTXHf",
    "editor-BdtEMBbM.js": "sha384-n5VxbIFjdhl1sERXQHN52h87EGviSdsndgKg9eRxZVuVsFtoxtLJDuY2UxnnGx/r",
    "toggleHighContrast-DuqAmExZ.js": "sha384-zovZc9/8c8IF6IlccJXAp+iG87TnOpWjJGqruAwc0mBMA0kLUjvfwMuUk2v7/oC6",
    "basic-languages/monaco.contribution.js": "sha384-dARM6n4x9CAIYeeAubpFsMJYzgq71sBO56m6168QU4cWImLc9epjmz8SU0oVWzFK",
    "monaco.contribution-C7tY_xnl.js": "sha384-jo4jpOtL8nkGqasdTIMzwY9JIOenaolL0vU6RniKo50hjp58iar6rCPzQUPYdie0",
    "monaco.contribution-BuX2NvO2.js": "sha384-paZFJ9QT7js5Eg4QZJ2SEPgsKFUBxjYGBxaIj7MzBRaqKteIBwel9zGjJXexKCvc",
    "monaco.contribution-D1-wBxcq.js": "sha384-7FZ6E/KHX5e4UzIROb8LCuxG91T1aLWSTiZnuirpfoFU0+oGXZwuMhgiX3hoUUqG",
    "monaco.contribution-CY2lwFI8.js": "sha384-zK2i3EQd8LlH/OC8S7X5Avgo6WU9s2+n3r70IwXdqOF7+IEELzBuzFq3ODYpfCgN",
    "index-DZH_zysX.js": "sha384-yNnuNecrK4FimNGhgAKu+RD8OSrutQ8nvhvqdTbZWcC7QIoFwajKEHg4sXKcjraK",
    "python-CasA8BlK.js": "sha384-WM3KLm9zzVxNiui9z7wEBxIobkem7iOja2Rq2kYH2BPgThbY+b/bCAgQC38ONi6b",
    "editor/editor.main.css": "sha384-h3Pml8012xDelgjWIfvjv8T/9ptDUnH1yJrSjj78OtB8P1yT/3pmrp6Y7S2cNUV4",
    "assets/editor.worker-_vAIFJDs.js": "sha384-psayb3uLnMlHxp/YTuNvOfDrVsX2rH3IVRrbjqI/WXnSrzh52WeFR9qtaXujpi2J",
  });
  let pending = null;
  let readyRuntime = null;

  function loadElement(file, stylesheet = false) {
    return new Promise((resolve, reject) => {
      const element = global.document.createElement(stylesheet ? "link" : "script");
      if (!("integrity" in element)) {
        reject(new Error("This browser cannot verify editor resources."));
        return;
      }
      element.integrity = assets[file];
      element.crossOrigin = "anonymous";
      element.referrerPolicy = "no-referrer";
      if (stylesheet) { element.rel = "stylesheet"; element.href = BASE + file; }
      else { element.async = false; element.src = BASE + file; }
      const timer = global.setTimeout(() => finish(new Error("Editor resource timed out.")), TIMEOUT);
      function finish(error) {
        global.clearTimeout(timer);
        element.onload = element.onerror = null;
        if (error) { element.remove(); reject(error); }
        else resolve();
      }
      element.onload = () => finish();
      element.onerror = () => finish(new Error("Editor resource could not be verified or loaded."));
      global.document.head.appendChild(element);
    });
  }

  async function prepareWorker() {
    const file = "assets/editor.worker-_vAIFJDs.js";
    // Worker() has no integrity option. Fetch verifies the complete published
    // worker before any of its bytes can run, then the document owns its Blob.
    if (!("integrity" in global.Request.prototype)) {
      throw new Error("This browser cannot verify the editor worker.");
    }
    const controller = new global.AbortController();
    const timer = global.setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await global.fetch(BASE + file, {
        mode: "cors", credentials: "omit", referrerPolicy: "no-referrer",
        integrity: assets[file], signal: controller.signal,
      });
      if (!response.ok) throw new Error("Editor worker could not be loaded.");
      return global.URL.createObjectURL(new global.Blob([await response.arrayBuffer()], {
        type: "application/javascript",
      }));
    } finally { global.clearTimeout(timer); }
  }

  async function prepareModules() {
    await loadElement("loader.js");
    if (typeof global.require?.config !== "function" || !global.define?.amd) {
      throw new Error("The editor module loader is unavailable.");
    }
    global.require.config({ paths: { vs: BASE.slice(0, -1) }, preferScriptTags: true });
    // Dependencies are loaded before their consumers so the AMD loader has no
    // reason to create unverified script tags for this Python-only runtime.
    // Despite its build-generated name, toggleHighContrast contains the full
    // standard editor contributions: suggestions, hover, find, keyboard actions.
    for (const file of [
      "editorWorkerHost-B_VpI68A.js", "editor-BdtEMBbM.js", "toggleHighContrast-DuqAmExZ.js",
      "basic-languages/monaco.contribution.js", "monaco.contribution-C7tY_xnl.js",
      "monaco.contribution-BuX2NvO2.js", "monaco.contribution-D1-wBxcq.js",
      "monaco.contribution-CY2lwFI8.js", "python-CasA8BlK.js", "index-DZH_zysX.js",
    ]) {
      await loadElement(file);
    }
    return new Promise((resolve, reject) => {
      global.require(["vs/index-DZH_zysX", "vs/python-CasA8BlK"], (entry, python) => resolve({ monaco: entry.monaco, python }), reject);
    });
  }

  async function start() {
    let workerURL = null;
    const previousMonaco = global.monaco;
    const previousEnvironment = global.MonacoEnvironment;
    try {
      const results = await Promise.allSettled([
        prepareModules(), loadElement("editor/editor.main.css", true), prepareWorker(),
      ]);
      if (results[2].status === "fulfilled") workerURL = results[2].value;
      const failed = results.find(result => result.status === "rejected");
      if (failed) throw failed.reason;
      const { monaco, python } = results[0].value;
      if (!monaco?.editor?.create || !python?.language || !python?.conf) {
        throw new Error("The verified Python editor is incomplete.");
      }
      global.MonacoEnvironment = {
        getWorker() { return new global.Worker(workerURL, { name: "codekoja-editor" }); },
      };
      // Monaco's own language registration uses the already verified Python
      // grammar above, including its normal lazy tokenization and indentation.
      global.monaco = monaco;
      // Keep this URL for the page lifetime: Monaco may create another worker
      // after an idle worker stops. The browser releases it with the document.
      readyRuntime = monaco;
      return monaco;
    } catch (error) {
      if (workerURL) global.URL.revokeObjectURL(workerURL);
      // The published core also exposes a global while its module evaluates.
      // Never let another workspace mount that partial runtime after a later
      // grammar, stylesheet, or worker integrity failure.
      if (previousMonaco === undefined) delete global.monaco;
      else global.monaco = previousMonaco;
      if (previousEnvironment === undefined) delete global.MonacoEnvironment;
      else global.MonacoEnvironment = previousEnvironment;
      throw error;
    }
  }

  global.PipEditorLoader = Object.freeze({
    get runtime() { return readyRuntime; },
    load() { return pending || (pending = start()); },
  });
})(window);
