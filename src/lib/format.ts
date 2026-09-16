export function formatKes(amount: number | string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function waLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "254");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits}`;
}
