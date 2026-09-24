import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ayarlar — Doruk Alp" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Ayarlar</h1>
      <p className="text-sm text-ink/55 mb-6">
        Mağaza bilgileri buradan güncellenir — hesap ekstresi ve menü otomatik yansır.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
