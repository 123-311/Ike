import { getAllSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold mb-1">Platform Settings</h1>
      <p className="text-sm text-muted mb-4">
        These values are stored in the database and read dynamically — no
        code changes or redeploy needed.
      </p>
      <SettingsForm
        values={{
          mpesa_receiving_number: settings.get(SETTING_KEYS.MPESA_RECEIVING_NUMBER) ?? "",
          payment_instructions: settings.get(SETTING_KEYS.PAYMENT_INSTRUCTIONS) ?? "",
          payment_receiving_status: settings.get(SETTING_KEYS.PAYMENT_RECEIVING_STATUS) ?? "DISABLED",
          supported_payment_method_label: settings.get(SETTING_KEYS.PAYMENT_METHOD_LABEL) ?? "",
          brand_tagline: settings.get(SETTING_KEYS.BRAND_TAGLINE) ?? "",
          max_active_deals_per_business: settings.get(SETTING_KEYS.MAX_ACTIVE_DEALS_PER_BUSINESS) ?? "5",
        }}
      />
    </div>
  );
}
