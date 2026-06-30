import { en } from "./locales/en";
import { he } from "./locales/he";
import { ru } from "./locales/ru";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, FaqItem, Locale } from "./types";

export const locales: Locale[] = ["en", "ru", "he"];

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  he: "עב",
};

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
  he,
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}
