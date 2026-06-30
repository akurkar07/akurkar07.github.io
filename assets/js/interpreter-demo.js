(() => {
  const PYODIDE_VERSION = "0.26.4";
  const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const SOURCE_BASE = "https://raw.githubusercontent.com/akurkar07/Interpreter/main/src/pascal/";
  const SAMPLE_BASE = "samples/pascal/";
  const MODULES = [
    "__init__.py",
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

  const demo = document.getElementById("interpreter-demo");
  if (!demo) {
    return;
  }

  const source = document.getElementById("interpreter-source");
  const sample = document.getElementById("interpreter-sample");
  const sourceLines = document.getElementById("interpreter-source-lines");
  const mode = document.getElementById("interpreter-mode");
  const runButton = document.getElementById("interpreter-run");
  const resetButton = document.getElementById("interpreter-reset");
  const downloadSourceButton = document.getElementById("interpreter-download-source");
  const downloadResultButton = document.getElementById("interpreter-download-result");
  const inputsPanel = document.getElementById("interpreter-inputs");
  const inputGrid = document.getElementById("interpreter-input-grid");
  const status = document.getElementById("interpreter-status");
  const output = document.getElementById("interpreter-output");
  const bytecode = document.getElementById("interpreter-bytecode");
  const bytecodeLines = document.getElementById("interpreter-bytecode-lines");
  const astVisual = document.getElementById("interpreter-ast-visual");
  const astCanvas = document.getElementById("interpreter-ast-canvas");
  const astZoomOut = document.getElementById("interpreter-ast-zoom-out");
  const astZoomReset = document.getElementById("interpreter-ast-zoom-reset");
  const astZoomIn = document.getElementById("interpreter-ast-zoom-in");
  const astFullscreen = document.getElementById("interpreter-ast-fullscreen");
  const astModal = document.getElementById("interpreter-ast-modal");
  const astModalCanvas = document.getElementById("interpreter-ast-modal-canvas");
  const astModalZoomOut = document.getElementById("interpreter-ast-modal-zoom-out");
  const astModalZoomReset = document.getElementById("interpreter-ast-modal-zoom-reset");
  const astModalZoomIn = document.getElementById("interpreter-ast-modal-zoom-in");
  const astModalClose = document.getElementById("interpreter-ast-modal-close");
  const inspectionTab = document.getElementById("interpreter-inspection-tab");
  const scope = document.getElementById("interpreter-scope");
  let pyodidePromise = null;
  let runtimeReady = false;
  let activePanel = "output";
  let demoInputs = [];
  let astZoom = 1;
  let astModalZoom = 1;
  let currentAstTree = null;

  function setStatus(message) {
    status.textContent = message;
  }

  function setBusy(isBusy) {
    runButton.disabled = isBusy;
    resetButton.disabled = isBusy;
    sample.disabled = isBusy;
    mode.disabled = isBusy;
    inputGrid.querySelectorAll("input").forEach((input) => {
      input.disabled = isBusy;
    });
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
      pyodide.FS.mkdirTree("/home/pyodide/pascal");
      files.forEach(([name, contents]) => {
        pyodide.FS.writeFile(`/home/pyodide/pascal/${name}`, contents);
      });

      pyodide.runPython(`
import json
import sys
from contextlib import redirect_stdout, redirect_stderr
from io import StringIO

sys.path.insert(0, "/home/pyodide")

from pascal.Lexer import Lexer
from pascal.Parser import Parser
from pascal.SemanticAnalyser import SemanticAnalyser
from pascal.interpreter import Interpreter
from pascal.bytecode import BytecodeVisitor
from pascal.vm import VirtualMachine

def run_pascal_demo(source, mode):
    stdout = StringIO()
    stderr = StringIO()
    result = {
        "ok": True,
        "output": "",
        "bytecode": "",
        "ast": "",
        "scope": "{}",
        "error": "",
    }

    try:
        with redirect_stdout(stdout), redirect_stderr(stderr):
            lexer = Lexer(source)
            parser = Parser(lexer)
            ast = parser.parse()
            result["ast"] = json.dumps(ast_to_dict(ast), indent=2, default=str)

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

def ast_to_dict(node):
    if isinstance(node, (str, int, float, bool)) or node is None:
        return node

    if isinstance(node, list):
        return [ast_to_dict(item) for item in node]

    if hasattr(node, "__dict__"):
        result = {"node": node.__class__.__name__}
        for key, value in node.__dict__.items():
            if key in {"token"}:
                continue
            result[key] = ast_to_dict(value)
        return result

    return str(node)
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
      const preparedSource = prepareSourceForRun();
      const pyodide = await prepareRuntime();
      setStatus("Executing program...");
      const resultJson = await pyodide.runPythonAsync(
        `run_pascal_demo(${JSON.stringify(preparedSource)}, ${JSON.stringify(mode.value)})`
      );
      const result = JSON.parse(resultJson);
      output.textContent = result.ok ? result.output || "(no output)" : `${result.output}${result.error}`;
      if (mode.value === "tree" && result.ast) {
        setAstVisual(JSON.parse(result.ast));
      } else {
        setInspectionText(result.bytecode || "(bytecode unavailable)");
      }
      scope.textContent = result.scope || "{}";
      setStatus(result.ok ? "Finished." : "Program stopped with an error.");
    } catch (error) {
      output.textContent = error.message;
      setInspectionText(mode.value === "tree" ? "(AST unavailable)" : "(bytecode unavailable)");
      scope.textContent = "{}";
      setStatus("Runtime error.");
    } finally {
      setBusy(false);
    }
  }

  async function loadSampleProgram() {
    const response = await fetch(`${SAMPLE_BASE}${sample.value}`, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Could not load ${sample.value}`);
    }
    return response.text();
  }

  async function resetSample() {
    sample.disabled = true;
    resetButton.disabled = true;
    setStatus(`Loading ${sample.value}...`);
    try {
      source.value = await loadSampleProgram();
      setStatus("Sample loaded.");
    } catch (error) {
      source.value = "";
      setStatus(error.message);
    } finally {
      sample.disabled = false;
      resetButton.disabled = false;
    }
    output.textContent = "";
    setInspectionText("");
    scope.textContent = "";
    updateSourceLineNumbers();
    renderInputControls();
  }

  function setInspectionText(text) {
    astVisual.hidden = true;
    bytecode.hidden = false;
    bytecode.dataset.view = "text";
    bytecode.textContent = text;
    updateBytecodeLineNumbers(text);
  }

  function setAstVisual(tree) {
    currentAstTree = tree;
    bytecode.hidden = true;
    astVisual.hidden = false;
    astCanvas.replaceChildren(renderAstSvg(tree));
    setAstZoom(1);
    bytecode.textContent = JSON.stringify(tree, null, 2);
    updateBytecodeLineNumbers("");
  }

  function setAstZoom(nextZoom) {
    astZoom = Math.min(2.5, Math.max(0.35, nextZoom));
    astZoomReset.textContent = `${Math.round(astZoom * 100)}%`;
    applyAstZoom(astCanvas, astZoom);
  }

  function setAstModalZoom(nextZoom) {
    astModalZoom = Math.min(3.5, Math.max(0.25, nextZoom));
    astModalZoomReset.textContent = `${Math.round(astModalZoom * 100)}%`;
    applyAstZoom(astModalCanvas, astModalZoom);
  }

  function applyAstZoom(canvas, zoom) {
    canvas.style.setProperty("--ast-zoom", String(zoom));
    const svg = canvas.querySelector("svg");
    if (svg) {
      const baseWidth = Number(svg.dataset.baseWidth || svg.getAttribute("width"));
      const baseHeight = Number(svg.dataset.baseHeight || svg.getAttribute("height"));
      svg.style.width = `${baseWidth * zoom}px`;
      svg.style.height = `${baseHeight * zoom}px`;
    }
  }

  function zoomAst(delta) {
    setAstZoom(astZoom + delta);
  }

  function zoomAstModal(delta) {
    setAstModalZoom(astModalZoom + delta);
  }

  function openAstModal() {
    if (!currentAstTree) {
      return;
    }
    astModal.hidden = false;
    astModalCanvas.replaceChildren(renderAstSvg(currentAstTree, { xStep: 110, yStep: 120, compact: true }));
    setAstModalZoom(1);
  }

  function closeAstModal() {
    astModal.hidden = true;
  }

  function nodeLabel(node) {
    if (node === null) {
      return "null";
    }
    if (typeof node !== "object") {
      return String(node);
    }
    return node.node || "node";
  }

  function nodeChildren(node) {
    if (node === null || typeof node !== "object") {
      return [];
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => ({ edge: String(index), node: child }));
    }
    const entries = Object.entries(node)
      .filter(([key]) => key !== "node")
      .flatMap(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((child, index) => ({ edge: `${key}[${index}]`, node: child }));
        }
        return [{ edge: key, node: value }];
      });
    return entries.filter((entry) => {
      const child = entry.node;
      return !(child === null || child === "" || (Array.isArray(child) && child.length === 0));
    });
  }

  function layoutAst(node, depth = 0, nextLeaf = { value: 0 }) {
    const children = nodeChildren(node).map((child) => ({
      edge: child.edge,
      layout: layoutAst(child.node, depth + 1, nextLeaf),
    }));

    let x;
    if (children.length === 0) {
      x = nextLeaf.value;
      nextLeaf.value += 1;
    } else {
      x = (children[0].layout.x + children[children.length - 1].layout.x) / 2;
    }

    return {
      x,
      y: depth,
      label: nodeLabel(node),
      children,
    };
  }

  function renderAstSvg(tree, options = {}) {
    const layout = layoutAst(tree);
    const nodes = [];
    const edges = [];
    const xStep = options.xStep || 120;
    const yStep = options.yStep || 112;
    const padding = 44;
    const leftPadding = options.leftPadding || 72;

    function collect(item) {
      nodes.push(item);
      item.children.forEach((child) => {
        edges.push({ from: item, to: child.layout, label: child.edge });
        collect(child.layout);
      });
    }

    collect(layout);

    const width = Math.max(520, (Math.max(...nodes.map((node) => node.x)) + 1) * xStep + leftPadding + padding);
    const height = Math.max(320, (Math.max(...nodes.map((node) => node.y)) + 1) * yStep + padding * 2);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.dataset.baseWidth = String(width);
    svg.dataset.baseHeight = String(height);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Abstract syntax tree");

    edges.forEach((edge) => {
      const x1 = leftPadding + edge.from.x * xStep;
      const y1 = padding + edge.from.y * yStep + 18;
      const x2 = leftPadding + edge.to.x * xStep;
      const y2 = padding + edge.to.y * yStep - 18;
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("class", "ast-edge");
      svg.appendChild(line);

      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", (x1 + x2) / 2);
      text.setAttribute("y", (y1 + y2) / 2 - 4);
      text.setAttribute("class", "ast-edge-label");
      text.textContent = edge.label;
      svg.appendChild(text);
    });

    nodes.forEach((node) => {
      const x = leftPadding + node.x * xStep;
      const y = padding + node.y * yStep;
      const label = node.label.length > 18 ? `${node.label.slice(0, 17)}...` : node.label;
      const group = document.createElementNS(svg.namespaceURI, "g");
      group.setAttribute("class", "ast-node");

      const rect = document.createElementNS(svg.namespaceURI, "rect");
      rect.setAttribute("x", x - 48);
      rect.setAttribute("y", y - 18);
      rect.setAttribute("width", 96);
      rect.setAttribute("height", 36);
      rect.setAttribute("rx", 2);
      group.appendChild(rect);

      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", x);
      text.setAttribute("y", y + 4);
      text.textContent = label;
      group.appendChild(text);
      svg.appendChild(group);
    });

    return svg;
  }

  function syncInspectionTab() {
    const isTree = mode.value === "tree";
    inspectionTab.textContent = isTree ? "AST" : "Bytecode";
    setInspectionText("");
  }

  function updateBytecodeLineNumbers(text) {
    const lines = text.split("\n").filter((line, index, allLines) => line || index < allLines.length - 1);
    const width = String(lines.length).length;
    bytecodeLines.textContent = lines
      .map((_, index) => String(index + 1).padStart(width, " "))
      .join("\n");
  }

  function updateSourceLineNumbers() {
    const lineCount = Math.max(1, source.value.split("\n").length);
    sourceLines.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
  }

  function inferVariableTypes(text) {
    const types = new Map();
    const declarationPattern = /(?:^|\n)\s*([A-Za-z_][\w]*(?:\s*,\s*[A-Za-z_][\w]*)*)\s*:\s*(INTEGER|REAL|BOOLEAN|STRING)\s*;/gi;
    let match = declarationPattern.exec(text);
    while (match) {
      const type = match[2].toUpperCase();
      match[1].split(",").forEach((name) => {
        types.set(name.trim().toUpperCase(), type);
      });
      match = declarationPattern.exec(text);
    }
    return types;
  }

  function readCalls(text) {
    const types = inferVariableTypes(text);
    const seen = new Set();
    const reads = [];
    const readPattern = /\bREADLN\s*\(\s*([A-Za-z_][\w]*)\s*\)/gi;
    let match = readPattern.exec(text);
    while (match) {
      const name = match[1].toUpperCase();
      if (!seen.has(name)) {
        seen.add(name);
        reads.push({
          name,
          type: types.get(name) || "STRING",
        });
      }
      match = readPattern.exec(text);
    }
    return reads;
  }

  function defaultInputValue(input) {
    if (input.name === "LIMIT") {
      return "7";
    }
    if (input.name === "COUNT") {
      return "3";
    }
    if (input.name === "START") {
      return "5";
    }
    if (input.type === "STRING") {
      return "Alex";
    }
    if (input.type === "BOOLEAN") {
      return "TRUE";
    }
    return "1";
  }

  function renderInputControls() {
    demoInputs = readCalls(source.value);
    inputGrid.replaceChildren();
    inputsPanel.hidden = demoInputs.length === 0;

    demoInputs.forEach((input) => {
      const label = document.createElement("label");
      label.className = "interpreter-field";

      const caption = document.createElement("span");
      caption.textContent = `${input.name.toLowerCase()} : ${input.type}`;

      const control = document.createElement("input");
      control.id = `interpreter-input-${input.name}`;
      control.dataset.name = input.name;
      control.dataset.type = input.type;
      control.value = defaultInputValue(input);

      if (input.type === "INTEGER" || input.type === "REAL") {
        control.type = "number";
        control.step = input.type === "INTEGER" ? "1" : "any";
      } else if (input.type === "BOOLEAN") {
        control.setAttribute("list", "interpreter-boolean-options");
      } else {
        control.type = "text";
      }

      label.append(caption, control);
      inputGrid.appendChild(label);
    });
  }

  function literalFromInputValue(input, rawValue) {
    const value = rawValue.trim();
    if (input.type === "INTEGER") {
      if (!/^-?\d+$/.test(value)) {
        throw new Error(`${input.name.toLowerCase()} must be an integer`);
      }
      return value;
    }

    if (input.type === "REAL") {
      if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) {
        throw new Error(`${input.name.toLowerCase()} must be a real number`);
      }
      return value;
    }

    if (input.type === "BOOLEAN") {
      const upper = value.toUpperCase();
      if (upper !== "TRUE" && upper !== "FALSE") {
        throw new Error(`${input.name.toLowerCase()} must be TRUE or FALSE`);
      }
      return upper;
    }

    if (value.includes("'")) {
      throw new Error(`${input.name.toLowerCase()} cannot contain apostrophes`);
    }
    return `'${value}'`;
  }

  function panelInputLiteral(input) {
    const control = document.getElementById(`interpreter-input-${input.name}`);
    return literalFromInputValue(input, control ? control.value : "");
  }

  function prepareSourceForRun() {
    const replacements = new Map();
    for (const input of demoInputs) {
      replacements.set(input.name, panelInputLiteral(input));
    }
    return source.value.replace(/\bREADLN\s*\(\s*([A-Za-z_][\w]*)\s*\)/gi, (_, name) => {
      const literal = replacements.get(name.toUpperCase());
      if (literal === undefined) {
        return _;
      }
      return `${name} := ${literal}`;
    });
  }

  function syncSourceLineScroll() {
    sourceLines.scrollTop = source.scrollTop;
  }

  function syncBytecodeLineScroll() {
    bytecodeLines.scrollTop = bytecode.scrollTop;
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadSource() {
    downloadText("pascal-source.pas", source.value);
  }

  function activeResultText() {
    if (activePanel === "bytecode") {
      return bytecode.textContent;
    }
    if (activePanel === "scope") {
      return scope.textContent;
    }
    return output.textContent;
  }

  function downloadResult() {
    const resultNames = {
      output: "interpreter-output.txt",
      bytecode: mode.value === "tree" ? "interpreter-ast.json" : "interpreter-bytecode.pbc",
      scope: "interpreter-scope.json",
    };
    downloadText(resultNames[activePanel], activeResultText());
  }

  function activatePanel(name) {
    activePanel = name;
    document.querySelectorAll(".interpreter-tab").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.panel === name));
    });
    document.querySelectorAll(".interpreter-panel").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
  }

  resetSample();
  syncInspectionTab();
  sample.addEventListener("change", () => {
    resetSample();
  });
  mode.addEventListener("change", syncInspectionTab);
  source.addEventListener("input", updateSourceLineNumbers);
  source.addEventListener("input", renderInputControls);
  source.addEventListener("scroll", syncSourceLineScroll);
  bytecode.addEventListener("scroll", syncBytecodeLineScroll);
  astZoomOut.addEventListener("click", () => zoomAst(-0.15));
  astZoomIn.addEventListener("click", () => zoomAst(0.15));
  astZoomReset.addEventListener("click", () => setAstZoom(1));
  astFullscreen.addEventListener("click", openAstModal);
  astVisual.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    zoomAst(event.deltaY > 0 ? -0.12 : 0.12);
  }, { passive: false });
  astModalZoomOut.addEventListener("click", () => zoomAstModal(-0.15));
  astModalZoomIn.addEventListener("click", () => zoomAstModal(0.15));
  astModalZoomReset.addEventListener("click", () => setAstModalZoom(1));
  astModalClose.addEventListener("click", closeAstModal);
  astModal.addEventListener("click", (event) => {
    if (event.target === astModal) {
      closeAstModal();
    }
  });
  astModal.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    zoomAstModal(event.deltaY > 0 ? -0.12 : 0.12);
  }, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !astModal.hidden) {
      closeAstModal();
    }
  });
  downloadSourceButton.addEventListener("click", downloadSource);
  downloadResultButton.addEventListener("click", downloadResult);
  resetButton.addEventListener("click", () => {
    resetSample();
  });
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
