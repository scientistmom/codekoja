(() => {
  "use strict";

  // Trusted page-side boundary. Learner Python never runs in this context.
  // Runtime bytes are verified here, then copied into an opaque, offline frame.
  const base = new URL(".", document.currentScript.src);
  const cdn = "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/";
  const assets = Object.freeze({
    "pyodide.mjs": "sha384-8lqprsrmxmdc2BjV8nme9+4ousJcQna9/vCRAQVXawwVVDndT1H++Ick606YGbVJ",
    "pyodide.asm.mjs": "sha384-+T/LVoa+/iGCMcQPE4QgV8BRHmPPGrHpPPa0dVQXVf8gKsCpVP+KVFimHILfxTFs",
    "pyodide.asm.wasm": "sha384-StQ/LcXeYjPWo1PgKmb0FBwtsdStfnFAjnVSq1kz5f3ET72Q6yuWuNdwGJe11U6G",
    "python_stdlib.zip": "sha384-bZ29xjbjQEkohy6Noi0iTzDJPLoFvjKP86F5Yux3IXVTHN9yphbgeMkzHK0SI2gE",
    "pyodide-lock.json": "sha384-blZv4AqbC1b80Ewni76ioXtevw0tkLL70jJW0ELELCpSsLqqpvsDkWWioc749VXn",
  });
  const directions = ["up", "right", "down", "left"];
  const steps = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  const limits = Object.freeze({ code: 32000, scenarios: 4, events: 10000, output: 2000, packet: 2000000, time: 5000 });
  let prepared;

  async function resources() {
    if (prepared) return prepared;
    if (!("integrity" in Request.prototype)) throw new Error("This browser cannot verify Python resources");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    prepared = Promise.all([
      fetch(new URL("python-worker.js?v=56", base), { credentials: "omit", redirect: "error", signal: controller.signal })
        .then(response => { if (!response.ok) throw Error("Python runner unavailable"); return response.text(); }),
      Promise.all(Object.entries(assets).map(async ([name, integrity]) => {
        const response = await fetch(cdn + name, { integrity, credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", signal: controller.signal });
        if (!response.ok) throw Error("Python runtime unavailable");
        return [name, await response.arrayBuffer()];
      })).then(Object.fromEntries),
    ]).then(([source, files]) => ({ source, files })).catch(error => { prepared = null; controller.abort(); throw error; }).finally(() => clearTimeout(timer));
    return prepared;
  }

  function demand(condition) { if (!condition) throw new TypeError("Invalid Python runtime message"); }
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const point = (value, board) => value && integer(value.row, 0, board.height - 1) && integer(value.column, 0, board.width - 1);
  function text(value, max) { demand(typeof value === "string" && value.length <= max); return value; }

  function request(message) {
    demand(message?.type === "run" && integer(message.id, 1, Number.MAX_SAFE_INTEGER));
    const code = text(message.code, limits.code);
    demand(message.locale === "en" || message.locale === "hu");
    demand(Array.isArray(message.scenarios) && message.scenarios.length > 0 && message.scenarios.length <= limits.scenarios);
    const scenarios = message.scenarios.map(original => {
      const board = { width: original.width ?? 5, height: original.height ?? 5 };
      demand(integer(board.width, 1, 25) && integer(board.height, 1, 25));
      demand(point(original.start, board) && directions.includes(original.start.direction));
      board.start = { row: original.start.row, column: original.start.column, direction: original.start.direction };
      demand(original.goal == null || point(original.goal, board));
      board.goal = original.goal == null ? null : { row: original.goal.row, column: original.goal.column };
      demand(Array.isArray(original.obstacles) && original.obstacles.length <= board.width * board.height);
      board.obstacles = original.obstacles.map(cell => {
        demand(Array.isArray(cell) && cell.length === 2 && point({ row: cell[0], column: cell[1] }, board));
        return [...cell];
      });
      return board;
    });
    return { type: "run", id: message.id, code, locale: message.locale, scenarios };
  }

  function output(value) {
    demand(Array.isArray(value) && value.length <= limits.events);
    const clean = value.map(item => text(item, limits.output));
    demand(clean.reduce((sum, item) => sum + item.length, 0) <= limits.output);
    return clean;
  }

  function response(payload, run) {
    // Clone only recognised scalar fields. Never merge worker objects into UI state.
    demand(payload && JSON.stringify(payload).length <= limits.packet && typeof payload.ok === "boolean");
    const clean = { ok: payload.ok, locale: run.locale, results: [], partialResult: null, translations: {} };
    const maxLine = run.code.split("\n").length;
    const line = value => { demand(value == null || integer(value, 1, maxLine)); return value ?? null; };
    function result(value, board, partial = false) {
      demand(value && Array.isArray(value.events) && value.events.length <= limits.events);
      let row = board.start.row, column = board.start.column, facing = directions.indexOf(board.start.direction);
      let actions = 0, forwards = 0, successful = 0, reached = false;
      const printed = [];
      const events = value.events.map(event => {
        demand(event && !reached && ["forward", "left", "right", "obstacle", "goal", "print"].includes(event.type));
        if (["forward", "left", "right", "obstacle"].includes(event.type)) demand(++actions <= 160);
        if (event.type === "left") facing = (facing + 3) % 4;
        if (event.type === "right") facing = (facing + 1) % 4;
        const [dr, dc] = steps[facing];
        const target = { row: row + dr, column: column + dc };
        const blocked = !point(target, board) ? "wall" : board.obstacles.some(([r, c]) => r === target.row && c === target.column) ? "obstacle" : null;
        if (event.type === "forward") { demand(!blocked); row = target.row; column = target.column; forwards++; successful++; }
        if (event.type === "obstacle") { demand(blocked && event.obstacle_type === blocked && event.side === directions[facing]); forwards++; }
        if (event.type === "goal") { demand(board.goal && row === board.goal.row && column === board.goal.column); reached = true; }
        demand(event.row === row && event.column === column && event.direction === directions[facing]);
        const item = { type: event.type, row, column, direction: directions[facing], line: line(event.line) };
        if (event.type === "print") { item.text = text(event.text, limits.output); printed.push(item.text); }
        if (event.type === "obstacle") { item.side = directions[facing]; item.obstacle_type = blocked; }
        return item;
      });
      const lines = output(value.output);
      demand(JSON.stringify(lines) === JSON.stringify(printed));
      const item = { events, output: lines };
      if (!partial) {
        demand(value.state?.row === row && value.state?.column === column && value.state?.direction === directions[facing]);
        demand(value.state.goal_reached === reached && value.state.stopped === reached);
        item.state = { row, column, direction: directions[facing], goal_reached: reached, stopped: reached };
        item.metrics = { forward_executions: forwards, successful_steps: successful };
      }
      return item;
    }
    demand(Array.isArray(payload.results) && payload.results.length <= run.scenarios.length);
    clean.results = payload.results.map((value, index) => result(value, run.scenarios[index]));
    if (payload.ok) demand(clean.results.length === run.scenarios.length && payload.partialResult == null);
    else {
      demand(payload.error && clean.results.length < run.scenarios.length);
      clean.error = { type: text(payload.error.type, 100), message: text(payload.error.message, 500), line: line(payload.error.line) };
      clean.output = output(payload.output || []);
      if (payload.partialResult != null) clean.partialResult = result(payload.partialResult, run.scenarios[clean.results.length], true);
    }
    // Translations are a bounded list of text pairs, never executable markup.
    const entries = Object.entries(payload.translations || {});
    demand(entries.length <= 40);
    for (const [english, hungarian] of entries) {
      text(english, 500); text(hungarian, 500);
      demand(!["__proto__", "prototype", "constructor"].includes(english));
      Object.defineProperty(clean.translations, english, { value: hungarian, enumerable: true });
    }
    return clean;
  }

  class PythonRuntime extends EventTarget {
    #frame; #port; #generation = 0; #ready = false; #closed = false; #pending = null; #timer;
    constructor(locale) { super(); this.locale = locale === "hu" ? "hu" : "en"; void this.#start(); }
    #emit(data) { this.dispatchEvent(new MessageEvent("message", { data })); }
    #dispose() {
      this.#generation++; this.#ready = false;
      clearTimeout(this.#timer); this.#port?.close(); this.#frame?.remove();
      this.#port = null; this.#frame = null;
    }
    terminate() { this.#closed = true; this.#pending = null; this.#dispose(); }
    async #start() {
      const generation = this.#generation;
      try {
        const { source, files } = await resources();
        if (this.#closed || generation !== this.#generation) return;
        const frame = document.createElement("iframe");
        frame.hidden = true;
        frame.setAttribute("sandbox", "allow-scripts");
        frame.referrerPolicy = "no-referrer";
        this.#frame = frame;
        const loaded = new Promise((resolve, reject) => { frame.onload = resolve; frame.onerror = reject; });
        frame.src = new URL("python-sandbox.html?v=2", base).href;
        document.body.append(frame);
        this.#timer = setTimeout(() => this.#failed(), 60000);
        await loaded;
        if (this.#closed || generation !== this.#generation) return;
        const channel = new MessageChannel(); this.#port = channel.port1;
        channel.port1.onmessage = event => {
          if (this.#closed || generation !== this.#generation) return;
          const message = event.data;
          if (message?.type === "status" && message.state === "ready" && !this.#ready) {
            clearTimeout(this.#timer); this.#ready = true;
            this.#emit({ type: "status", state: "ready" }); this.#send();
          } else if (message?.type === "result" && this.#pending && message.id === this.#pending.id) {
            try {
              const payload = response(message.payload, this.#pending), id = this.#pending.id;
              this.#pending = null; this.#dispose();
              // A new opaque frame discards every learner-created worker/global.
              void this.#start(); this.#emit({ type: "result", id, payload });
            } catch { this.#rejected(); }
          } else this.#failed();
        };
        channel.port1.onmessageerror = () => this.#failed();
        frame.contentWindow.postMessage({ type: "initialize", source, assets: files, locale: this.locale }, "*", [channel.port2]);
      } catch { if (!this.#closed && generation === this.#generation) this.#failed(); }
    }
    #failed() { this.#pending = null; this.#dispose(); if (!this.#closed) this.dispatchEvent(new Event("error")); }
    #rejected(timeout = false) {
      const run = this.#pending;
      this.#pending = null; this.#dispose();
      if (!run) { this.#failed(); return; }
      void this.#start();
      const hu = run.locale === "hu";
      this.#emit({ type: "result", id: run.id, payload: { ok: false, locale: run.locale, results: [], output: [], partialResult: null, translations: {}, error: {
        type: timeout ? "ProgramLimitError" : "PythonError", line: null,
        message: timeout ? (hu ? "A program túl sokáig futott, ezért Koja leállította." : "Your program took too long, so Koja stopped it.")
          : (hu ? "A Python érvénytelen eredményt adott vissza. Próbáld újra." : "Python returned an invalid result. Try again."),
      } } });
    }
    #send() {
      if (!this.#ready || !this.#pending || this.#pending.sent) return;
      this.#pending.sent = true;
      this.#timer = setTimeout(() => this.#rejected(true), limits.time);
      this.#port.postMessage(this.#pending);
    }
    postMessage(message) {
      if (this.#closed || this.#pending) throw new Error("Python runtime is unavailable or busy");
      this.#pending = request(message); this.#send();
    }
  }
  window.PipPythonRuntime = Object.freeze({ create: locale => new PythonRuntime(locale) });
})();
