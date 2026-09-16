// Pure data — intentionally has no "server-only" guard and no database
// import so it can be shared by both the server-side settings module and
// the seed script.

export const SETTING_KEYS = {
  MPESA_RECEIVING_NUMBER: "mpesa_receiving_number",
  PAYMENT_INSTRUCTIONS: "payment_instructions",
  PAYMENT_RECEIVING_STATUS: "payment_receiving_status", // "ENABLED" | "DISABLED"
  PAYMENT_METHOD_LABEL: "supported_payment_method_label",
  BRAND_TAGLINE: "brand_tagline",
  MAX_ACTIVE_DEALS_PER_BUSINESS: "max_active_deals_per_business",
  LAUNCH_MODE: "launch_mode", // "LIVE" | "MAINTENANCE"
  DEMO_DATA_LABEL: "demo_data_label",
} as const;

export const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  [SETTING_KEYS.MPESA_RECEIVING_NUMBER]: {
    value: "",
    description:
      "Platform owner's personal M-PESA number that receives manual payments. Not a Till or PayBill. Must be set by an admin before payments can be accepted.",
  },
  [SETTING_KEYS.PAYMENT_INSTRUCTIONS]: {
    value:
      "Send the exact amount via M-PESA Send Money to the number shown, then enter the M-PESA transaction code below and submit. Your promotion activates after an admin verifies the payment.",
    description: "Instructions shown to businesses on the payment submission screen.",
  },
  [SETTING_KEYS.PAYMENT_RECEIVING_STATUS]: {
    value: "ENABLED",
    description: "ENABLED or DISABLED. When disabled, businesses cannot submit new payments.",
  },
  [SETTING_KEYS.PAYMENT_METHOD_LABEL]: {
    value: "M-PESA (Personal Number)",
    description: "Label shown for the supported payment method.",
  },
  [SETTING_KEYS.BRAND_TAGLINE]: {
    value: "Discover genuine local deals from businesses in your mtaani.",
    description: "Tagline shown on the homepage.",
  },
  [SETTING_KEYS.MAX_ACTIVE_DEALS_PER_BUSINESS]: {
    value: "5",
    description: "Maximum number of non-expired deals a single business may have at once.",
  },
  [SETTING_KEYS.LAUNCH_MODE]: {
    value: "LIVE",
    description: "LIVE or MAINTENANCE. Reserved for future maintenance-mode gating.",
  },
  [SETTING_KEYS.DEMO_DATA_LABEL]: {
    value: "Demo listing — for evaluation only, not a real business",
    description: "Label shown on demo/sample businesses and deals.",
  },
};
