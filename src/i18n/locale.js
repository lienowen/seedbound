export const LOCALES = ["pt", "en", "cn"];
export const LOCALE_PREF_KEY = "cozyshelf.locale";
// English-only release: the locale is permanently locked to English. The pt/cn
// translation data is kept in the bundle but never surfaced, and the language
// switcher stays hidden. To re-open multi-language later, revert this to read
// from VITE_REVIEW_LOCALE_LOCK.
export const REVIEW_LOCALE_LOCK = "en";
const MULTILANG_QUERY_KEY = "multilang";

export function effectiveLocale(locale) {
  return REVIEW_LOCALE_LOCK || (LOCALES.includes(locale) ? locale : null) || "en";
}

export function isLocaleSwitcherEnabled() {
  if (REVIEW_LOCALE_LOCK) return false;
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    const flag = String(url.searchParams.get(MULTILANG_QUERY_KEY) || "").toLowerCase();
    return flag === "1" || flag === "true" || flag === "yes";
  } catch {
    return false;
  }
}

function supportedLocale(locale) {
  return LOCALES.includes(locale) ? locale : null;
}

export function parseLocale(locationLike = typeof window !== "undefined" ? window.location : { pathname: "/", search: "" }) {
  if (REVIEW_LOCALE_LOCK) return REVIEW_LOCALE_LOCK;
  const search = typeof locationLike === "string" ? "" : locationLike.search || "";
  const queryLocale = new URLSearchParams(search).get("lang")?.toLowerCase();
  const fromQuery = supportedLocale(queryLocale);
  if (fromQuery) return fromQuery;

  if (typeof window !== "undefined" && !isLocaleSwitcherEnabled()) {
    return "en";
  }

  const pathname = typeof locationLike === "string" ? locationLike : locationLike.pathname || "/";
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "en";
  if (seg === "cn") return "cn";
  return readLocalePreference() || detectBrowserLocale();
}

/** Map browser language tags to supported game locales. */
export function detectBrowserLocale(languages = []) {
  if (REVIEW_LOCALE_LOCK) return REVIEW_LOCALE_LOCK;
  if (typeof window !== "undefined" && !isLocaleSwitcherEnabled()) return "en";
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
  if (REVIEW_LOCALE_LOCK) return REVIEW_LOCALE_LOCK;
  try {
    const saved = localStorage.getItem(LOCALE_PREF_KEY);
    if (saved && LOCALES.includes(saved)) return saved;
  } catch {
    // Ignore storage errors.
  }
  return null;
}

export function writeLocalePreference(locale) {
  if (REVIEW_LOCALE_LOCK) return;
  try {
    if (LOCALES.includes(locale)) localStorage.setItem(LOCALE_PREF_KEY, locale);
  } catch {
    // Ignore storage errors.
  }
}

/** Store an initial locale without changing the URL; static game portals do not support SPA paths. */
export function redirectToLocaleIfNeeded() {
  if (typeof window === "undefined") return;
  if (REVIEW_LOCALE_LOCK) {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("lang") !== REVIEW_LOCALE_LOCK) {
        url.searchParams.set("lang", REVIEW_LOCALE_LOCK);
        window.history.replaceState({}, "", `${url.pathname}${url.search}`);
      }
    } catch {
      // Ignore malformed URLs in embedded runtimes.
    }
    return;
  }

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
  if (REVIEW_LOCALE_LOCK) return "cozyshelf.en.progress";
  if (locale === "en") return "cozyshelf.en.progress";
  if (locale === "cn") return "cozyshelf.cn.progress";
  return "cozyshelf.br.progress";
}

export function htmlLang(locale) {
  if (REVIEW_LOCALE_LOCK) return "en";
  if (locale === "en") return "en";
  if (locale === "cn") return "zh-CN";
  return "pt-BR";
}

export function switchLocaleHref(locale, search = typeof window !== "undefined" ? window.location.search : "") {
  if (REVIEW_LOCALE_LOCK) return "?lang=en";
  const params = new URLSearchParams(search || "");
  params.set("lang", supportedLocale(locale) || "pt");
  const query = params.toString();
  return query ? `?${query}` : "?lang=pt";
}
