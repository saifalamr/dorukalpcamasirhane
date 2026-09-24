"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Renders the page's .print-area element into a single-page-flowing PDF.
 * Always renders light (the print stylesheet already forces white bg).
 */
export async function printAreaToPdf(): Promise<Blob> {
  const el = document.querySelector(".print-area") as HTMLElement | null;
  if (!el) throw new Error("Yazdırılabilir içerik bulunamadı");

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgW = 210; // A4 mm
  const imgH = (canvas.height / canvas.width) * imgW;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, imgW, Math.min(imgH, 297 * 3));

  return pdf.output("blob");
}
