// Ported from `project/dorm-map.js` — real SFU dormitory campus coordinates
// (Krasnoyarsk). Home dorm is №6 (Свободный, 79).
export interface DormMeta {
  id: number;
  nameRu: string;
  nameEn: string;
  addrRu: string;
  addrEn: string;
  lat: number;
  lng: number;
}

export const HOME_DORM_ID = 6;

export const DORMS: DormMeta[] = [
  { id: 6, nameRu: "Общежитие №6", nameEn: "Dorm №6", addrRu: "Борисова, 14А", addrEn: "Borisova 14A", lat: 56.002885, lng: 92.776655 },
  { id: 8, nameRu: "Общежитие №8", nameEn: "Dorm №8", addrRu: "Борисова, 6", addrEn: "Borisova 6", lat: 55.993630, lng: 92.788513 },
  { id: 2, nameRu: "Общежитие №2", nameEn: "Dorm №2", addrRu: "Свободный, 81", addrEn: "Svobodny 81", lat: 56.000704, lng: 92.773421 },
  { id: 5, nameRu: "Общежитие №5", nameEn: "Dorm №5", addrRu: "Борисова, 24", addrEn: "Borisova 24", lat: 55.994265, lng: 92.796050 },
  { id: 22, nameRu: "Общежитие №22", nameEn: "Dorm №22", addrRu: "Свободный, 76Д", addrEn: "Svobodny 76D", lat: 56.007811, lng: 92.767914 },
  { id: 23, nameRu: "Общежитие №23", nameEn: "Dorm №23", addrRu: "Свободный, 76Ж", addrEn: "Svobodny 76ZH", lat: 56.008400, lng: 92.767000 },
  { id: 20, nameRu: "Общежитие №20", nameEn: "Dorm №20", addrRu: "Свободный, 76А", addrEn: "Svobodny 76A", lat: 56.007368, lng: 92.768283 },
  { id: 12, nameRu: "Общежитие №12", nameEn: "Dorm №12", addrRu: "Академика Вавилова, 64", addrEn: "Vavilova 64", lat: 56.002200, lng: 92.930400 },
];

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(meters: number, lang: "ru" | "en"): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} ${lang === "ru" ? "м" : "m"}`;
  return `${(meters / 1000).toFixed(1)} ${lang === "ru" ? "км" : "km"}`;
}

export function formatWalkTime(meters: number, lang: "ru" | "en"): string {
  const min = Math.max(1, Math.round(meters / 80));
  return `${min} ${lang === "ru" ? "мин" : "min"}`;
}

export interface DormWithDistance extends DormMeta {
  meters: number;
  isHome: boolean;
  distanceText?: string;
  walkText?: string;
  listingsCount?: number;
}

export function dormsWithDistance(lang: "ru" | "en"): DormWithDistance[] {
  const home = DORMS.find((d) => d.id === HOME_DORM_ID)!;
  return DORMS.map((d) => {
    const meters = Math.round(haversineMeters(home, d));
    return {
      ...d,
      meters,
      isHome: d.id === HOME_DORM_ID,
      distanceText: d.id === HOME_DORM_ID ? undefined : formatDistance(meters, lang),
      walkText: d.id === HOME_DORM_ID ? undefined : formatWalkTime(meters, lang),
    };
  }).sort((a, b) => a.meters - b.meters);
}

/**
 * A real rendered campus map image (Yandex's static-maps endpoint, `ll`/`pt`
 * use lon,lat order) — no API key required for this endpoint. Used instead of
 * `react-native-maps` because that needs a paid Google Maps key on Android
 * and has no web target at all; this
 * works identically on iOS/Android/web with zero native dependencies.
 */
export function campusStaticMapUrl(dorms: DormMeta[] = DORMS, opts?: { width?: number; height?: number }): string {
  const width = opts?.width ?? 640;
  const height = opts?.height ?? 420;
  const lats = dorms.map((d) => d.lat);
  const lngs = dorms.map((d) => d.lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const points = dorms
    .map((d) => `${d.lng},${d.lat},${d.id === HOME_DORM_ID ? "pm2blm" : "pm2rdm"}`)
    .join("~");
  const params = new URLSearchParams({ ll: `${centerLng},${centerLat}`, z: "13", l: "map", size: `${width},${height}`, pt: points });
  return `https://static-maps.yandex.ru/1.x/?${params.toString()}`;
}

/** Opens the real Yandex Maps app/site with walking directions from the user's current location. */
export function yandexRouteUrl(dorm: { lat: number; lng: number }): string {
  return `https://yandex.ru/maps/?rtext=~${dorm.lat},${dorm.lng}&rtt=pd`;
}

/** Opens 2GIS with the dorm pinned as the destination (2GIS resolves the route itself once opened). */
export function twoGisRouteUrl(dorm: { lat: number; lng: number }): string {
  return `https://2gis.ru/krasnoyarsk/geo/${dorm.lng},${dorm.lat}`;
}
