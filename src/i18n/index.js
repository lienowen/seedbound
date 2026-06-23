import { CAMPAIGN_I18N } from "./campaign.js";
import { ITEM_NAMES, REASONS, UI } from "./ui.js";

export function createI18n(locale) {
  const lang = UI[locale] ? locale : "pt";
  const ui = UI[lang];
  const reasons = REASONS[lang];
  const itemNames = ITEM_NAMES[lang];

  return {
    locale: lang,
    ui,
    tReason(key, fallback = "") {
      if (!key) return fallback;
      if (key.startsWith("reject.")) return reasons[key] || fallback || reasons["reject.generic"];
      return reasons[key] || fallback || key;
    },
    tItem(nameKey, fallback = "") {
      return itemNames[nameKey] || fallback || nameKey;
    },
  };
}

export function localizeLevel(level, locale) {
  if (!level || locale === "pt") return level;
  const overlay = CAMPAIGN_I18N[locale]?.[level.id];
  const i18n = createI18n(locale);
  const localized = structuredClone(level);

  if (overlay) {
    localized.theme = {
      ...localized.theme,
      title: overlay.title ?? localized.theme.title,
      subtitle: overlay.subtitle ?? localized.theme.subtitle,
    };
    localized.copy = {
      ...localized.copy,
      intro: overlay.intro ?? localized.copy?.intro,
      goal: overlay.goal ?? localized.copy?.goal,
      difficulty: overlay.difficulty ?? localized.copy?.difficulty,
      successTag: i18n.ui.successTag,
      successTitle: i18n.ui.successTitle,
      successBody: i18n.ui.successBody,
      nextLabel: i18n.ui.nextLabel,
      retryLabel: i18n.ui.retryLabel,
    };
  } else {
    localized.copy = {
      ...localized.copy,
      successTag: i18n.ui.successTag,
      successTitle: i18n.ui.successTitle,
      successBody: i18n.ui.successBody,
      nextLabel: i18n.ui.nextLabel,
      retryLabel: i18n.ui.retryLabel,
    };
  }

  localized.items = localized.items.map((item) => ({
    ...item,
    name: i18n.tItem(item.image, item.name),
  }));

  return localized;
}

export function localizeCampaign(campaign, locale) {
  return campaign.map((level) => localizeLevel(level, locale));
}
