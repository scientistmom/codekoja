// Deliberately small structural translator. Unsupported Python is not flattened
// into a movement trace: callers omit that task instead.
(function (global) {
  "use strict";

  const ACTIONS = { forward: "FORWARD", left: "TURN_LEFT", right: "TURN_RIGHT" };
  const RESERVED_COUNTERS = new Set(["forward", "left", "right", "whats", "range", "main", "print", ..."False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" ")]);
  const GREETING = /^print\(\s*(["'])Hello, (?:Koja|Blob|Pip)!\1\s*\)$/;

  function fromLines(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.every(line => typeof line === "string")) return value.join("\n");
    throw new TypeError("Python source must be a string or an array of source lines.");
  }

  function withoutComment(line) {
    let quote = null, escaped = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (escaped) { escaped = false; continue; }
      if (quote && character === "\\") { escaped = true; continue; }
      if (quote) { if (character === quote) quote = null; }
      else if (character === '"' || character === "'") quote = character;
      else if (character === "#") return line.slice(0, index);
    }
    return line;
  }

  /**
   * translate(string, {allowPresentation:false}) returns cards and a parallel
   * lineMap of original 1-based Python lines (null for synthetic END cards).
   * Rejections expose no cards.
   * Only the standard, sole main() entry wrapper and its first Hello, Koja!
   * greeting may be projected away when allowPresentation is explicitly true.
   */
  function translate(source, options = {}) {
    const reject = (code, line, message) => {
      throw Object.assign(new Error(message), { translationCode: code, sourceLine: line });
    };
    try {
      if (typeof source !== "string") reject("invalid-source", null, "Expected Python source text.");
      if (source.length > 50000) reject("source-limit", null, "Python source is too long for a block task.");
      let tokens = source.replace(/\r\n/g, "\n").split("\n").flatMap((raw, index) => {
        const content = withoutComment(raw).trimEnd();
        if (!content.trim()) return [];
        if (/^[ \t]*\t/.test(content)) reject("indentation", index + 1, "Use spaces for Python indentation.");
        return [{ text: content.trimStart(), indent: content.length - content.trimStart().length, line: index + 1 }];
      });
      if (options.allowPresentation === true && tokens[0]?.text === "def main():" && tokens[0].indent === 0) {
        const first = tokens[0], last = tokens.at(-1), body = tokens.slice(1, -1);
        if (last === first || last.text !== "main()" || last.indent !== 0 || !body.length || body.some(token => token.indent === 0)) {
          reject("unsupported-wrapper", first.line, "Only one outer main() definition followed by its call can be translated.");
        }
        const indentation = body[0].indent;
        if (body.some(token => token.indent < indentation)) reject("indentation", first.line, "The main() body has inconsistent indentation.");
        tokens = body.map(token => ({ ...token, indent: token.indent - indentation }));
      }
      if (options.allowPresentation === true && tokens[0]?.indent === 0 && GREETING.test(tokens[0].text)) {
        tokens = tokens.slice(1);
      }
      if (tokens.length && tokens[0].indent !== 0) reject("indentation", tokens[0].line, "The program must start without indentation.");
      const cards = [], lineMap = [];
      const add = (card, line) => { cards.push(card); lineMap.push(line); };
      let cursor = 0;
      function suite(indentation, depth) {
        if (depth > 64) reject("nesting-limit", tokens[cursor]?.line || null, "The program is nested too deeply.");
        while (cursor < tokens.length && tokens[cursor].indent >= indentation) {
          const token = tokens[cursor];
          if (token.indent !== indentation) reject("indentation", token.line, "Unexpected indentation.");
          cursor++;
          const action = /^(forward|left|right)\(\s*\)$/.exec(token.text);
          if (action) { add(ACTIONS[action[1]], token.line); continue; }
          if (token.text === "pass") continue;
          const repeat = /^for\s+([A-Za-z_]\w*)\s+in\s+range\(\s*(2|3|4|7|12)\s*\)\s*:$/.exec(token.text);
          const condition = /^(if|while)\s+whats\(\s*(["'])ahead\2\s*\)\s*(==|!=)\s*(["'])(clear|wall|obstacle|goal)\4\s*:$/.exec(token.text);
          let card = null;
          if (repeat) {
            if (RESERVED_COUNTERS.has(repeat[1])) reject("shadowed-function", token.line, "The loop counter replaces a game or Python function.");
            card = `FOR_${repeat[2]}`;
          } else if (condition) {
            const [, kind, , comparison, , tile] = condition;
            if (comparison === "==" && (kind === "if" || tile !== "goal")) card = `${kind.toUpperCase()}_${tile.toUpperCase()}`;
            else if (kind === "while" && comparison === "!=" && tile === "goal") card = "WHILE_NOT_GOAL";
          }
          if (!card) reject("unsupported-python", token.line, "This Python statement has no matching block.");
          if (!tokens[cursor] || tokens[cursor].indent <= indentation) reject("missing-body", token.line, "The Python structure needs an indented body.");
          add(card, token.line);
          suite(tokens[cursor].indent, depth + 1);
          add("END", null);
        }
      }
      suite(0, 0);
      return { ok: true, cards, lineMap, error: null };
    } catch (error) {
      const detail = { code: error.translationCode || "invalid-source", line: error.sourceLine || null, message: error.message };
      return { ok: false, cards: [], lineMap: [], reason: detail.code, error: detail };
    }
  }

  global.PipBlocksPython = Object.freeze({ translate, fromLines });
})(typeof window !== "undefined" ? window : globalThis);
