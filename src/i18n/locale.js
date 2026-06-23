export const LOCALES = ["pt", "en", "cn"];
export const LOCALE_PREF_KEY = "seedbound.locale";

export function parseLocale(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "en";
  if (seg === "cn") return "cn";
  return "pt";
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

/** Redirect `/` to `/en` or `/cn` when browser or saved preference differs from default pt. */
export function redirectToLocaleIfNeeded() {
  if (typeof window === "undefined") return;

  const { pathname, search, hash } = window.location;
  const pathSeg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();

  if (pathSeg === "en" || pathSeg === "cn") {
    writeLocalePreference(pathSeg);
    return;
  }

  const preferred = readLocalePreference() || detectBrowserLocale();
  writeLocalePreference(preferred);
  const targetPath = localePath(preferred);
  if (targetPath !== pathname) {
    window.location.replace(`${targetPath}${search}${hash}`);
  }
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
  return `${localePath(locale)}${search || ""}`;
}
