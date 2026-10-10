// Runs only inside the opaque, network-disabled python-sandbox.html frame.
// The builtins below are teaching conveniences, not the security boundary.
let WORKER_LOCALE = "en";

const PYTHON_HARNESS = String.raw`
import json
import sys

USER_CODE = __pip_user_code
SCENARIOS = json.loads(__pip_scenarios)
try:
    LOCALE = __pip_locale
except NameError:
    LOCALE = "en"
if LOCALE not in {"en", "hu"}:
    LOCALE = "en"

UI_TRANSLATIONS = {}

def tr(english, hungarian):
    UI_TRANSLATIONS[english] = hungarian
    return hungarian if LOCALE == "hu" else english

FORWARD_NAME = tr("forward", "előre")
LEFT_NAME = tr("left", "balra")
RIGHT_NAME = tr("right", "jobbra")
SENSOR_NAME = tr("whats", "mit_lát")

RELATIVE_DIRECTION_INPUTS = (
    {
        "előre": 0,
        "balra": -1,
        "jobbra": 1,
        "mögötte": 2,
    }
    if LOCALE == "hu"
    else {
        "ahead": 0,
        "left": -1,
        "right": 1,
        "behind": 2,
    }
)
TILE_NAMES = (
    {
        "wall": "fal",
        "obstacle": "akadály",
        "goal": "cél",
        "clear": "szabad",
    }
    if LOCALE == "hu"
    else {
        "wall": "wall",
        "obstacle": "obstacle",
        "goal": "goal",
        "clear": "clear",
    }
)

class GoalReached(BaseException):
    """Stop the child's program immediately after Koja reaches the goal."""

class ProgramLimitError(Exception):
    pass

class GameRuntime:
    DIRECTIONS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    DIRECTION_NAMES = ["up", "right", "down", "left"]
    RELATIVE_DIRECTION_OFFSETS = RELATIVE_DIRECTION_INPUTS

    def __init__(self, config):
        start = config["start"]
        self.height = int(config.get("height", 5))
        self.width = int(config.get("width", 5))
        self.row = int(start["row"])
        self.column = int(start["column"])
        self.direction = self.DIRECTION_NAMES.index(start.get("direction", "right"))
        goal = config.get("goal")
        self.goal = (
            (int(goal["row"]), int(goal["column"]))
            if goal is not None
            else None
        )
        self.obstacles = {tuple(cell) for cell in config.get("obstacles", [])}
        self.events = []
        self.output = []
        self.output_length = 0
        self.stopped = False
        self.goal_reached = False
        self.action_count = 0
        self.line_count = 0
        self.current_line = None
        self.forward_executions = 0
        self.successful_steps = 0

    @property
    def direction_name(self):
        return self.DIRECTION_NAMES[self.direction]

    def trace(self, frame, event, arg):
        if frame.f_code.co_filename != "your_code.py":
            return self.trace

        if event == "line":
            self.line_count += 1
            self.current_line = frame.f_lineno
            if self.line_count > 8000:
                raise ProgramLimitError(tr(
                    "Your program kept repeating for too long.",
                    "A program túl sokáig ismételte ugyanazt.",
                ))
        return self.trace

    def event(self, kind, **details):
        item = {
            "type": kind,
            "row": self.row,
            "column": self.column,
            "direction": self.direction_name,
            "line": self.current_line,
        }
        item.update(details)
        self.events.append(item)

    def guard(self):
        self.action_count += 1
        if self.action_count > 160:
            raise ProgramLimitError(tr(
                "Koja received more than 160 actions. Try a loop that eventually stops.",
                "Koja több mint 160 parancsot kapott. "
                "Próbálj olyan ciklust írni, amely egyszer véget ér.",
            ))

    def check_goal(self):
        if (
            self.goal is not None
            and (self.row, self.column) == self.goal
            and not self.goal_reached
        ):
            self.goal_reached = True
            self.event("goal")
            self.stopped = True
            raise GoalReached()

    def forward(self):
        if self.stopped:
            return

        self.forward_executions += 1
        self.guard()
        dr, dc = self.DIRECTIONS[self.direction]
        next_row, next_column = self.row + dr, self.column + dc

        if not (0 <= next_row < self.height and 0 <= next_column < self.width):
            self.handle_obstacle("wall")
            return

        if (next_row, next_column) in self.obstacles:
            self.handle_obstacle("obstacle")
            return

        self.row, self.column = next_row, next_column
        self.successful_steps += 1
        self.event("forward")
        self.check_goal()

    def look_relative(self, direction_offset):
        direction = (self.direction + direction_offset) % len(self.DIRECTIONS)
        dr, dc = self.DIRECTIONS[direction]
        next_row, next_column = self.row + dr, self.column + dc

        if not (0 <= next_row < self.height and 0 <= next_column < self.width):
            return TILE_NAMES["wall"]
        if (next_row, next_column) in self.obstacles:
            return TILE_NAMES["obstacle"]
        if self.goal is not None and (next_row, next_column) == self.goal:
            return TILE_NAMES["goal"]
        return TILE_NAMES["clear"]

    def whats(self, direction):
        if (
            not isinstance(direction, str)
            or direction not in self.RELATIVE_DIRECTION_OFFSETS
        ):
            raise ValueError(tr(
                'whats() only understands "ahead", "left", "right", or "behind".',
                'A mit_lát() csak ezekkel az irányokkal használható: "előre", '
                '"balra", "jobbra" vagy "mögötte".',
            ))
        return self.look_relative(
            self.RELATIVE_DIRECTION_OFFSETS[direction]
        )

    def handle_obstacle(self, obstacle_type):
        direction = self.direction_name
        self.event(
            "obstacle",
            side=direction,
            obstacle_type=obstacle_type,
        )

    def left(self):
        if self.stopped:
            return
        self.guard()
        self.direction = (self.direction - 1) % 4
        self.event("left")

    def right(self):
        if self.stopped:
            return
        self.guard()
        self.direction = (self.direction + 1) % 4
        self.event("right")

    def safe_print(
        self,
        *values,
        sep=" ",
        end="\n",
        file=None,
        flush=False,
    ):
        # GoalReached can run a child's finally block while unwinding. Once Koja
        # reaches the star, the program is finished and must not emit more text.
        if self.stopped:
            return

        if file is not None:
            raise TypeError(tr(
                "print() can only write to the game output; file must be None.",
                "A print() csak a játék konzoljára írhat; a file értéke csak None lehet.",
            ))
        if sep is None:
            sep = " "
        elif not isinstance(sep, str):
            raise TypeError(tr(
                f"sep must be None or a string, not {type(sep).__name__}",
                f"A sep értéke csak None vagy szöveg lehet, nem {type(sep).__name__}.",
            ))
        if end is None:
            end = "\n"
        elif not isinstance(end, str):
            raise TypeError(tr(
                f"end must be None or a string, not {type(end).__name__}",
                f"Az end értéke csak None vagy szöveg lehet, nem {type(end).__name__}.",
            ))

        text = sep.join(str(value) for value in values) + end
        next_length = self.output_length + len(text)
        if next_length > 2000:
            raise ProgramLimitError(tr(
                "Your program printed more than 2,000 characters.",
                "A program több mint 2000 karaktert írt ki.",
            ))
        self.output.append(text)
        self.output_length = next_length
        self.event("print", text=text)

    def user_environment(self):
        safe_builtins = {
            "range": range,
            "len": len,
            "min": min,
            "max": max,
            "abs": abs,
            "round": round,
            "int": int,
            "str": str,
            "bool": bool,
            "Exception": Exception,
            "list": list,
            "tuple": tuple,
            "dict": dict,
            "set": set,
            "enumerate": enumerate,
            "zip": zip,
            "sum": sum,
            "any": any,
            "all": all,
            "print": self.safe_print,
        }
        environment = {
            "__builtins__": safe_builtins,
            "__name__": "__pip_program__",
        }
        environment.update({
            FORWARD_NAME: self.forward,
            LEFT_NAME: self.left,
            RIGHT_NAME: self.right,
            SENSOR_NAME: self.whats,
        })
        return environment

def error_details(error):
    line = getattr(error, "lineno", None)
    if line is None:
        tb = error.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "your_code.py":
                line = tb.tb_lineno
            tb = tb.tb_next
    message = str(getattr(error, "msg", None) or str(error))
    if len(message) > 500:
        message = message[:497] + "..."
    return {
        "type": type(error).__name__,
        "message": message,
        "line": line,
    }

try:
    # Execute the child's Python as written. The runtime records movements,
    # output and source lines; no scoring instrumentation changes the program.
    COMPILED_CODE = compile(USER_CODE, "your_code.py", "exec")
except Exception as error:
    RESULT = {
        "ok": False,
        "error": error_details(error),
        "output": [],
        "results": [],
        "partialResult": None,
    }
else:
    results = []
    top_error = None
    top_output = []
    top_partial_result = None

    for config in SCENARIOS:
        runtime = GameRuntime(config)
        environment = runtime.user_environment()

        try:
            sys.settrace(runtime.trace)
            exec(COMPILED_CODE, environment)
        except GoalReached:
            # Reaching the goal is successful completion, not a program error.
            pass
        except Exception as error:
            top_error = error_details(error)
            top_output = list(runtime.output)
            top_partial_result = {
                "events": list(runtime.events),
                "output": list(runtime.output),
            }
        finally:
            sys.settrace(None)

        if top_error is not None:
            break

        results.append({
            "events": runtime.events,
            "output": runtime.output,
            "state": {
                "row": runtime.row,
                "column": runtime.column,
                "direction": runtime.direction_name,
                "goal_reached": runtime.goal_reached,
                "stopped": runtime.stopped,
            },
            "metrics": {
                "forward_executions": runtime.forward_executions,
                "successful_steps": runtime.successful_steps,
            },
        })

    if top_error is not None:
        RESULT = {
            "ok": False,
            "error": top_error,
            "output": top_output,
            "results": results,
            "partialResult": top_partial_result,
        }
    else:
        RESULT = {
            "ok": True,
            "results": results,
            "partialResult": None,
        }

RESULT["locale"] = LOCALE
RESULT["translations"] = UI_TRANSLATIONS
json.dumps(RESULT)
`;

let pyodideReady;

async function preparePython(assets) {
  self.postMessage({ type: "status", state: "loading" });
  // Only two synthetic URLs are resolved, entirely from verified memory bytes.
  // Even a recovered native fetch is denied by the worker's browser-enforced CSP.
  const memoryBase = "https://runtime.invalid/";
  const responses = new Map([
    [memoryBase + "pyodide.asm.wasm", [assets["pyodide.asm.wasm"], "application/wasm"]],
    [memoryBase + "python_stdlib.zip", [assets["python_stdlib.zip"], "application/zip"]],
  ]);
  self.fetch = async input => {
    const asset = responses.get(String(input));
    if (!asset) throw new TypeError("Python cannot make network requests");
    return new Response(asset[0], { headers: { "Content-Type": asset[1] } });
  };
  const urls = ["pyodide.mjs", "pyodide.asm.mjs"].map(name => URL.createObjectURL(new Blob([assets[name]], { type: "text/javascript" })));
  const [{ loadPyodide }, { default: createPyodideModule }] = await Promise.all(urls.map(url => import(url)));
  const pyodide = await loadPyodide({ indexURL: memoryBase, stdLibURL: memoryBase + "python_stdlib.zip",
    lockFileContents: new TextDecoder().decode(assets["pyodide-lock.json"]), createPyodideModule });
  responses.clear();
  self.postMessage({ type: "status", state: "ready" });
  return pyodide;
}

function reportStartupFailure() {
  self.postMessage({ type: "status", state: "error" });
}
// A failed WebAssembly download can reject an internal promise while
// loadPyodide stays pending. Forward startup failures to the game's UI.
self.addEventListener("unhandledrejection", reportStartupFailure);
self.addEventListener("message", async (event) => {
  if (event.data?.type === "initialize" && !pyodideReady) {
    WORKER_LOCALE = event.data.locale === "hu" ? "hu" : "en";
    pyodideReady = preparePython(event.data.assets);
    pyodideReady.then(() => self.removeEventListener("unhandledrejection", reportStartupFailure), reportStartupFailure);
    return;
  }
  if (event.data?.type !== "run" || !pyodideReady) return;

  const { id, code, scenarios, locale } = event.data;
  const runLocale =
    locale === "en" || locale === "hu" ? locale : WORKER_LOCALE;

  try {
    const pyodide = await pyodideReady;
    pyodide.globals.set("__pip_user_code", code);
    pyodide.globals.set("__pip_locale", runLocale);
    pyodide.globals.set("__pip_scenarios", JSON.stringify(scenarios));
    const rawResult = await pyodide.runPythonAsync(PYTHON_HARNESS);
    if (typeof rawResult !== "string" || rawResult.length > 2000000) throw new Error("Python result is too large");
    self.postMessage({ type: "result", id, payload: JSON.parse(rawResult) });
  } catch (error) {
    const rawMessage = String(error?.message || error);
    const message =
      rawMessage.length > 500 ? `${rawMessage.slice(0, 497)}...` : rawMessage;
    self.postMessage({
      type: "result",
      id,
      payload: {
        ok: false,
        error: {
          type: error?.name || "PythonError",
          message,
          line: null,
        },
        output: [],
        results: [],
        partialResult: null,
      },
    });
  } finally {
    try {
      const pyodide = await pyodideReady;
      pyodide.globals.delete("__pip_user_code");
      pyodide.globals.delete("__pip_locale");
      pyodide.globals.delete("__pip_scenarios");
    } catch {
      // The worker may be terminated while Python is running.
    }
  }
});
