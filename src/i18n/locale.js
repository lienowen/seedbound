export const LOCALES = ["pt", "en", "cn"];

export function parseLocale(pathname = typeof window !== "undefined" ? window.location.pathname : "/") {
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "en";
  if (seg === "cn") return "cn";
  return "pt";
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
