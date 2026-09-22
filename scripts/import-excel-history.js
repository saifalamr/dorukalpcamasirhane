/**
 * Excel → SQL import generator.
 * Reads the owner's monthly Excel files (Ağustos 2026) and produces
 * supabase/migration/import-august.sql with daily_records + items,
 * priced with the catalog list prices (products.default_price).
 *
 * Run:  node scripts/import-excel-history.js
 * Then paste the generated SQL into the Supabase SQL Editor.
 *
 * Each source file layout (verified against 8.DEMİRAY OTEL AGUSTOS-1.xlsx):
 *   row 0: [..., "FİRMA ADI:", ..., "DEMİRAY"]           -> customer name (last non-null cell)
 *   row 5: ["S.NO","MELZEME CİNSİ ",..., 46235, 46236...] -> Excel date serials from col 11
 *   rows 6+: [1,"Çarşaf Büyük",... , 46, 44, 47, ...]     -> product name + daily quantities
 *
 * Date serial 46235 = 2026-08-01 (Excel epoch 1899-12-30).
 * Quantities of 0/null/empty are skipped (no fiş that day for that item).
 * A day with no quantities gets no record at all.
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const SOURCE_DIR = "C:/Users/saifa/Desktop/hakan abi";
const OUT_PATH = path.join(__dirname, "..", "supabase", "migration", "import-august.sql");

// Excel serial -> YYYY-MM-DD (no timezone games: pure arithmetic on the epoch).
function serialToISO(serial) {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// Normalize product names: Excel has typos/variants ("Ayak Havlıusu", "Paspas ").
function normName(s) {
  return String(s)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr");
}

// Known Excel variants -> catalog names (checked against seed.sql / flyer list).
const PRODUCT_ALIASES = {
  "ayak havlıusu": "Ayak Havlusu",
  "ayak havlusu": "Ayak Havlusu",
  "paspas": "Paspas",
  "tül perde m2": "Tül Perde",
  "saten perde m2": "Saten Perde",
  "tül perde m²": "Tül Perde",
  "saten perde m²": "Saten Perde",
};

// Customer name normalization: file names vs DB customers (case/spacing tolerant).
function normCustomer(s) {
  return String(s)
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("tr");
}

const CUSTOMER_ALIASES = {
  // Excel value (normalized) -> exact DB name
  "demiray": "DEMİRAY",
  "faros": "FAROS",
  "faros taxim": "FAROS TAKSİM",
  "faros taksim": "FAROS TAKSİM",
  "storia": "STORİA",
  "storia galata": "STORİA",
  "kız": "KIZ yurt",
  "kiz": "KIZ yurt",
  "kiz yurt": "KIZ yurt",
  "kiz yurdu": "KIZ yurt",
  "erkek": "ERKEK",
  "erk yurt": "ERKEK",
  "esen spa": "ESEN SPA",
  "sürmeli otel": "SÜRMELİ OTEL",
  "surmeli otel": "SÜRMELİ OTEL",
  "santa": "SANTA",
  "ottoman": "OTTOMAN",
  "taxim suit": "TAKSİM SUİT",
  "taksim suit": "TAKSİM SUİT",
  "m.q. otel": "M.Q. OTEL",       // not in DB — reported as missing, skipped in SQL
};

const files = fs
  .readdirSync(SOURCE_DIR)
  .filter((f) => f.toLowerCase().endsWith(".xlsx"));

const recordsByDay = new Map(); // key: customer|date -> [{product, qty}]
const unmatchedCustomers = new Set();
const unmatchedProducts = new Set();
const matchedCustomers = new Set();
let filesParsed = 0;

for (const file of files) {
  let wb;
  try {
    wb = XLSX.readFile(path.join(SOURCE_DIR, file));
  } catch (e) {
    console.warn("SKIP (unreadable):", file, e.message);
    continue;
  }

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    if (!rows.length) continue;

    // --- customer name: row 0, cells after "FİRMA ADI:"; fallback: value in the header row ---
    let customer = null;
    const headerRow = rows[0] ?? [];
    const firmaIdx = headerRow.findIndex((c) => typeof c === "string" && c.includes("FİRMA"));
    if (firmaIdx >= 0) {
      for (let i = headerRow.length - 1; i > firmaIdx; i--) {
        if (typeof headerRow[i] === "string" && headerRow[i].trim()) {
          customer = headerRow[i].trim();
          break;
        }
      }
    }
    if (!customer) {
      // some files may carry the firm name on the sheet-named pattern; use filename
      customer = file.replace(/\.xlsx$/i, "").replace(/^\d+[,.]?\s*/, "").replace(/\s*AGUSTOS.*$/i, "").trim();
    }

    const custKey = normCustomer(customer);
    const mappedCustomer = CUSTOMER_ALIASES[custKey] ?? null;
    if (!mappedCustomer) unmatchedCustomers.add(customer);
    else matchedCustomers.add(mappedCustomer);

    // --- date columns: the row whose first cell is "S.NO" ---
    const dateRowIdx = rows.findIndex((r) => r && typeof r[0] === "string" && r[0].includes("S.NO"));
    if (dateRowIdx === -1) continue;
    const dateRow = rows[dateRowIdx];
    const dates = []; // {col, iso}
    for (let c = 2; c < dateRow.length; c++) {
      const v = dateRow[c];
      if (typeof v === "number" && v > 40000 && v < 60000) {
        dates.push({ col: c, iso: serialToISO(v) });
      }
    }
    if (dates.length === 0) continue;

    // --- product rows ---
    for (let r = dateRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || typeof row[1] !== "string") continue;
      if (typeof row[0] !== "number") continue; // stop-ish at non-numbered rows

      const rawName = row[1];
      const key = normName(rawName);
      const product = PRODUCT_ALIASES[key] ?? rawName.replace(/\s+/g, " ").trim();
      const known = PRODUCT_ALIASES[key] !== undefined || key.length > 0; // matched against DB later in SQL
      if (!known) unmatchedProducts.add(rawName);

      for (const { col, iso } of dates) {
        const q = row[col];
        if (typeof q === "number" && q > 0) {
          const custName = mappedCustomer ?? customer;
          const k = custName + "|" + iso;
          if (!recordsByDay.has(k)) recordsByDay.set(k, []);
          recordsByDay.get(k).push({ product, qty: q });
        }
      }
    }
  }
  filesParsed++;
}

// ---------- Generate SQL ----------
const lines = [];
lines.push("-- import-august.sql — generated by scripts/import-excel-history.js");
lines.push("-- Source: " + filesParsed + " Excel files (Ağustos 2026) from the owner.");
lines.push("-- Prices come from products.default_price (flyer list prices) at insert time.");
lines.push("-- Payments are NOT imported (per decision).");
lines.push("");
lines.push("-- Map customer names (case-insensitive, alias-aware).");
lines.push("create temp table import_map (file_name text, customer_id uuid);");
const allCustomerNames = new Set([...recordsByDay.keys()].map((k) => k.split("|")[0]));
for (const name of [...allCustomerNames].sort()) {
  lines.push(
    `insert into import_map select '${name.replace(/'/g, "''")}', c.id from customers c where lower(c.name) = lower('${name.replace(/'/g, "''")}');`
  );
}
lines.push("");
lines.push("-- Unmapped file-customers: raise a warning (SELECT can't return rows inside DO blocks).");
lines.push(
  "begin for rec in select distinct split_part(k, '|', 1) as nm from (values " +
    [...allCustomerNames].map((n) => `('${n.replace(/'/g, "''")}')`).join(",") +
    ") v(k) where split_part(k,'|',1) not in (select file_name from import_map) loop raise warning 'CUSTOMER NOT IN DB, SKIPPED: %', rec.nm; end loop; end;"
);
lines.push("");

let recordCount = 0;
let itemCount = 0;
const recordVars = [];

for (const [key, items] of [...recordsByDay.entries()].sort()) {
  const [custName, date] = key.split("|");
  const varName = `r${recordCount}`;
  recordCount++;
  lines.push(
    `insert into daily_records (customer_id, record_date) ` +
      `select m.customer_id, '${date}' from import_map m where m.file_name = ${sqlStr(custName)} ` +
      `on conflict (customer_id, record_date) do nothing ` +
      `returning id into ${varName};`
  );
  // if conflict skipped, variable is null -> select existing id
  lines.push(
    `${varName} := coalesce(${varName}, (select dr.id from daily_records dr join import_map m on m.customer_id = dr.customer_id where m.file_name = ${sqlStr(custName)} and dr.record_date = '${date}'));`
  );
  for (const it of items) {
    itemCount++;
    lines.push(
      `insert into daily_record_items (daily_record_id, product_id, quantity, unit_price_snapshot) ` +
        `select ${varName}, p.id, ${it.qty}, p.default_price from products p where lower(p.name) = lower(${sqlStr(it.product)}) ` +
        `and ${varName} is not null ` +
        `on conflict (daily_record_id, product_id) do nothing;`
    );
  }
  lines.push("");
}

// Wrap in a DO block because of the variables.
const bodyStart = lines.findIndex((l) => l.startsWith("-- Map customer names"));
const body = bodyStart >= 0 ? lines.slice(bodyStart) : [];

const output = [
  "-- import-august.sql — generated by scripts/import-excel-history.js",
  `-- Source: ${filesParsed} Excel files (Ağustos 2026) — ${recordCount} fiş days, ${itemCount} line items.`,
  "-- Prices: products.default_price (flyer). Payments: not imported.",
  "",
  "do $$",
  "declare",
  "  rec record;",
  ...Array.from({ length: recordCount }, (_, i) => `  r${i} uuid;`),
  "begin",
  ...body.map((l) => (l.startsWith("--") || l === "" ? "  " + l : "  " + l)),
  "end $$;",
  "",
  "-- Verify:",
  "select count(*) as records from daily_records;",
  "select count(*) as items from daily_record_items;",
  "select c.name, count(dr.id) as days, sum(dri.line_total) as total",
  "from customers c join daily_records dr on dr.customer_id = c.id",
  "join daily_record_items dri on dri.daily_record_id = dr.id",
  "group by c.name order by total desc nulls last;",
];

fs.writeFileSync(OUT_PATH, output.join("\n"), "utf8");

// ---------- Console report ----------
console.log("Parsed", filesParsed, "files.");
console.log("Matched customers:", [...matchedCustomers].join(", "));
console.log("UNMATCHED customers (not in DB):", unmatchedCustomers.size ? [...unmatchedCustomers].join(", ") : "(none)");
console.log("Fiş days:", recordCount, "| line items:", itemCount);
console.log("Wrote:", OUT_PATH);
