export const LOCALES = ["pt", "en", "cn"];
export const LOCALE_PREF_KEY = "seedbound.locale";

function supportedLocale(locale) {
  return LOCALES.includes(locale) ? locale : null;
}

export function parseLocale(locationLike = typeof window !== "undefined" ? window.location : { pathname: "/", search: "" }) {
  const search = typeof locationLike === "string" ? "" : locationLike.search || "";
  const queryLocale = new URLSearchParams(search).get("lang")?.toLowerCase();
  const fromQuery = supportedLocale(queryLocale);
  if (fromQuery) return fromQuery;

  const pathname = typeof locationLike === "string" ? locationLike : locationLike.pathname || "/";
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "en";
  if (seg === "cn") return "cn";
  return readLocalePreference() || detectBrowserLocale();
}

/** Map browser language tags to supported game locales. */
export function detectBrowserLocale(languages = []) {
  const tags = languages.length
    ? languages
    : (typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : []);
  for (const tag of tags) {
    const lower = String(tag || "").toLowerCase();
    if (!lower) continue;
    if (lower.startsWith("zh") || lower === "cn") return "cn";
    if (lower.startsWith("pt")) return "pt";
    if (lower.startsWith("en")) return "en";
  }
  return "pt";
}

export function readLocalePreference() {
  try {
    const saved = localStorage.getItem(LOCALE_PREF_KEY);
    if (saved && LOCALES.includes(saved)) return saved;
  } catch {
    // Ignore storage errors.
  }
  return null;
}

export function writeLocalePreference(locale) {
  try {
    if (LOCALES.includes(locale)) localStorage.setItem(LOCALE_PREF_KEY, locale);
  } catch {
    // Ignore storage errors.
  }
}

/** Store an initial locale without changing the URL; static game portals do not support SPA paths. */
export function redirectToLocaleIfNeeded() {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  const queryLocale = new URLSearchParams(search).get("lang")?.toLowerCase();
  if (supportedLocale(queryLocale)) {
    writeLocalePreference(queryLocale);
    return;
  }

  const pathSeg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();

  if (pathSeg === "en" || pathSeg === "cn") {
    writeLocalePreference(pathSeg);
    return;
  }

  const preferred = readLocalePreference() || detectBrowserLocale();
  writeLocalePreference(preferred);
}

export function localePath(locale) {
  if (locale === "en") return "/en";
  if (locale === "cn") return "/cn";
  return "/";
}

export function progressStorageKey(locale) {
  if (locale === "en") return "seedbound.en.progress";
  if (locale === "cn") return "seedbound.cn.progress";
  return "seedbound.br.progress";
}

export function htmlLang(locale) {
  if (locale === "en") return "en";
  if (locale === "cn") return "zh-CN";
  return "pt-BR";
}

export function switchLocaleHref(locale, search = typeof window !== "undefined" ? window.location.search : "") {
  const params = new URLSearchParams(search || "");
  params.set("lang", supportedLocale(locale) || "pt");
  const query = params.toString();
  return query ? `?${query}` : "?lang=pt";
}
