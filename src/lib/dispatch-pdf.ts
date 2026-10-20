"use client";

/** Dispatch-only export: fixed paper width, A4 margins, and all notes/pages. */
export async function dispatchNotesToPdf(): Promise<Blob> {
  const notes = Array.from(document.querySelectorAll<HTMLElement>(".dispatch-page .dispatch-document"));
  if (!notes.length) throw new Error("Yazdırılabilir irsaliye bulunamadı");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  await document.fonts.ready;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = 210 - 2 * margin;
  const pageHeight = 297 - 2 * margin;
  let pageCount = 0;

  for (const note of notes) {
    // Render an unscaled copy outside the preview, never mutate live content.
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;left:-10000px;top:0;width:186mm;pointer-events:none;";
    const copy = note.cloneNode(true) as HTMLElement;
    host.appendChild(copy);
    document.body.appendChild(host);
    try {
      await Promise.all(Array.from(copy.querySelectorAll("img")).map(async image => {
        if (image.decode) await image.decode().catch(() => undefined);
      }));
      const width = copy.offsetWidth;
      const height = copy.scrollHeight;
      const origin = copy.getBoundingClientRect().top;
      const blocks = Array.from(copy.querySelectorAll<HTMLElement>("tr, [data-pdf-keep], p"))
        .map(element => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top - origin, bottom: rect.bottom - origin };
        });
      const canvas = await html2canvas(copy, {
        scale: 2,
        width,
        height,
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const ratio = canvas.width / width;
      const capacity = Math.floor(canvas.width * pageHeight / pageWidth);
      let start = 0;
      while (start < canvas.height) {
        let end = Math.min(start + capacity, canvas.height);
        if (end < canvas.height) {
          // Move a normal row/signature block intact to the next page.
          // Oversized blocks fall back to a page-sized slice to guarantee progress.
          const crossing = blocks.filter(block =>
            Math.floor(block.top * ratio) > start &&
            Math.floor(block.top * ratio) < end &&
            Math.ceil(block.bottom * ratio) > end
          );
          if (crossing.length) end = Math.min(...crossing.map(block => Math.floor(block.top * ratio)));
        }
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = end - start;
        const context = slice.getContext("2d");
        if (!context) throw new Error("PDF oluşturulamadı");
        context.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, slice.width, slice.height);
        if (pageCount++) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG",
          margin, margin, pageWidth, slice.height * pageWidth / canvas.width);
        start = end;
        slice.width = slice.height = 0;
      }
      canvas.width = canvas.height = 0;
    } finally {
      host.remove();
    }
  }
  return pdf.output("blob");
}
