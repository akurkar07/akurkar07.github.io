(() => {
  const PYODIDE_VERSION = "0.26.4";
  const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const SOURCE_BASE = "https://raw.githubusercontent.com/akurkar07/Interpreter/main/src/";
  const MODULES = [
    "tokens.py",
    "nodes.py",
    "visitor.py",
    "Lexer.py",
    "Parser.py",
    "SemanticAnalyser.py",
    "interpreter.py",
    "bytecode.py",
    "vm.py",
  ];

  const samples = {
    triangle: `PROGRAM triangle;

VAR
    n, r, limit, spaces : INTEGER;

FUNCTION factorial(n : INTEGER) : INTEGER;
BEGIN
    IF n <= 1 THEN
        factorial := 1
    ELSE
        factorial := n * factorial(n - 1);
END;

FUNCTION choose(n, r : INTEGER) : INTEGER;
BEGIN
    choose := factorial(n) DIV (factorial(n - r) * factorial(r));
END;

BEGIN
    limit := 7;
    FOR n := 0 TO limit - 1 DO
    BEGIN
        FOR spaces := 0 TO limit - n - 1 DO
            WRITE(' ');
        FOR r := 0 TO n DO
        BEGIN
            WRITE(choose(n, r));
            WRITE(' ');
        END;
        WRITELN('');
    END;
END.`,
    factorial: `PROGRAM recursion;

FUNCTION Factorial(n : INTEGER) : INTEGER;
BEGIN
    IF n = 1 THEN
        Factorial := 1
    ELSE
        Factorial := n * Factorial(n - 1);
END;

BEGIN
    WRITELN(Factorial(5));
END.`,
    strings: `PROGRAM string_recursion;

PROCEDURE Recurse(str : STRING; depth : INTEGER);
BEGIN
    WRITELN(str + 'a');
    IF depth > 0 THEN
        Recurse(str + 'a', depth - 1);
END;

BEGIN
    Recurse('', 5);
END.`,
  };

  const demo = document.getElementById("interpreter-demo");
  if (!demo) {
    return;
  }

  const source = document.getElementById("interpreter-source");
  const sample = document.getElementById("interpreter-sample");
  const mode = document.getElementById("interpreter-mode");
  const runButton = document.getElementById("interpreter-run");
  const resetButton = document.getElementById("interpreter-reset");
  const status = document.getElementById("interpreter-status");
  const output = document.getElementById("interpreter-output");
  const bytecode = document.getElementById("interpreter-bytecode");
  const scope = document.getElementById("interpreter-scope");
  let pyodidePromise = null;
  let runtimeReady = false;

  function setStatus(message) {
    status.textContent = message;
  }

  function setBusy(isBusy) {
    runButton.disabled = isBusy;
    resetButton.disabled = isBusy;
    sample.disabled = isBusy;
    mode.disabled = isBusy;
    runButton.textContent = isBusy ? "Running..." : "Run";
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function fetchModule(name) {
    const response = await fetch(`${SOURCE_BASE}${name}`, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Could not fetch ${name}`);
    }
    return response.text();
  }

  async function prepareRuntime() {
    if (pyodidePromise) {
      return pyodidePromise;
    }

    pyodidePromise = (async () => {
      setStatus("Loading Pyodide...");
      await loadScript(`${PYODIDE_BASE}pyodide.js`);
      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_BASE });

      setStatus("Fetching interpreter modules...");
      const files = await Promise.all(MODULES.map(async (name) => [name, await fetchModule(name)]));
      files.forEach(([name, contents]) => {
        pyodide.FS.writeFile(`/home/pyodide/${name}`, contents);
      });

      pyodide.runPython(`
import json
import sys
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO

sys.path.insert(0, "/home/pyodide")

from Lexer import Lexer
from Parser import Parser
from SemanticAnalyser import SemanticAnalyser
from interpreter import Interpreter
from bytecode import BytecodeVisitor
from vm import VirtualMachine

def run_pascal_demo(source, mode):
    stdout = StringIO()
    stderr = StringIO()
    result = {
        "ok": True,
        "output": "",
        "bytecode": "",
        "scope": "{}",
        "error": "",
    }

    try:
        with redirect_stdout(stdout), redirect_stderr(stderr):
            lexer = Lexer(source)
            parser = Parser(lexer)
            ast = parser.parse()

            semantic_analyser = SemanticAnalyser()
            semantic_analyser.visit(ast)

            bytecode_visitor = BytecodeVisitor()
            bytecode_visitor.visit(ast)
            result["bytecode"] = bytecode_visitor.bytecode

            if mode == "tree":
                interpreter = Interpreter()
                interpreter.visit(ast)
                result["scope"] = json.dumps(interpreter.scopes[0], indent=2, default=str)
            else:
                vm = VirtualMachine(bytecode_visitor.bytecode)
                vm.execute()
                result["scope"] = json.dumps(vm.frames[0]["locals"], indent=2, default=str)

        result["output"] = stdout.getvalue()
        stderr_value = stderr.getvalue()
        if stderr_value:
            result["output"] += stderr_value
    except Exception as exc:
        result["ok"] = False
        result["error"] = str(exc)
        result["output"] = stdout.getvalue()

    return json.dumps(result)
`);

      runtimeReady = true;
      setStatus("Runtime ready.");
      return pyodide;
    })();

    return pyodidePromise;
  }

  function warmRuntime() {
    if (!runtimeReady && !pyodidePromise) {
      prepareRuntime().catch((error) => {
        setStatus(error.message);
      });
    }
  }

  async function runProgram() {
    setBusy(true);
    output.textContent = "";
    bytecode.textContent = "";
    scope.textContent = "";

    try {
      const pyodide = await prepareRuntime();
      setStatus("Executing program...");
      const resultJson = await pyodide.runPythonAsync(
        `run_pascal_demo(${JSON.stringify(source.value)}, ${JSON.stringify(mode.value)})`
      );
      const result = JSON.parse(resultJson);
      output.textContent = result.ok ? result.output || "(no output)" : `${result.output}${result.error}`;
      bytecode.textContent = result.bytecode || "(bytecode unavailable)";
      scope.textContent = result.scope || "{}";
      setStatus(result.ok ? "Finished." : "Program stopped with an error.");
    } catch (error) {
      output.textContent = error.message;
      bytecode.textContent = "(bytecode unavailable)";
      scope.textContent = "{}";
      setStatus("Runtime error.");
    } finally {
      setBusy(false);
    }
  }

  function resetSample() {
    source.value = samples[sample.value];
    output.textContent = "";
    bytecode.textContent = "";
    scope.textContent = "";
  }

  function activatePanel(name) {
    document.querySelectorAll(".interpreter-tab").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.panel === name));
    });
    document.querySelectorAll(".interpreter-panel").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
  }

  resetSample();
  sample.addEventListener("change", resetSample);
  resetButton.addEventListener("click", resetSample);
  runButton.addEventListener("click", runProgram);
  runButton.addEventListener("pointerenter", warmRuntime, { once: true });
  runButton.addEventListener("focus", warmRuntime, { once: true });
  document.querySelectorAll(".interpreter-tab").forEach((button) => {
    button.addEventListener("click", () => activatePanel(button.dataset.panel));
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        warmRuntime();
        observer.disconnect();
      }
    });
    observer.observe(demo);
  } else if ("requestIdleCallback" in window) {
    window.requestIdleCallback(warmRuntime, { timeout: 2500 });
  } else {
    window.setTimeout(warmRuntime, 1200);
  }
})();
