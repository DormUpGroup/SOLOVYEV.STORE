export const CLOTHING_TYPES = [
  "pants",
  "shorts",
  "tshirts",
  "sweaters",
  "jackets",
] as const;

export type ClothingType = (typeof CLOTHING_TYPES)[number];

export function isClothingType(value: string | null | undefined): value is ClothingType {
  return CLOTHING_TYPES.includes(value as ClothingType);
}

export function parseClothingType(param: string | null | undefined): "" | ClothingType {
  return isClothingType(param) ? param : "";
}

export function validateClothingType(
  value: string | null | undefined,
): value is ClothingType | null | undefined {
  return value == null || value === "" || isClothingType(value);
}

/** Guess subtype from title/caption. Polo and longsleeves → tshirts; waffle and fleece → sweaters. */
export function inferClothingType(
  title: string,
  description = "",
): ClothingType | undefined {
  const text = `${title} ${description}`.toLowerCase();

  if (/\b(jacket|parka|shell)\b/.test(text)) return "jackets";
  if (/\bshorts\b/.test(text)) return "shorts";
  if (/\b(hoodie|crewneck|sweatshirt|fleece|waffle)\b/.test(text)) return "sweaters";
  if (/\b(pants|jeans)\b/.test(text)) return "pants";
  if (
    /t-?\s*shirt/.test(text) ||
    /\b(tee|polo|shirt|long\s*sleeve)\b/.test(text)
  ) {
    return "tshirts";
  }

  return undefined;
}
