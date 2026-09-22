import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { daysInMonth, MONTHS_TR } from "@/lib/format";

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

  // Customer lookup and records fetch run in parallel.
  const [customerResult, recordsResult] = await Promise.all([
    supabase.from("customers").select("name").eq("id", customerId).maybeSingle(),
    supabase
      .from("daily_records")
      .select(
        "id, record_date, daily_record_items(product_id, quantity, line_total, products(name))"
      )
      .eq("customer_id", customerId)
      .gte("record_date", monthStart)
      .lte("record_date", monthEnd),
  ]);

  const customer = customerResult.data;
  if (!customer) {
    return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  }

  const { data: records } = recordsResult;

  type Row = {
    name: string;
    byDay: number[];
    totalQty: number;
    totalAmount: number;
  };
  const byProduct = new Map<string, Row>();

  for (const rec of records ?? []) {
    const recAny: any = rec;
    const day = parseInt((recAny.record_date as string).slice(8, 10), 10);

    for (const anyItem of recAny.daily_record_items ?? []) {
      const name = anyItem.products?.name ?? "";

      if (!byProduct.has(anyItem.product_id)) {
        byProduct.set(anyItem.product_id, {
          name,
          byDay: new Array(nDays).fill(0),
          totalQty: 0,
          totalAmount: 0,
        });
      }
      const row = byProduct.get(anyItem.product_id)!;
      row.byDay[day - 1] += Number(anyItem.quantity);
      row.totalQty += Number(anyItem.quantity);
      row.totalAmount += Number(anyItem.line_total);
    }
  }

  const rows = Array.from(byProduct.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "tr")
  );

  const header = [
    "MALZEME CİNSİ",
    ...Array.from({ length: nDays }, (_, i) => i + 1),
    "TOPLAM ADET",
    "BİRİM FİYAT",
    "TOPLAM TUTAR",
  ];

  const dataRows = rows.map((r) => [
    r.name,
    ...r.byDay.map((v) => (v > 0 ? v : "")),
    r.totalQty,
    r.totalQty > 0 ? Number((r.totalAmount / r.totalQty).toFixed(2)) : 0,
    Number(r.totalAmount.toFixed(2)),
  ]);

  const grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);

  const sheetData = [
    ["FİRMA ADI", customer.name],
    ["AİT OLDUĞU DÖNEM", `${MONTHS_TR[month - 1]} ${year}`],
    [],
    header,
    ...dataRows,
    [],
    [
      "",
      ...new Array(nDays).fill(""),
      "",
      "GENEL TOPLAM",
      Number(grandTotal.toFixed(2)),
    ],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = [
    { wch: 20 },
    ...Array.from({ length: nDays }, () => ({ wch: 5 })),
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Aylık Rapor");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const fileName = `${customer.name}_${MONTHS_TR[month - 1]}_${year}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}