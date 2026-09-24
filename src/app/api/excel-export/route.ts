import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { daysInMonth, MONTHS_TR } from "@/lib/format";
import { getSettings } from "@/lib/settings";

// Brand palette (matches the flyer / letterhead).
const NAVY = "FF0E1A2B";
const GOLD = "FFC9A45C";
const CREAM = "FFF4EAD5";
const INK = "FF1C2321";
const LINE = "FFDDD9CE";
const ZEBRA = "FFFAF8F2";
const GOLD_SOFT = "FFD8B878";

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

  // NOTE: product_id MUST be selected — it is the grouping key for the matrix.
  const [customerResult, recordsResult, settings] = await Promise.all([
    supabase.from("customers").select("name, address, phone").eq("id", customerId).maybeSingle(),
    supabase
      .from("daily_records")
      .select(
        "id, record_date, daily_record_items(product_id, quantity, unit_price_snapshot, line_total, products(name))"
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
      if (!anyItem.product_id) continue; // guard: never group into a shared key
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
  const ws = wb.addWorksheet("Aylık Rapor");

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

  // ===== Rows 1-3: branded header band =====
  // Fill the entire band navy first, then set text (no overlapping merges).
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= lastCol; c++) {
      ws.getCell(r, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    }
  }
  ws.mergeCells(1, 1, 3, 3);
  ws.getCell(1, 1).value = {
    richText: [
      { font: { size: 16, bold: true, color: { argb: "FFFFFFFF" } }, text: settings.store_name },
      { font: { size: 16, bold: true, color: { argb: GOLD } }, text: ` ${settings.store_tagline}` },
      { font: { size: 9, color: { argb: CREAM } }, text: settings.phone ? `\nTel: ${settings.phone}` : "" },
    ],
  };
  ws.getCell(1, 1).alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
  ws.mergeCells(1, 4, 3, lastCol);
  const periodCell = ws.getCell(1, 4);
  periodCell.value = `AYLIK HİZMET RAPORU — ${periodLabel.toUpperCase()}`;
  periodCell.font = { size: 13, bold: true, color: { argb: GOLD } };
  periodCell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
  for (let r = 1; r <= 3; r++) ws.getRow(r).height = 18;

  // ===== Row 4: customer info strip =====
  ws.mergeCells(4, 1, 4, 3);
  const firmCell = ws.getCell(4, 1);
  firmCell.value = `FİRMA: ${customer.name}`;
  firmCell.font = { size: 11, bold: true, color: { argb: INK } };
  firmCell.alignment = { horizontal: "left", indent: 1, vertical: "middle" };
  firmCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };

  ws.mergeCells(4, 4, 4, lastCol);
  const metaCell = ws.getCell(4, 4);
  metaCell.value = [
    `Sevkiyat Günü: ${deliveryDays}`,
    customer.phone ? `Tel: ${customer.phone}` : null,
  ].filter(Boolean).join("   •   ");
  metaCell.font = { size: 10, color: { argb: INK } };
  metaCell.alignment = { horizontal: "right", indent: 1, vertical: "middle" };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
  ws.getRow(4).height = 20;

  // ===== Rows 5-6: day-number header (day number + weekday letter) =====
  const headerRow = 6;
  const WEEKDAY_LETTERS = ["P", "P", "S", "Ç", "P", "C", "C"]; // Paz Paz Sal Çar Per Cum Cmt

  ws.mergeCells(5, 1, headerRow, 1);
  const nameHeader = ws.getCell(5, 1);
  nameHeader.value = "MALZEME CİNSİ";
  nameHeader.font = { bold: true, size: 10, color: { argb: INK } };
  nameHeader.alignment = { horizontal: "left", indent: 1, vertical: "middle" };

  for (let d = 1; d <= nDays; d++) {
    // Day number row (5)
    const numCell = ws.getCell(5, firstDayCol + d - 1);
    numCell.value = d;
    numCell.font = { bold: true, size: 9, color: { argb: INK } };
    numCell.alignment = { horizontal: "center", vertical: "middle" };
    // Weekday letter row (6)
    const wd = new Date(year, month - 1, d).getDay();
    const wdCell = ws.getCell(headerRow, firstDayCol + d - 1);
    wdCell.value = WEEKDAY_LETTERS[wd];
    wdCell.font = { size: 8, color: { argb: "FF9A9384" } };
    wdCell.alignment = { horizontal: "center", vertical: "middle" };
  }

  ws.mergeCells(5, qtyCol, headerRow, qtyCol);
  ws.mergeCells(5, priceCol, headerRow, priceCol);
  ws.mergeCells(5, amountCol, headerRow, amountCol);
  const tailHeaders: [number, string][] = [
    [qtyCol, "TOPLAM ADET"],
    [priceCol, "BİRİM FİYAT"],
    [amountCol, "TOPLAM TUTAR"],
  ];
  for (const [col, h] of tailHeaders) {
    const c = ws.getCell(5, col);
    c.value = h;
    c.font = { bold: true, size: 9, color: { argb: INK } };
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  }

  for (let r = 5; r <= headerRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      cell.border = {
        bottom: { style: "thin", color: { argb: LINE } },
        left: { style: "thin", color: { argb: LINE } },
        right: { style: "thin", color: { argb: LINE } },
      };
    }
  }
  ws.getRow(5).height = 16;
  ws.getRow(headerRow).height = 14;

  // ===== Data rows =====
  const thinLine = { style: "thin" as const, color: { argb: LINE } };
  const weekendFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3EFE3" } };
  let r = headerRow;
  rows.forEach((row, idx) => {
    r += 1;
    const zebra = idx % 2 === 1;

    const nameCell = ws.getCell(r, 1);
    nameCell.value = `${idx + 1}. ${row.name}`;
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
    priceCell.alignment = { horizontal: "right", indent: 1 };
    priceCell.numFmt = "#,##0.00\\ \"₺\"";

    const amtCell = ws.getCell(r, amountCol);
    amtCell.value = row.totalAmount;
    amtCell.font = { size: 10, bold: true, color: { argb: INK } };
    amtCell.alignment = { horizontal: "right", indent: 1 };
    amtCell.numFmt = "#,##0.00\\ \"₺\"";

    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = { bottom: thinLine, left: thinLine, right: thinLine };
      if (zebra) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    }
  });

  // ===== Grand total row =====
  if (rows.length > 0) {
    r += 1;
    ws.mergeCells(r, 1, r, qtyCol - 1);
    const labelCell = ws.getCell(r, 1);
    labelCell.value = "GENEL TOPLAM";
    labelCell.font = { bold: true, size: 11, color: { argb: NAVY } };
    labelCell.alignment = { horizontal: "right", vertical: "middle", indent: 1 };

    const gQty = ws.getCell(r, qtyCol);
    gQty.value = grandQty;
    gQty.font = { bold: true, size: 11, color: { argb: NAVY } };
    gQty.alignment = { horizontal: "center" };

    const gPrice = ws.getCell(r, priceCol);
    gPrice.value = null;
    gPrice.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD_SOFT } };

    const gAmt = ws.getCell(r, amountCol);
    gAmt.value = grandTotal;
    gAmt.font = { bold: true, size: 11, color: { argb: NAVY } };
    gAmt.alignment = { horizontal: "right", indent: 1 };
    gAmt.numFmt = "#,##0.00\\ \"₺\"";

    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      cell.border = { top: { style: "medium", color: { argb: NAVY } } };
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

  // Freeze panes below the day header, print setup.
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: headerRow }];
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
