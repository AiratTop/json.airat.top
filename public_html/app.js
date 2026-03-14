const inputArea = document.getElementById("inputArea");
const outputArea = document.getElementById("outputArea");
const formatBtn = document.getElementById("formatBtn");
const minifyBtn = document.getElementById("minifyBtn");
const sortBtn = document.getElementById("sortBtn");
const jsonToYamlBtn = document.getElementById("jsonToYamlBtn");
const yamlToJsonBtn = document.getElementById("yamlToJsonBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const darkToggle = document.getElementById("darkMode");
const statusEl = document.getElementById("status");
const errorBox = document.getElementById("errorBox");
const outputMeta = document.getElementById("outputMeta");
const splitPane = document.getElementById("splitPane");
const dragHandle = document.getElementById("dragHandle");

const STORAGE_KEYS = {
  input: "json-tool-input",
  output: "json-tool-output",
  outputType: "json-tool-output-type",
  theme: "json-tool-theme",
  themeMode: "json-tool-theme-mode",
  split: "json-tool-split",
};

const SAMPLE = `{
  "name": "Airat",
  "project": "json.airat.top",
  "features": [
    "format",
    "minify",
    "sort keys",
    "json-yaml convert"
  ],
  "active": true,
  "users": 124,
  "meta": {
    "localOnly": true,
    "version": 1
  }
}`;

let outputType = "json";

const getStored = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (error) {
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage errors (private mode, etc.)
  }
};

const showStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("status--error", isError);
  statusEl.classList.add("is-visible");
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    statusEl.classList.remove("is-visible");
  }, 1800);
};

const clearError = () => {
  errorBox.textContent = "";
  errorBox.classList.remove("is-visible");
};

const showError = (message) => {
  errorBox.textContent = message;
  errorBox.classList.add("is-visible");
};

const setOutput = (value, type = "json") => {
  outputArea.value = value;
  outputType = type;
  outputMeta.textContent = type.toUpperCase();
  setStored(STORAGE_KEYS.output, value);
  setStored(STORAGE_KEYS.outputType, type);
};

const setInput = (value) => {
  inputArea.value = value;
  setStored(STORAGE_KEYS.input, value);
};

const positionToLineColumn = (text, position) => {
  const safePosition = Math.max(0, Math.min(position, text.length));
  const textBefore = text.slice(0, safePosition);
  const lines = textBefore.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
};

const parseJsonDetailed = (text) => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON";
    const positionMatch = message.match(/position\s+(\d+)/i);
    const lineMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);

    if (positionMatch) {
      const position = Number(positionMatch[1]);
      const point = positionToLineColumn(text, position);
      return {
        ok: false,
        message,
        line: point.line,
        column: point.column,
      };
    }

    if (lineMatch) {
      return {
        ok: false,
        message,
        line: Number(lineMatch[1]),
        column: Number(lineMatch[2]),
      };
    }

    return { ok: false, message };
  }
};

const normalizeJsonError = (result) => {
  if (!result.line || !result.column) {
    return `Invalid JSON: ${result.message}`;
  }
  return `Invalid JSON at line ${result.line}, column ${result.column}: ${result.message}`;
};

const sortKeysDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((sorted, key) => {
        sorted[key] = sortKeysDeep(value[key]);
        return sorted;
      }, {});
  }
  return value;
};

const ensureInput = () => {
  if (inputArea.value.trim()) {
    return true;
  }
  showError("Input is empty. Paste JSON or YAML first.");
  showStatus("Input is empty", true);
  return false;
};

const runFormat = ({ silent = false } = {}) => {
  if (!ensureInput()) {
    return;
  }
  clearError();
  const parsed = parseJsonDetailed(inputArea.value);
  if (!parsed.ok) {
    const message = normalizeJsonError(parsed);
    showError(message);
    showStatus("JSON validation error", true);
    outputMeta.textContent = "Error";
    return;
  }

  const formatted = JSON.stringify(parsed.value, null, 2);
  setOutput(formatted, "json");
  if (!silent) {
    showStatus("JSON formatted");
  }
};

const runMinify = () => {
  if (!ensureInput()) {
    return;
  }
  clearError();
  const parsed = parseJsonDetailed(inputArea.value);
  if (!parsed.ok) {
    const message = normalizeJsonError(parsed);
    showError(message);
    showStatus("JSON validation error", true);
    outputMeta.textContent = "Error";
    return;
  }

  const minified = JSON.stringify(parsed.value);
  setOutput(minified, "json");
  showStatus("JSON minified");
};

const runSortKeys = () => {
  if (!ensureInput()) {
    return;
  }
  clearError();
  const parsed = parseJsonDetailed(inputArea.value);
  if (!parsed.ok) {
    const message = normalizeJsonError(parsed);
    showError(message);
    showStatus("JSON validation error", true);
    outputMeta.textContent = "Error";
    return;
  }

  const sorted = sortKeysDeep(parsed.value);
  setOutput(JSON.stringify(sorted, null, 2), "json");
  showStatus("Keys sorted (deep)");
};

const runJsonToYaml = () => {
  if (!ensureInput()) {
    return;
  }
  clearError();
  const parsed = parseJsonDetailed(inputArea.value);
  if (!parsed.ok) {
    const message = normalizeJsonError(parsed);
    showError(message);
    showStatus("JSON validation error", true);
    outputMeta.textContent = "Error";
    return;
  }

  if (!window.jsyaml) {
    showError("YAML converter is unavailable.");
    showStatus("YAML converter is unavailable", true);
    outputMeta.textContent = "Error";
    return;
  }

  try {
    const yamlText = window.jsyaml.dump(parsed.value, {
      noRefs: true,
      lineWidth: -1,
      sortKeys: false,
    });
    setOutput(yamlText, "yaml");
    showStatus("Converted JSON to YAML");
  } catch (error) {
    const message = error instanceof Error ? error.message : "YAML conversion failed";
    showError(`Failed to convert JSON to YAML: ${message}`);
    showStatus("JSON→YAML failed", true);
    outputMeta.textContent = "Error";
  }
};

const runYamlToJson = () => {
  if (!ensureInput()) {
    return;
  }
  clearError();

  if (!window.jsyaml) {
    showError("YAML converter is unavailable.");
    showStatus("YAML converter is unavailable", true);
    outputMeta.textContent = "Error";
    return;
  }

  try {
    const value = window.jsyaml.load(inputArea.value);
    const normalized = typeof value === "undefined" ? null : value;
    setOutput(JSON.stringify(normalized, null, 2), "json");
    showStatus("Converted YAML to JSON");
  } catch (error) {
    if (error && typeof error === "object" && "mark" in error) {
      const line = Number(error.mark?.line ?? 0) + 1;
      const column = Number(error.mark?.column ?? 0) + 1;
      showError(`Invalid YAML at line ${line}, column ${column}: ${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : "Invalid YAML";
      showError(`Invalid YAML: ${message}`);
    }
    showStatus("YAML validation error", true);
    outputMeta.textContent = "Error";
  }
};

const copyOutput = async () => {
  const text = outputArea.value.trim() ? outputArea.value : inputArea.value;
  if (!text.trim()) {
    showStatus("Nothing to copy", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showStatus(outputArea.value.trim() ? "Output copied" : "Input copied");
  } catch (error) {
    const target = outputArea.value.trim() ? outputArea : inputArea;
    target.select();
    document.execCommand("copy");
    showStatus(outputArea.value.trim() ? "Output copied" : "Input copied");
  }
};

const downloadOutput = () => {
  const text = outputArea.value.trim() ? outputArea.value : inputArea.value;
  if (!text.trim()) {
    showStatus("Nothing to download", true);
    return;
  }

  const extension = outputArea.value.trim() ? outputType : "json";
  const fileName = `data.${extension === "yaml" ? "yaml" : "json"}`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showStatus(`Downloaded ${fileName}`);
};

const resetToSample = () => {
  setInput(SAMPLE);
  setOutput("", "json");
  clearError();
  runFormat({ silent: true });
  showStatus("Reset to sample JSON");
};

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const normalizeTheme = (value) =>
  value === "dark" || value === "light" || value === "system" ? value : "system";
const resolveTheme = (value) =>
  value === "system" ? (mediaQuery.matches ? "dark" : "light") : value;

let themeMode = "system";
let themePreference = "system";

const applyTheme = (value, { persist = true } = {}) => {
  const resolved = resolveTheme(value);
  document.documentElement.dataset.theme = resolved;
  darkToggle.checked = resolved === "dark";
  if (persist) {
    setStored(STORAGE_KEYS.theme, value);
  }
};

const storedInput = getStored(STORAGE_KEYS.input, "");
const storedOutput = getStored(STORAGE_KEYS.output, "");
const storedOutputType = getStored(STORAGE_KEYS.outputType, "json");
const storedTheme = getStored(STORAGE_KEYS.theme, "system");
const storedThemeMode = getStored(STORAGE_KEYS.themeMode, "system");
const storedSplit = getStored(STORAGE_KEYS.split, "");

themeMode = storedThemeMode === "manual" ? "manual" : "system";
themePreference = normalizeTheme(storedTheme);
if (themeMode !== "manual") {
  themePreference = "system";
  setStored(STORAGE_KEYS.theme, "system");
}

applyTheme(themePreference, { persist: false });
if (storedSplit) {
  splitPane.style.setProperty("--split-left", storedSplit);
}

setInput(storedInput.trim() ? storedInput : SAMPLE);
if (storedOutput.trim()) {
  setOutput(storedOutput, storedOutputType === "yaml" ? "yaml" : "json");
} else {
  runFormat({ silent: true });
}

inputArea.addEventListener("input", () => {
  setStored(STORAGE_KEYS.input, inputArea.value);
  clearError();
  if (!outputArea.value.trim()) {
    outputMeta.textContent = "Ready";
  }
});

formatBtn.addEventListener("click", runFormat);
minifyBtn.addEventListener("click", runMinify);
sortBtn.addEventListener("click", runSortKeys);
jsonToYamlBtn.addEventListener("click", runJsonToYaml);
yamlToJsonBtn.addEventListener("click", runYamlToJson);
copyBtn.addEventListener("click", copyOutput);
downloadBtn.addEventListener("click", downloadOutput);
resetBtn.addEventListener("click", resetToSample);

darkToggle.addEventListener("change", () => {
  themeMode = "manual";
  setStored(STORAGE_KEYS.themeMode, themeMode);
  themePreference = darkToggle.checked ? "dark" : "light";
  applyTheme(themePreference);
});

mediaQuery.addEventListener("change", () => {
  if (themeMode === "system") {
    applyTheme("system", { persist: false });
  }
});

let isDragging = false;
const MIN_PANE_WIDTH = 240;

const updateSplit = (clientX) => {
  const rect = splitPane.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const maxLeft = rect.width - MIN_PANE_WIDTH;
  const clamped = Math.max(MIN_PANE_WIDTH, Math.min(offsetX, maxLeft));
  const percent = (clamped / rect.width) * 100;
  const value = `${percent}%`;
  splitPane.style.setProperty("--split-left", value);
  setStored(STORAGE_KEYS.split, value);
};

const stopDrag = (event) => {
  if (!isDragging) {
    return;
  }
  isDragging = false;
  dragHandle.classList.remove("is-active");
  dragHandle.releasePointerCapture(event.pointerId);
};

dragHandle.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  isDragging = true;
  dragHandle.classList.add("is-active");
  dragHandle.setPointerCapture(event.pointerId);
  updateSplit(event.clientX);
});

dragHandle.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    return;
  }
  updateSplit(event.clientX);
});

dragHandle.addEventListener("pointerup", stopDrag);
dragHandle.addEventListener("pointercancel", stopDrag);
