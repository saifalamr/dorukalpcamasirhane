const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { jsPDF } = require("jspdf");

// Exercise the actual component's click handlers, using real PDF/File bytes.
// React state, browser download and native share targets are mocked.
// This does not replace an iPhone/WhatsApp end-to-end test.
const source = fs.readFileSync(path.join(__dirname, "../src/components/DispatchActions.tsx"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;

function harness({ pages = 1, supported = true, shareError, canShareError } = {}) {
  const pdf = new jsPDF();
  for (let page = 1; page <= pages; page++) {
    if (page > 1) pdf.addPage();
    pdf.text(["DORUK ALP", "Malzeme                 Adet",
      "Havlu                       125", "Toplam Adet: 125",
      "Teslim Eden (Imza)          Teslim Alan (Imza)", "Sayfa " + page], 12, 20);
  }
  const generated = new Blob([pdf.output("arraybuffer")], { type: "application/pdf" });
  const downloads = [], shares = [], checks = [], states = [], effects = [], refs = [];
  let stateIndex = 0, effectIndex = 0, refIndex = 0, generations = 0;
  let gesture = false, busyTransitions = [], fallbackStates = [];
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in states)) states[index] = initial;
      return [states[index], value => {
        states[index] = typeof value === "function" ? value(states[index]) : value;
        if (index === 1) busyTransitions.push(value);
        if (index === 2) fallbackStates.push(value);
      }];
    },
    useRef(initial) {
      const index = refIndex++;
      return refs[index] ??= { current: initial };
    },
    useEffect(fn, deps) {
      const index = effectIndex++;
      if (!effects[index] || deps.some((dep, i) => dep !== effects[index][i])) {
        effects[index] = deps;
        fn();
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const nav = {
    canShare(payload) {
      checks.push(payload);
      if (canShareError) throw canShareError;
      return supported;
    },
    async share(payload) {
      assert.equal(gesture, true, "native share must run synchronously in the fresh click");
      shares.push(payload);
      if (shareError) throw shareError;
    },
  };
  let pendingDownload;
  const document = {
    createElement(tag) {
      assert.equal(tag, "a", "sharing must not capture HTML or create a canvas");
      return { click() { downloads.push(pendingDownload); }, remove() {} };
    },
    body: { appendChild() {} },
  };
  const url = {
    createObjectURL(file) { pendingDownload = file; return "blob:test"; },
    revokeObjectURL() {},
  };
  const errors = [];
  const module = { exports: {} };
  const requireMock = name => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "lucide-react") return {};
    if (name === "@/components/ui/Toast") return { useToast: () => ({ toast: message => errors.push(message) }) };
    if (name === "@/lib/dispatch-pdf") return {
      dispatchNotesToPdf: async () => { generations++; return generated; },
    };
    throw new Error("Unexpected dependency: " + name);
  };
  new Function("require", "module", "exports", "navigator", "document", "window", "URL", "setTimeout", compiled)(
    requireMock, module, module.exports, nav, document, { innerWidth: 390, print() {} }, url, () => {});
  function render() {
    stateIndex = effectIndex = refIndex = 0;
    return module.exports.DispatchActions({
      fileName: "Irsaliye - Test - 2026-10-20", customerName: "Test",
      periodLabel: "20.10.2026", customerPhone: "05310000000",
    });
  }
  render();
  async function click(index) {
    const tree = render();
    const button = tree.props.children[index];
    gesture = true;
    const result = button.props.onClick();
    gesture = false;
    await result;
  }
  return { click, render, generated, downloads, shares, checks, errors, busyTransitions,
    fallbackStates, generations: () => generations };
}

async function sameBytes(actual, expected) {
  assert.deepEqual(Buffer.from(await actual.arrayBuffer()), Buffer.from(await expected.arrayBuffer()));
}

for (const pages of [1, 3]) {
  test("download and file-only share preserve identical " + pages + "-page PDF fixture bytes", async () => {
    const h = harness({ pages });
    await h.click(0); // Existing PDF Indir handler.
    await h.click(2); // Ready-file share, without asynchronous regeneration.
    assert.equal(h.generations(), 1);
    assert.equal(h.downloads.length, 1);
    assert.equal(h.shares.length, 1);
    assert.deepEqual(Object.keys(h.shares[0]), ["files"]);
    assert.strictEqual(h.checks[0], h.shares[0], "canShare and share use the same payload");
    assert.strictEqual(h.downloads[0], h.shares[0].files[0], "same cached File, not a recreated PDF");
    await sameBytes(h.downloads[0], h.generated);
    await sameBytes(h.shares[0].files[0], h.downloads[0]);
    assert.equal(h.shares[0].files[0].type, "application/pdf");
  });
}

test("WhatsApp-first preparation requires a second fresh tap and download reuses that PDF", async () => {
  const h = harness();
  await h.click(2);
  assert.equal(h.shares.length, 0);
  assert.equal(h.downloads.length, 0);
  await h.click(2);
  await h.click(0);
  assert.equal(h.generations(), 1);
  assert.strictEqual(h.shares[0].files[0], h.downloads[0]);
  await sameBytes(h.shares[0].files[0], h.downloads[0]);
});

test("unsupported sharing downloads the exact prepared PDF and exposes Turkish attachment instructions", async () => {
  const h = harness({ supported: false, pages: 3 });
  await h.click(2);
  await h.click(2);
  assert.equal(h.shares.length, 0);
  assert.equal(h.downloads.length, 1);
  await sameBytes(h.downloads[0], h.generated);
  assert.equal(h.fallbackStates.at(-1), true);
  assert.match(JSON.stringify(h.render()), /Belge.*Dosyalardan seç/);
});

test("share rejection downloads the same file and displays fallback", async () => {
  const h = harness({ shareError: new DOMException("Denied", "NotAllowedError") });
  await h.click(0);
  await h.click(2);
  assert.strictEqual(h.downloads[1], h.downloads[0]);
  assert.equal(h.fallbackStates.at(-1), true);
  assert.equal(h.busyTransitions.at(-1), false);
});

test("cancelling the native share sheet does not download another file", async () => {
  const h = harness({ shareError: new DOMException("Cancelled", "AbortError") });
  await h.click(2);
  await h.click(2);
  assert.equal(h.downloads.length, 0);
  assert.notEqual(h.fallbackStates.at(-1), true);
  assert.equal(h.busyTransitions.at(-1), false);
});

test("canShare exceptions use the correct PDF fallback", async () => {
  const h = harness({ canShareError: new Error("Unavailable") });
  await h.click(2);
  await h.click(2);
  assert.equal(h.shares.length, 0);
  await sameBytes(h.downloads[0], h.generated);
  assert.equal(h.fallbackStates.at(-1), true);
});
