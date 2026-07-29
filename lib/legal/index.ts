import type { Locale } from "@/lib/i18n/types";
import { en } from "./en";
import { he } from "./he";
import { ru } from "./ru";
import type { LegalBundle } from "./types";

export type { LegalBundle, LegalDocument, LegalSection } from "./types";

const bundles: Record<Locale, LegalBundle> = {
  en,
  ru,
  he,
};

export function getLegalBundle(locale: Locale): LegalBundle {
  return bundles[locale] ?? bundles.en;
}
