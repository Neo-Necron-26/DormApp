import type { Listing } from "@sfu/shared";
import type { StringKey } from "@sfu/shared";

// Category set matches spec §3.1's feed chips exactly (minus "Все", which is a
// filter, not a listing category). Stored as plain RU strings on the record —
// like the rest of this app's free-text domain data, category names are not
// translated per-viewer language.
export const LISTING_CATEGORIES = [
  "Услуги и репетиторство",
  "Бытовая техника",
  "Учёба и книги",
  "Одежда и вещи",
  "Ищу / Куплю",
  "U-Shop",
] as const;

export type DealType = "sell" | "wanted" | "service";

export function dealTypeOf(category: string): DealType {
  if (category === "Ищу / Куплю") return "wanted";
  if (category === "Услуги и репетиторство") return "service";
  return "sell";
}

export function dealTypeLabelKey(type: DealType): StringKey {
  if (type === "wanted") return "dealTypeWanted";
  if (type === "service") return "dealTypeService";
  return "dealTypeSell";
}

/** CTA button label on the listing detail screen, per spec §3.3's 3 contextual actions. */
export function ctaLabelKey(type: DealType): StringKey {
  if (type === "wanted") return "ctaRespond";
  if (type === "service") return "ctaSignUp";
  return "ctaBook";
}

export function formatListingPrice(listing: Pick<Listing, "price" | "negotiable" | "category">, t: (k: StringKey) => string): string {
  const type = dealTypeOf(listing.category);
  if (listing.negotiable) return t("negotiable");
  if (listing.price === 0) return t("priceFree");
  const amount = `${listing.price.toLocaleString("ru-RU")} ₽`;
  return type === "service" ? `${amount}${t("perHour")}` : amount;
}

const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** "В приложении с ..." on the seller card. */
export function memberSince(iso: string): string {
  const d = new Date(iso);
  return `в приложении с ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Время публикации" — a short relative-time string for listing/news cards. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}
