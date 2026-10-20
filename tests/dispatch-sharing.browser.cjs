const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const { build } = require("esbuild");
const { chromium, webkit } = require("playwright");

async function main() {
  fs.mkdirSync("test-output/dispatch-sharing", { recursive: true });
  const bundle = await build({
    stdin: { contents: `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { DispatchActions } from "./src/components/DispatchActions";
      import { DispatchPreview } from "./src/components/DispatchPreview";
      import { ToastProvider } from "./src/components/ui/Toast";
      const h = React.createElement;
      const count = window.__rowCount;
      const rows = Array.from({length: count}, (_, i) =>
        '<tr class="border-b border-line"><td class="py-2">' + (i+1) +
        '</td><td class="py-2">Havlu ve uzun isimli test malzemesi ' + (i+1) +
        '</td><td class="py-2 text-right">' + (i+1) + '</td></tr>').join("");
      const total = count * (count+1) / 2;
      const html = '<div class="dispatch-letterhead flex items-start justify-between gap-4 rounded-md px-5 py-4 mb-6" data-pdf-keep style="background:#0E1A2B">' +
        '<div class="flex items-center gap-3"><img src="/doruk-alp-logo.jpeg" style="width:44px;height:44px;object-fit:contain"><p style="color:white">DORUK ALP</p></div>' +
        '<div style="color:#C9A45C">İrsaliye / Sevkiyat Fişi<br>Test Otel<br>20.10.2026</div></div>' +
        '<table class="dispatch-table w-full text-sm mb-6"><colgroup><col style="width:8%"><col style="width:67%"><col style="width:25%"></colgroup>' +
        '<thead><tr><th>#</th><th>Malzeme</th><th class="text-right">Adet</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div data-pdf-keep class="flex justify-end mb-10">Toplam Adet: ' + total + '</div>' +
        '<div data-pdf-keep class="grid grid-cols-2 gap-8 pt-4 border-t border-line">' +
        '<p class="mb-10">Teslim Eden (İmza)</p><p class="mb-10">Teslim Alan (İmza)</p></div>';
      createRoot(document.getElementById("root")).render(h(ToastProvider, null,
        h("div", {className:"dispatch-page"},
          h(DispatchActions, {fileName:"Irsaliye - Test", customerName:"Test Otel",periodLabel:"20.10.2026"}),
          h(DispatchPreview, null, h("div", {className:"print-area dispatch-document bg-white border border-line",dangerouslySetInnerHTML:{__html:html}})))));
    `, resolveDir: process.cwd(), loader: "jsx" },
    bundle: true, write: false, platform: "browser", format: "iife",
    jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
  });
  const css = fs.readFileSync("/tmp/dispatch-test.css", "utf8") + "\n" +
    fs.readFileSync("src/components/dispatch.css", "utf8");
  const server = http.createServer((req, res) => {
    if (req.url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); return res.end(bundle.outputFiles[0].contents); }
    if (req.url === "/app.css") { res.setHeader("Content-Type", "text/css"); return res.end(css); }
    if (req.url === "/doruk-alp-logo.jpeg") { res.setHeader("Content-Type", "image/jpeg"); return res.end(fs.readFileSync("public/doruk-alp-logo.jpeg")); }
    res.setHeader("Content-Type", "text/html");
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head>' +
      '<body class="font-sans" style="margin:0;padding:16px"><div id="root"></div><script src="/app.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    for (const [name, engine, viewport] of [
      ["webkit-iphone", webkit, {width:390,height:844}],
      ["chromium-desktop", chromium, {width:1440,height:900}],
    ]) {
      const browser = await engine.launch();
      try {
        for (const count of [4, 100]) {
          const context = await browser.newContext({ viewport, deviceScaleFactor: name.startsWith("webkit") ? 3 : 1 });
          try {
            const page = await context.newPage();
            await page.addInitScript(({count}) => {
              window.__rowCount = count;
              window.__supported = true;
              window.__shared = [];
              Object.defineProperty(navigator, "canShare", { configurable:true, value: payload => {
                window.__checked = payload;
                return window.__supported && payload.files?.[0]?.type === "application/pdf";
              }});
              Object.defineProperty(navigator, "share", { configurable:true, value: payload => {
                window.__shared.push({
                  file:payload.files[0], keys:Object.keys(payload),
                  same:payload === window.__checked,
                  active:navigator.userActivation?.isActive,
                });
                return Promise.resolve();
              }});
            }, {count});
            await page.goto(url);
            const button = page.getByRole("button", {name:"PDF İndir",exact:true});
            await button.waitFor();
            await page.waitForFunction(() => document.querySelector(".dispatch-preview").getBoundingClientRect().height > 0);
            const geometry = await page.evaluate(() => {
              const doc = document.querySelector(".dispatch-document").getBoundingClientRect();
              return {
                viewport:innerWidth,
                right:doc.right,
                columns:Array.from(document.querySelectorAll(".dispatch-table th,.dispatch-table td")).every(cell => {
                  const r=cell.getBoundingClientRect(); return r.left>=doc.left-1 && r.right<=doc.right+1;
                }),
                rows:document.querySelectorAll(".dispatch-table tbody tr").length,
                signatures:document.querySelector(".dispatch-document").textContent.includes("Teslim Alan"),
              };
            });
            assert(geometry.columns && geometry.signatures);
            assert.equal(geometry.rows, count);
            assert(geometry.right <= viewport.width + 1, "all document columns fit viewport");

            const downloadEvent = page.waitForEvent("download");
            await button.click();
            const download = await downloadEvent;
            const stream = await download.createReadStream();
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const downloaded = Buffer.concat(chunks);
            const pages = (downloaded.toString("latin1").match(/\/Type \/Page\b/g) || []).length;
            assert.equal(downloaded.subarray(0,5).toString(), "%PDF-");
            assert(count === 4 ? pages === 1 : pages > 1, "single/multi-page real export");

            await page.getByRole("button",{name:"WhatsApp ile paylaş",exact:true}).click();
            const shared = await page.evaluate(async () => {
              const item=window.__shared[0];
              const bytes=new Uint8Array(await item.file.arrayBuffer());
              let binary="";
              for(let i=0;i<bytes.length;i+=16384) binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
              return {base64:btoa(binary),keys:item.keys,same:item.same,active:item.active};
            });
            assert.deepEqual(shared.keys, ["files"]);
            assert(shared.same);
            assert.notEqual(shared.active, false, "Web Share is called with user activation");
            const sharedBytes = Buffer.from(shared.base64,"base64");
            assert.deepEqual(sharedBytes, downloaded, "shared and downloaded PDF bytes must match exactly");

            await page.evaluate(() => { window.__supported=false; });
            const fallbackEvent = page.waitForEvent("download");
            await page.getByRole("button",{name:"WhatsApp ile paylaş",exact:true}).click();
            const fallbackDownload = await fallbackEvent;
            const fallbackChunks=[];
            for await (const chunk of await fallbackDownload.createReadStream()) fallbackChunks.push(chunk);
            assert.deepEqual(Buffer.concat(fallbackChunks),downloaded);
            await page.getByText(/Belge → Dosyalardan seç/).waitFor();

            const prefix="test-output/dispatch-sharing/"+name+"-"+count;
            fs.writeFileSync(prefix+"-download.pdf",downloaded);
            fs.writeFileSync(prefix+"-shared.pdf",sharedBytes);
            await page.screenshot({path:prefix+".png",fullPage:true});
            console.log(JSON.stringify({browser:name,viewport,rows:count,pages,bytes:downloaded.length,
              sha256:crypto.createHash("sha256").update(downloaded).digest("hex"),
              sharedBytesIdentical:true,fallbackBytesIdentical:true,columnsFit:true}));
          } finally { await context.close(); }
        }
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
