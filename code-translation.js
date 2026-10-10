// Token-aware translation of Koja's vocabulary; never replace arbitrary substrings.
(function attachCodeTranslation(global) {
  "use strict";
  const API = { forward: "előre", left: "balra", right: "jobbra", whats: "mit_lát" };
  const WORDS = { ahead: "előre", left: "balra", right: "jobbra", behind: "mögötte",
    clear: "szabad", wall: "fal", obstacle: "akadály", goal: "cél", "Hello, Koja!": "Szia, Koja!", "Hello, Blob!": "Szia, Blob!", "Hello, Pip!": "Szia, Pip!" };
  const identifierStart = /[\p{L}_]/u;
  const identifierPart = /[\p{L}\p{N}\p{M}_]/u;
  const invert = (map) => Object.fromEntries(Object.entries(map).map(([a, b]) => [b, a]));
  const englishNames = invert(API), englishWords = invert(WORDS);

  function translate(source, from, to, guidance = []) {
    const edits = [];
    if (from === to) return { code: source, edits };
    if (![from, to].every((locale) => ["en", "hu"].includes(locale))) throw new Error("Unsupported language");
    const comments = new Map(guidance.map(pair => to === "hu" ? pair : [pair[1], pair[0]]));
    const names = to === "hu" ? API : englishNames;
    const words = to === "hu" ? WORDS : englishWords;
    const identifiers = new Set();
    function replace(start, end, text) { edits.push({ start, end, text }); }
    function scan(start, end, expression = false) {
      let i = start;
      let previous = "";
      let depth = 0;
      while (i < end) {
        const character = String.fromCodePoint(source.codePointAt(i));
        if (expression && character === "}" && depth === 0) return i;
        if (character === "#") {
          const start = i;
          while (i < end && source[i] !== "\n") i++;
          const comment = source.slice(start, i).trimEnd();
          // Only exact, authored whole-line guidance is localized. A child's prose stays theirs.
          if (!expression && !source.slice(source.lastIndexOf("\n", start - 1) + 1, start).trim() && comments.has(comment)) {
            replace(start, start + comment.length, comments.get(comment));
          }
          continue;
        }
        let prefix = "";
        let quoteAt = i;
        const prefixed = source.slice(i, end).match(/^([rRuUbBfF]{1,2})(?=['"])/);
        if (prefixed) { prefix = prefixed[1].toLowerCase(); quoteAt += prefix.length; }
        if (source[quoteAt] === "'" || source[quoteAt] === '"') {
          const quote = source[quoteAt];
          const delimiter = source.startsWith(quote.repeat(3), quoteAt) ? quote.repeat(3) : quote;
          const bodyStart = quoteAt + delimiter.length;
          let cursor = bodyStart;
          while (cursor < end && !source.startsWith(delimiter, cursor)) {
            if (source[cursor] === "\\") { cursor += 2; continue; }
            if (prefix.includes("f") && source[cursor] === "{") {
              if (source[cursor + 1] === "{") { cursor += 2; continue; }
              cursor = scan(cursor + 1, end, true) + 1;
            } else cursor++;
          }
          if (cursor >= end) return end; // Keep unfinished strings intact while editing.
          if (!prefix.includes("b") && !prefix.includes("f")) {
            const raw = source.slice(bodyStart, cursor);
            const value = prefix.includes("r") ? raw : raw.replace(/\\(?:x([0-9a-f]{2})|u([0-9a-f]{4})|U([0-9a-f]{8})|([0-7]{1,3})|([\\'"abfnrtv]))/gi,
              (_, x, u, U, octal, simple) => x || u || U || octal
                ? String.fromCodePoint(Math.min(0x10ffff, parseInt(x || u || U || octal, octal ? 8 : 16)))
                : ({ a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v" }[simple] || simple));
            if (Object.hasOwn(words, value)) replace(bodyStart, cursor, words[value]);
          }
          i = cursor + delimiter.length;
          previous = "string";
          continue;
        }
        if (identifierStart.test(character)) {
          let stop = i + character.length;
          while (stop < end) {
            const next = String.fromCodePoint(source.codePointAt(stop));
            if (!identifierPart.test(next)) break;
            stop += next.length;
          }
          const name = source.slice(i, stop);
          if (previous !== ".") {
            identifiers.add(name);
            if (Object.hasOwn(names, name)) {
              if (["def", "class", "import"].includes(previous)) throw new Error("A custom definition shadows a Koja command: " + name);
              replace(i, stop, names[name]);
            }
          }
          previous = name;
          i = stop;
          continue;
        }
        if (character === "{") depth++;
        if (character === "}") depth--;
        if (!/\s/.test(character)) previous = character;
        i++;
      }
      return i;
    }
    scan(0, source.length);
    // Refuse ambiguous bindings instead of silently changing the child's program.
    for (const [name, target] of Object.entries(names)) {
      if (identifiers.has(name) && identifiers.has(target)) {
        throw new Error(`Both ${name} and ${target} are used as names.`);
      }
    }
    edits.sort((a, b) => a.start - b.start);
    const parts = [];
    let offset = 0;
    for (const edit of edits) {
      parts.push(source.slice(offset, edit.start), edit.text);
      offset = edit.end;
    }
    parts.push(source.slice(offset));
    return { code: parts.join(""), edits };
  }

  function mapOffset(offset, edits) {
    let delta = 0;
    for (const edit of edits) {
      if (offset < edit.start) break;
      if (offset === edit.end) return edit.start + delta + edit.text.length;
      if (offset < edit.end) return edit.start + delta + Math.min(offset - edit.start, edit.text.length);
      delta += edit.text.length - (edit.end - edit.start);
    }
    return offset + delta;
  }
  global.PipCodeTranslation = Object.freeze({ translate, mapOffset });
})(typeof window === "undefined" ? globalThis : window);
