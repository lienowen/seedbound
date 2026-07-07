import { CAMPAIGN_I18N } from "./campaign.js";
import { ITEM_NAMES, REASONS, UI } from "./ui.js";

export function createI18n(locale) {
  const lang = UI[locale] ? locale : "en";
  const ui = UI[lang];
  const reasons = REASONS[lang];
  const itemNames = ITEM_NAMES[lang];

  return {
    locale: lang,
    ui,
    tReason(key, fallback = "") {
      if (!key) return fallback;
      // Never leak internal reject keys into the player-facing toast. Some engine
      // paths pass the raw key as `fallback`, so prefer the localized generic copy
      // whenever a specific reject reason has not been authored yet.
      if (key.startsWith("reject.")) return reasons[key] || reasons["reject.generic"] || fallback;
      return reasons[key] || fallback || key;
    },
    tItem(nameKey, fallback = "") {
      return itemNames[nameKey] || fallback || nameKey;
    },
    tZone(zoneKey, fallback = "") {
      if (!zoneKey) return fallback;
      const titleKey = `zone${zoneKey.slice(0, 1).toUpperCase()}${zoneKey.slice(1)}Title`;
      return ui[titleKey] || fallback || zoneKey;
    },
  };
}

export function localizeLevel(level, locale) {
  if (!level) return level;
  const isPacking = level.winMode === "packing";
  // pt copy is authored inline; only skip localization for non-packing pt levels.
  if (locale === "pt" && !isPacking) return level;
  const overlay = CAMPAIGN_I18N[locale]?.[level.id];
  const i18n = createI18n(locale);
  const localized = structuredClone(level);
  // Packing levels use packing-flavored success copy instead of the fridge copy.
  const successTag = isPacking ? i18n.ui.packSuccessTag : i18n.ui.successTag;
  const successBody = isPacking ? i18n.ui.packSuccessBody : i18n.ui.successBody;

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
      successTag,
      successTitle: i18n.ui.successTitle,
      successBody,
      nextLabel: i18n.ui.nextLabel,
      retryLabel: i18n.ui.retryLabel,
    };
  } else {
    localized.copy = {
      ...localized.copy,
      successTag,
      successTitle: i18n.ui.successTitle,
      successBody,
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
