import type { Product } from "../types.js";

/**
 * Demo colours are stored as human-readable variant options. Keeping the hex
 * map here means the storefront can show swatches without denormalising the
 * catalogue or requiring an extra lookup per card.
 */
export const COLOUR_HEX: Record<string, string> = {
  amber: "#b98557",
  bare: "#e6ddd0",
  black: "#25282a",
  bone: "#e8e0d2",
  butter: "#e2c98f",
  chalk: "#e7e4dc",
  charcoal: "#383c40",
  clay: "#b78268",
  denim: "#486583",
  ecru: "#ded6c6",
  fern: "#6e7d63",
  fig: "#6f4c5b",
  forest: "#3e5c4b",
  graphite: "#444a4f",
  indigo: "#3b4f74",
  ink: "#222a3a",
  ivory: "#f1eadb",
  natural: "#d8c5a5",
  navy: "#263451",
  oat: "#d6c5a8",
  olive: "#6d7654",
  pearl: "#ebe8e0",
  plum: "#6e5069",
  rose: "#c48798",
  rosewood: "#8b4f56",
  rust: "#a9684c",
  sage: "#9baa8d",
  sand: "#d6b992",
  sky: "#a9c2cf",
  slate: "#5f6c78",
  speckle: "#ddd7ca",
  stone: "#b9b2a4",
  tan: "#b98b5e",
  "washed black": "#4a4c4e",
  white: "#f4f1ea",
};

export function productColours(product: Product): { name: string; hex: string }[] {
  const seen = new Set<string>();
  const colours: { name: string; hex: string }[] = [];
  for (const variant of product.variants) {
    const name = variant.options.colour?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const hex = COLOUR_HEX[key];
    if (!hex || seen.has(key)) continue;
    seen.add(key);
    colours.push({ name, hex });
  }
  return colours;
}
