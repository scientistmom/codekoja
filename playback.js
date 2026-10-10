// Shared playback pace for game animations. Execution stays
// in the Python worker; these delays only control the ordered visual playback.
(function attachPlayback(global) {
  "use strict";
  const factors = Object.freeze({ relaxed: 1.5, steady: 1, quick: .65 });
  const timings = Object.freeze({ run: 700, print: 900, start: 200, goal: 850 });
  let pace = "steady";
  try {
    const saved = localStorage.getItem("pip-python-lab.pace");
    if (Object.hasOwn(factors, saved)) pace = saved;
  } catch { /* Playback still works without storage. */ }
  global.PipPlayback = Object.freeze({
    get pace() { return pace; },
    delay(kind) {
      if (!Object.hasOwn(timings, kind)) throw new Error(`Unknown playback timing: ${kind}`);
      return Math.round(timings[kind] * factors[pace]);
    },
    setPace(next) {
      if (global.PipResetInProgress) return false;
      if (!Object.hasOwn(factors, next)) return false;
      pace = next;
      try { localStorage.setItem("pip-python-lab.pace", pace); } catch { /* Optional preference. */ }
      return true;
    },
  });
})(window);
