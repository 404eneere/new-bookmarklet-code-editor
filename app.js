// ============================================================
// WebCode
// Browser HTML / CSS / JavaScript editor
// ============================================================

const STORAGE_KEY = "webcode-project-v2";

let editor = null;
let currentFile = "html";

const files = {
  html: loadFile(
    "html",
    `<!DOCTYPE html>
<html>
<head>
  <title>My Web App</title>
</head>

<body>

  <h1>Hello, WebCode!</h1>

  <button id="helloButton">
    Click me
  </button>

</body>
</html>`
  ),

  css: loadFile(
    "css",
    `body {
  margin: 0;
  padding: 40px;

  font-family: Arial, sans-serif;

  background: #111;
  color: white;

  text-align: center;
}

button {
  padding: 10px 18px;

  border: 0;
  border-radius: 6px;

  background: #3794ff;
  color: white;

  cursor: pointer;
}

button:hover {
  background: #2676d4;
}`
  ),

  js: loadFile(
    "js",
    `const button = document.getElementById("helloButton");

button.addEventListener("click", () => {
  console.log("Button clicked!");

  alert("Hello from JavaScript!");
});`
  )
};


// ============================================================
// LOCAL STORAGE
// ============================================================

function loadFile(name, defaultValue) {
  try {
    const saved = localStorage.getItem(
      `${STORAGE_KEY}-${name}`
    );

    return saved !== null ? saved : defaultValue;

  } catch (error) {
    console.warn("Could not load saved file:", error);
    return defaultValue;
  }
}


function saveProject() {
  try {

    localStorage.setItem(
      `${STORAGE_KEY}-html`,
      files.html
    );

    localStorage.setItem(
      `${STORAGE_KEY}-css`,
      files.css
    );

    localStorage.setItem(
      `${STORAGE_KEY}-js`,
      files.js
    );

  } catch (error) {

    console.error(
      "Could not save project:",
      error
    );

  }
}


// ============================================================
// MONACO
// ============================================================

require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs"
  }
});


require(
  ["vs/editor/editor.main"],
  function () {

    editor = monaco.editor.create(
      document.getElementById("editor"),
      {
        value: files.html,

        language: "html",

        theme: "vs-dark",

        automaticLayout: true,

        minimap: {
          enabled: true
        },

        fontSize: 14,

        fontFamily:
          '"Cascadia Code", "Fira Code", Consolas, monospace',

        tabSize: 2,

        insertSpaces: true,

        wordWrap: "off",

        smoothScrolling: true,

        cursorBlinking: "smooth",

        padding: {
          top: 10
        }
      }
    );


    editor.onDidChangeModelContent(
      function () {

        files[currentFile] =
          editor.getValue();

        saveProject();

        setStatus("Saved locally");

      }
    );


    setStatus("Ready");

    runProject();

  }
);


// ============================================================
// LANGUAGE
// ============================================================

function getLanguage(file) {

  switch (file) {

    case "html":
      return "html";

    case "css":
      return "css";

    case "js":
      return "javascript";

    default:
      return "plaintext";
  }
}


// ============================================================
// FILE NAME
// ============================================================

function getFileName(file) {

  switch (file) {

    case "html":
      return "index.html";

    case "css":
      return "style.css";

    case "js":
      return "script.js";

    default:
      return file;
  }
}


// ============================================================
// SWITCH FILE
// ============================================================

function switchFile(file) {

  if (!editor) {
    return;
  }


  // Save current file
  files[currentFile] =
    editor.getValue();


  currentFile = file;


  // Dispose old model
  const oldModel =
    editor.getModel();

  if (oldModel) {
    oldModel.dispose();
  }


  // Create new model
  const model =
    monaco.editor.createModel(
      files[file],
      getLanguage(file)
    );


  editor.setModel(model);


  // Update tabs
  document
    .querySelectorAll(".tab")
    .forEach(function (tab) {

      tab.classList.toggle(
        "active",
        tab.dataset.file === file
      );

    });


  setStatus(getFileName(file));
}


// ============================================================
// TABS
// ============================================================

document
  .querySelectorAll(".tab")
  .forEach(function (tab) {

    tab.addEventListener(
      "click",
      function () {

        switchFile(
          tab.dataset.file
        );

      }
    );

  });


// ============================================================
// CONSOLE
// ============================================================

function clearConsole() {

  const consoleElement =
    document.getElementById("console");

  consoleElement.innerHTML = "";

}


function writeConsole(
  message,
  type = "log"
) {

  const consoleElement =
    document.getElementById("console");


  const line =
    document.createElement("div");


  line.className =
    `console-${type}`;


  line.textContent =
    `> ${message}`;


  consoleElement.appendChild(line);


  consoleElement.scrollTop =
    consoleElement.scrollHeight;
}


document
  .getElementById("clearConsole")
  .addEventListener(
    "click",
    clearConsole
  );


// ============================================================
// RUN PROJECT
// ============================================================

function runProject() {

  if (!editor) {
    return;
  }


  // Save whatever is currently open
  files[currentFile] =
    editor.getValue();


  saveProject();

  clearConsole();


  const html =
    files.html;

  const css =
    files.css;

  const js =
    files.js;


  const preview =
    document.getElementById("preview");


  // ==========================================================
  // CONSOLE BRIDGE
  // ==========================================================

  const bridge = `
<script>
(function () {

  function send(type, values) {

    try {

      const converted = values.map(function (value) {

        try {

          if (
            value !== null &&
            typeof value === "object"
          ) {

            return JSON.stringify(
              value,
              null,
              2
            );

          }

          return String(value);

        } catch (error) {

          return String(value);

        }

      });


      window.parent.postMessage(
        {
          source: "webcode-preview",
          type: type,
          args: converted
        },
        "*"
      );

    } catch (error) {}

  }


  const originalLog =
    console.log;

  const originalInfo =
    console.info;

  const originalWarn =
    console.warn;

  const originalError =
    console.error;


  console.log = function () {

    send(
      "log",
      Array.from(arguments)
    );

    originalLog.apply(
      console,
      arguments
    );

  };


  console.info = function () {

    send(
      "info",
      Array.from(arguments)
    );

    originalInfo.apply(
      console,
      arguments
    );

  };


  console.warn = function () {

    send(
      "warn",
      Array.from(arguments)
    );

    originalWarn.apply(
      console,
      arguments
    );

  };


  console.error = function () {

    send(
      "error",
      Array.from(arguments)
    );

    originalError.apply(
      console,
      arguments
    );

  };


  window.onerror =
    function (
      message,
      source,
      line,
      column
    ) {

      send(
        "error",
        [
          message +
          " (line " +
          line +
          ")"
        ]
      );

    };


  window.addEventListener(
    "unhandledrejection",
    function (event) {

      send(
        "error",
        [
          "Unhandled Promise rejection: " +
          String(event.reason)
        ]
      );

    }
  );

})();
<\/script>
`;


  // ==========================================================
  // INSERT CSS
  // ==========================================================

  let documentHTML = html;


  if (
    documentHTML
      .toLowerCase()
      .includes("</head>")
  ) {

    documentHTML =
      documentHTML.replace(
        /<\/head>/i,
        `<style>${css}</style></head>`
      );

  } else {

    documentHTML =
      `<style>${css}</style>` +
      documentHTML;

  }
