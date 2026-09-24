/**
 * DORUK ALP branded letterhead for the printable customer statement.
 * Colors are fixed (not theme variables) so the printout always comes out
 * navy/gold on white, exactly like the flyer — in both light and dark mode.
 * Brand text/phone/logo come from the editable Ayarlar.
 */
export function StatementLetterhead({
  customerName,
  address,
  phone,
  period,
  issued,
  brand,
}: {
  customerName: string;
  address?: string | null;
  phone?: string | null;
  period: string;
  issued: string;
  brand?: {
    storeName: string;
    tagline: string;
    storePhone: string | null;
    logoUrl: string | null;
  };
}) {
  const name = brand?.storeName ?? "DORUK ALP";
  const tagline = brand?.tagline ?? "Çamaşırhane";
  const brandPhone = brand?.storePhone ?? "+90 507 403 52 26";
  const words = name.trim().split(/\s+/);
  const firstName = words[0] ?? name;
  const rest = words.slice(1).join(" ");

  return (
    <div
      className="flex items-start justify-between gap-4 rounded-md px-5 py-4 mb-6"
      style={{ background: "#0E1A2B" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        {brand?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl}
            alt=""
            className="rounded object-contain shrink-0"
            style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
          />
        ) : (
          <div
            className="rounded flex items-center justify-center shrink-0"
            style={{ width: 44, height: 44, background: "#1E3252", border: "1px solid #C9A45C" }}
          >
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 17.5 9.2 8.2l3.4 5 2.1-2.9L21 17.5H3Z" fill="#C9A45C" />
              <path
                d="M12 3.2c1.1 1.5 2.3 3.2 2.3 4.6a2.3 2.3 0 1 1-4.6 0c0-1.4 1.2-3.1 2.3-4.6Z"
                fill="#F4EAD5"
              />
            </svg>
          </div>
        )}
        <div>
          <p className="text-lg font-bold tracking-tight leading-tight" style={{ color: "#FFFFFF" }}>
            {firstName} {rest && <span style={{ color: "#C9A45C" }}>{rest}</span>}
          </p>
          <p
            className="text-[10px] uppercase"
            style={{ color: "#D8B878", letterSpacing: "0.16em" }}
          >
            {tagline}
          </p>
          {brandPhone && (
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(244,234,213,0.65)" }}>
              {brandPhone}
            </p>
          )}
        </div>
      </div>

      {/* Document meta */}
      <div className="text-right">
        <p
          className="text-[10px] uppercase font-semibold"
          style={{ color: "#C9A45C", letterSpacing: "0.14em" }}
        >
          Hesap Ekstresi
        </p>
        <p className="text-xl font-semibold mt-0.5" style={{ color: "#FFFFFF" }}>
          {customerName}
        </p>
        {address && (
          <p className="text-xs" style={{ color: "rgba(244,234,213,0.75)" }}>
            {address}
          </p>
        )}
        {phone && (
          <p className="text-xs" style={{ color: "rgba(244,234,213,0.75)" }}>
            {phone}
          </p>
        )}
        <p className="text-xs mt-1 font-medium" style={{ color: "#D8B878" }}>
          Dönem: {period}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(244,234,213,0.5)" }}>
          Düzenlenme: {issued}
        </p>
      </div>
    </div>
  );
}
