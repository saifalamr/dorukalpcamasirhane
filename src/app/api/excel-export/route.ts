import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { daysInMonth, MONTHS_TR } from "@/lib/format";
import { getSettings } from "@/lib/settings";

// Brand palette (matches the flyer / letterhead).
const NAVY = "FF0E1A2B";
const NAVY_SOFT = "FF1E3252";
const GOLD = "FFC9A45C";
const CREAM = "FFF4EAD5";
const INK = "FF1C2321";
const LINE = "FFDDD9CE";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer");
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!customerId || !year || !month) {
    return NextResponse.json(
      { error: "customer, year ve month zorunludur." },
      { status: 400 }
    );
  }

  const nDays = daysInMonth(year, month);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(nDays).padStart(2, "0")}`;

  const [customerResult, recordsResult, settings] = await Promise.all([
    supabase.from("customers").select("name, address, phone").eq("id", customerId).maybeSingle(),
    supabase
      .from("daily_records")
      .select(
        "id, record_date, daily_record_items(quantity, unit_price_snapshot, line_total, products(name))"
      )
      .eq("customer_id", customerId)
      .gte("record_date", monthStart)
      .lte("record_date", monthEnd),
    getSettings(),
  ]);

  const customer = customerResult.data;
  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  }

  const records = recordsResult.data ?? [];

  type Row = {
    name: string;
    byDay: number[];
    totalQty: number;
    totalAmount: number;
    price: number; // last seen snapshot price
  };
  const byProduct = new Map<string, Row>();

  for (const rec of records) {
    const recAny: any = rec;
    const day = parseInt((recAny.record_date as string).slice(8, 10), 10);

    for (const anyItem of recAny.daily_record_items ?? []) {
      if (!byProduct.has(anyItem.product_id)) {
        byProduct.set(anyItem.product_id, {
          name: anyItem.products?.name ?? "",
          byDay: new Array(nDays).fill(0),
          totalQty: 0,
          totalAmount: 0,
          price: 0,
        });
      }
      const row = byProduct.get(anyItem.product_id)!;
      row.byDay[day - 1] += Number(anyItem.quantity);
      row.totalQty += Number(anyItem.quantity);
      row.totalAmount += Number(anyItem.line_total);
      if (Number(anyItem.unit_price_snapshot) > 0) {
        row.price = Number(anyItem.unit_price_snapshot);
      }
    }
  }

  const rows = Array.from(byProduct.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );
  const grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);
  const grandQty = rows.reduce((s, r) => s + r.totalQty, 0);
  const deliveryDays = new Set(records.map((r: any) => r.record_date as string)).size;
  const periodLabel = `${MONTHS_TR[month - 1]} ${year}`;

  // ===== Workbook =====
  const wb = new ExcelJS.Workbook();
  wb.creator = settings.store_name;
  const ws = wb.addWorksheet("Aylık Rapor", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: "frozen", ySplit: 5 }],
  });

  // Columns: A = malzeme, B.. = days 1..n, then totals.
  const firstDayCol = 2;
  const qtyCol = firstDayCol + nDays;
  const priceCol = qtyCol + 1;
  const amountCol = priceCol + 1;
  const lastCol = amountCol;

  ws.columns = [
    { width: 22 },
    ...Array.from({ length: nDays }, () => ({ width: 5.5 })),
    { width: 12 },
    { width: 11 },
    { width: 14 },
  ];

  const colLetter = (col: number) => ws.getColumn(col).letter;

  // ===== Row 1-3: branded header band =====
  ws.mergeCells(1, 1, 3, 3);
  const brandCell = ws.getCell(1, 1);
  brandCell.value = `${settings.store_name} ${settings.store_tagline}`.trim();
  brandCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  brandCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  brandCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

  ws.mergeCells(1, 4, 3, Math.max(4, Math.min(lastCol, 12)));
  const periodCell = ws.getCell(1, 4);
  periodCell.value = `AYLIK HİZMET RAPORU — ${periodLabel.toUpperCase()}`;
  periodCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: GOLD } };
  periodCell.alignment = { vertical: "middle", horizontal: "right" };
  periodCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

  // Fill any remaining header columns with navy so the band is continuous.
  for (let c = Math.max(4, Math.min(lastCol, 12)) + 1; c <= lastCol; c++) {
    ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    ws.getCell(2, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    ws.getCell(3, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  }
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= lastCol; c++) {
      ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    }
  }
  // Re-apply text after the full-band fill.
  ws.getCell(1, 1).value = `${settings.store_name} ${settings.store_tagline}`.trim();
  ws.getCell(1, 1).font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  ws.getCell(1, 1).alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getCell(1, 4).value = `AYLIK HİZMET RAPORU — ${periodLabel.toUpperCase()}`;
  ws.getCell(1, 4).font = { name: "Calibri", size: 12, bold: true, color: { argb: GOLD } };
  ws.getCell(1, 4).alignment = { vertical: "middle", horizontal: "right" };

  if (settings.phone) {
    ws.mergeCells(2, 1, 2, 3);
    const phoneCell = ws.getCell(2, 1);
    phoneCell.value = `Tel: ${settings.phone}`;
    phoneCell.font = { size: 10, color: { argb: "FFF4EAD5" } };
    phoneCell.alignment = { horizontal: "left", indent: 1 };
  }

  // ===== Row 4: customer info strip =====
  ws.mergeCells(4, 1, 4, 3);
  const firmCell = ws.getCell(4, 1);
  firmCell.value = `FİRMA: ${customer.name}`;
  firmCell.font = { size: 11, bold: true, color: { argb: INK } };
  firmCell.alignment = { horizontal: "left", indent: 1 };
  firmCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };

  ws.mergeCells(4, 4, 4, lastCol);
  const metaCell = ws.getCell(4, 4);
  const metaParts = [
    `Sevkiyat Günü: ${deliveryDays}`,
    customer.phone ? `Tel: ${customer.phone}` : null,
  ].filter(Boolean);
  metaCell.value = metaParts.join("   •   ");
  metaCell.font = { size: 10, color: { argb: INK } };
  metaCell.alignment = { horizontal: "right" };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };

  // ===== Row 5: day-number header =====
  const headerRow = 5;
  const nameHeader = ws.getCell(headerRow, 1);
  nameHeader.value = "MALZEME CİNSİ";
  nameHeader.font = { bold: true, size: 10, color: { argb: INK } };
  nameHeader.alignment = { horizontal: "left", indent: 1, vertical: "middle" };

  for (let d = 1; d <= nDays; d++) {
    const c = ws.getCell(headerRow, firstDayCol + d - 1);
    c.value = d;
    c.font = { bold: true, size: 9, color: { argb: INK } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  }

  const tailHeaders = ["TOPLAM ADET", "BİRİM FİYAT", "TOPLAM TUTAR"];
  tailHeaders.forEach((h, i) => {
    const c = ws.getCell(headerRow, qtyCol + i);
    c.value = h;
    c.font = { bold: true, size: 9, color: { argb: INK } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  for (let c = 1; c <= lastCol; c++) {
    const cell = ws.getCell(headerRow, c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
    cell.border = {
      bottom: { style: "thin", color: { argb: LINE } },
      left: { style: "thin", color: { argb: LINE } },
      right: { style: "thin", color: { argb: LINE } },
    };
  }
  ws.getRow(headerRow).height = 22;

  // ===== Data rows =====
  const thinLine = { style: "thin" as const, color: { argb: LINE } };
  let r = headerRow;
  rows.forEach((row, idx) => {
    r += 1;
    const zebra = idx % 2 === 1;

    const nameCell = ws.getCell(r, 1);
    nameCell.value = row.name;
    nameCell.font = { size: 10, color: { argb: INK } };
    nameCell.alignment = { horizontal: "left", indent: 1 };

    for (let d = 1; d <= nDays; d++) {
      const v = row.byDay[d - 1];
      const c = ws.getCell(r, firstDayCol + d - 1);
      c.value = v > 0 ? v : null;
      c.font = { size: 9, color: { argb: INK } };
      c.alignment = { horizontal: "center" };
      c.numFmt = "0.#";
    }

    const qtyCell = ws.getCell(r, qtyCol);
    qtyCell.value = row.totalQty;
    qtyCell.font = { size: 10, bold: true, color: { argb: INK } };
    qtyCell.alignment = { horizontal: "center" };
    qtyCell.numFmt = "#,##0.#";

    const priceCell = ws.getCell(r, priceCol);
    priceCell.value = row.price;
    priceCell.font = { size: 10, color: { argb: INK } };
    priceCell.alignment = { horizontal: "right" };
    priceCell.numFmt = "#,##0.00\\ \"₺\"";

    const amtCell = ws.getCell(r, amountCol);
    amtCell.value = row.totalAmount;
    amtCell.font = { size: 10, bold: true, color: { argb: INK } };
    amtCell.alignment = { horizontal: "right" };
    amtCell.numFmt = "#,##0.00\\ \"₺\"";

    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = { bottom: thinLine, left: thinLine, right: thinLine };
      if (zebra) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF8F2" } };
      }
    }
  });

  // ===== Grand total row =====
  if (rows.length > 0) {
    r += 1;
    ws.mergeCells(r, 1, r, qtyCol - 1);
    const labelCell = ws.getCell(r, 1);
    labelCell.value = "GENEL TOPLAM";
    labelCell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    labelCell.alignment = { horizontal: "right", vertical: "middle" };

    const gQty = ws.getCell(r, qtyCol);
    gQty.value = grandQty;
    gQty.font = { bold: true, size: 11, color: { argb: NAVY } };
    gQty.alignment = { horizontal: "center" };

    const gAmt = ws.getCell(r, amountCol);
    gAmt.value = grandTotal;
    gAmt.font = { bold: true, size: 11, color: { argb: NAVY } };
    gAmt.alignment = { horizontal: "right" };
    gAmt.numFmt = "#,##0.00\\ \"₺\"";

    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      if (c !== 1) {
        cell.border = { top: { style: "medium", color: { argb: NAVY } } };
      }
    }
    ws.getRow(r).height = 20;
  }

  // Footer note
  r += 2;
  ws.mergeCells(r, 1, r, lastCol);
  const footCell = ws.getCell(r, 1);
  footCell.value = `${settings.store_name} — ${periodLabel} dönemi hizmet raporu. Fiyatlar teslim anındaki anlaşmalı birim fiyatlarından hesaplanmıştır.`;
  footCell.font = { size: 9, italic: true, color: { argb: "FF888888" } };
  footCell.alignment = { horizontal: "left", indent: 1 };

  // Freeze panes below header, print setup.
  ws.views = [{ state: "frozen", ySplit: headerRow }];
  ws.pageSetup.orientation = "landscape";
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 0;

  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `${customer.name}_${MONTHS_TR[month - 1]}_${year}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
