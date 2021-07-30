// eslint-disable-next-line no-undef
const { effect, compile } = MiniVue;

const sharedEditorOptions = {
  fontSize: 14,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection',
  minimap: {
    enabled: false,
  },
};

window.init = () => {
  const monaco = window.monaco;

  // eslint-disable-next-line no-undef
  monaco.editor.defineTheme('my-theme', theme);
  monaco.editor.setTheme('my-theme');

  const persistedState = JSON.parse(
    decodeURIComponent(window.location.hash.slice(1)) ||
      localStorage.getItem('state') ||
      `{}`
  );

  let lastSuccessfulCode;
  let lastSuccessfulMap;
  function compileCode(source) {
    console.clear();
    try {
      const errors = [];
      const compileFn = (source) => {
        // eslint-disable-next-line no-undef
        return format(compile(source));
      };
      const start = performance.now();
      const code = compileFn(source);
      console.log(`Compiled in ${(performance.now() - start).toFixed(2)}ms.`);
      monaco.editor.setModelMarkers(
        editor.getModel(),
        `@vue/compiler-dom`,
        errors.filter((e) => e.loc).map(formatError)
      );
      lastSuccessfulCode = code;
    } catch (e) {
      lastSuccessfulCode = `/* ERROR: ${e.message} (see console for more info) */`;
      console.error(e);
    }
    return lastSuccessfulCode;
  }

  function formatError(err) {
    return {
      message: `Vue template compilation error: ${err.message}`,
      code: String(err.code),
    };
  }

  function reCompile() {
    const src = editor.getValue();
    // every time we re-compile, persist current state
    const state = JSON.stringify({
      src,
    });
    localStorage.setItem('state', state);
    window.location.hash = encodeURIComponent(state);
    const res = compileCode(src);
    if (res) {
      output.setValue(res);
      output.trigger('editor', 'editor.action.formatDocument');
    }
  }

  const editor = monaco.editor.create(document.getElementById('source'), {
    value: persistedState.src || `<div>Hello World!</div>`,
    language: 'html',
    ...sharedEditorOptions,
    wordWrap: 'bounded',
  });

  editor.getModel().updateOptions({
    tabSize: 2,
  });

  const output = (window.output = monaco.editor.create(
    document.getElementById('output'),
    {
      value: '',
      language: 'javascript',
      // readOnly: true,
      ...sharedEditorOptions,
    }
  ));
  output.getModel().updateOptions({
    tabSize: 2,
  });

  // handle resize
  window.addEventListener('resize', () => {
    editor.layout();
    output.layout();
  });

  // update compile output when input changes
  editor.onDidChangeModelContent(debounce(reCompile));

  // highlight output code
  let prevOutputDecos = [];
  function clearOutputDecos() {
    prevOutputDecos = output.deltaDecorations(prevOutputDecos, []);
  }

  editor.onDidChangeCursorPosition(
    debounce((e) => {
      clearEditorDecos();
      if (lastSuccessfulMap) {
        const pos = lastSuccessfulMap.generatedPositionFor({
          source: 'ExampleTemplate.vue',
          line: e.position.lineNumber,
          column: e.position.column - 1,
        });
        if (pos.line != null && pos.column != null) {
          prevOutputDecos = output.deltaDecorations(prevOutputDecos, [
            {
              range: new monaco.Range(
                pos.line,
                pos.column + 1,
                pos.line,
                pos.lastColumn ? pos.lastColumn + 2 : pos.column + 2
              ),
              options: {
                inlineClassName: `highlight`,
              },
            },
          ]);
          output.revealPositionInCenter({
            lineNumber: pos.line,
            column: pos.column + 1,
          });
        } else {
          clearOutputDecos();
        }
      }
    }, 100)
  );

  let previousEditorDecos = [];
  function clearEditorDecos() {
    previousEditorDecos = editor.deltaDecorations(previousEditorDecos, []);
  }

  output.onDidChangeCursorPosition(
    debounce((e) => {
      clearOutputDecos();
      if (lastSuccessfulMap) {
        const pos = lastSuccessfulMap.originalPositionFor({
          line: e.position.lineNumber,
          column: e.position.column - 1,
        });
        if (
          pos.line != null &&
          pos.column != null &&
          !(
            // ignore mock location
            (pos.line === 1 && pos.column === 0)
          )
        ) {
          const translatedPos = {
            column: pos.column + 1,
            lineNumber: pos.line,
          };
          previousEditorDecos = editor.deltaDecorations(previousEditorDecos, [
            {
              range: new monaco.Range(
                pos.line,
                pos.column + 1,
                pos.line,
                pos.column + 1
              ),
              options: {
                isWholeLine: true,
                className: `highlight`,
              },
            },
          ]);
          editor.revealPositionInCenter(translatedPos);
        } else {
          clearEditorDecos();
        }
      }
    }, 100)
  );

  effect(reCompile);
};

function debounce(fn, delay = 300) {
  let prevTimer = null;
  return (...args) => {
    if (prevTimer) {
      clearTimeout(prevTimer);
    }
    prevTimer = window.setTimeout(() => {
      fn(...args);
      prevTimer = null;
    }, delay);
  };
}
