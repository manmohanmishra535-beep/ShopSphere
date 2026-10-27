import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "web/public");
const products = [
  "floral-wrap-dress",
  "linen-shirt",
  "denim-jacket",
  "canvas-tote",
  "wool-scarf",
  "everyday-sneakers",
  "leather-watch",
  "studio-headphones",
  "paper-table-lamp",
  "ceramic-mug",
  "soy-candle",
  "vitamin-c-serum",
  "silk-pillowcase",
  "cashmere-cardigan",
  "chino-trousers",
  "graphic-tee",
  "kids-hoodie",
  "running-shorts",
  "yoga-leggings",
  "straw-hat",
  "marble-board",
  "bluetooth-speaker",
  "tinted-lip-balm",
  "canvas-backpack",
];
const categories = ["women", "men", "home", "electronics", "beauty", "kids", "sale"];

const palettes = [
  { a: "#1E2A4A", b: "#0B1020", c: "#E8B4A0", d: "#F4D9C6", ink: "#F1F5F9" },
  { a: "#3B2F2F", b: "#171412", c: "#D9C3A5", d: "#EFE3D2", ink: "#F8F3EA" },
  { a: "#243B36", b: "#0D1F1B", c: "#B9C6A4", d: "#E4E8D6", ink: "#F2F5EA" },
  { a: "#4A2B3A", b: "#1E0F18", c: "#E3A6B8", d: "#F6DCE4", ink: "#FFF1F5" },
  { a: "#2C3550", b: "#11162A", c: "#9EB4E8", d: "#DCE5FA", ink: "#EFF4FF" },
  { a: "#4A3524", b: "#21160D", c: "#E0B47C", d: "#F3DFC0", ink: "#FFF6E8" },
  { a: "#7A2E2E", b: "#2A0F0F", c: "#E9A08C", d: "#F6D5C9", ink: "#FFF1EC" },
  { a: "#2F3A3F", b: "#101719", c: "#A8C7C9", d: "#DBEAEA", ink: "#EDF7F7" },
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function art({ seed, width = 800, height = 1000, label = "SHOPSPHERE", palette, variant = 0 }) {
  const rand = rng(seed);
  const p = palette ?? palettes[seed % palettes.length];
  const cx = width * (0.35 + rand() * 0.3);
  const cy = height * (0.3 + rand() * 0.25);
  const r = Math.min(width, height) * (0.32 + rand() * 0.14);
  const tilt = -25 + rand() * 50;
  const blob2x = width * (0.15 + rand() * 0.7);
  const blob2y = height * (0.55 + rand() * 0.3);
  const r2 = Math.min(width, height) * (0.2 + rand() * 0.16);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.c}"/><stop offset="1" stop-color="${p.d}"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="20%" r="80%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.16"/></feComponentTransfer>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="28"/></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g filter="url(#soft)" opacity="0.5">
    <circle cx="${width * 0.78}" cy="${height * 0.16}" r="${r * 0.7}" fill="${p.d}" opacity="0.35"/>
  </g>
  <g transform="rotate(${tilt} ${cx} ${cy})">
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.82}" ry="${r * 1.08}" fill="url(#accent)" opacity="${0.9 - variant * 0.08}"/>
    <ellipse cx="${cx + r * 0.16}" cy="${cy - r * 0.1}" rx="${r * 0.5}" ry="${r * 0.78}" fill="${p.b}" opacity="0.22"/>
    <path d="M ${cx - r} ${cy + r * 0.8} C ${cx - r * 0.3} ${cy + r * 1.25}, ${cx + r * 0.5} ${cy + r * 0.55}, ${cx + r} ${cy + r * 0.9}" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="1.5" fill="none"/>
  </g>
  <circle cx="${blob2x}" cy="${blob2y}" r="${r2}" fill="none" stroke="${p.ink}" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="${blob2x}" cy="${blob2y}" r="${r2 * 0.62}" fill="${p.ink}" opacity="0.08"/>
  <g stroke="${p.ink}" stroke-opacity="0.22" stroke-width="1">
    <line x1="${width * 0.08}" y1="${height * 0.86}" x2="${width * 0.92}" y2="${height * 0.86}"/>
    <line x1="${width * 0.08}" y1="${height * 0.06}" x2="${width * 0.08}" y2="${height * 0.16}"/>
  </g>
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.5"/>
</svg>`;
}

fs.mkdirSync(path.join(root, "products"), { recursive: true });
fs.mkdirSync(path.join(root, "categories"), { recursive: true });
fs.mkdirSync(path.join(root, "art"), { recursive: true });

for (const slug of products) {
  const seed = hash(slug);
  for (let i = 1; i <= 3; i++) {
    const p = palettes[(seed + i) % palettes.length];
    fs.writeFileSync(
      path.join(root, "products", `${slug}-${i}.svg`),
      art({ seed: seed + i * 97, palette: p, variant: i - 1, label: slug.replace(/-/g, " ").toUpperCase() })
    );
  }
}

for (const slug of categories) {
  const seed = hash("cat-" + slug);
  fs.writeFileSync(
    path.join(root, "categories", `${slug}.svg`),
    art({ seed, width: 640, height: 760, palette: palettes[seed % palettes.length], label: slug.toUpperCase() })
  );
}

fs.writeFileSync(
  path.join(root, "art", "hero.svg"),
  art({ seed: hash("hero-autumn"), width: 1000, height: 1200, variant: 0, palette: palettes[0], label: "THE AUTUMN EDIT" })
);
fs.writeFileSync(
  path.join(root, "art", "editorial.svg"),
  art({ seed: hash("editorial-craft"), width: 1200, height: 900, variant: 1, palette: palettes[2], label: "MADE TO LAST" })
);
fs.writeFileSync(
  path.join(root, "art", "story.svg"),
  art({ seed: hash("story-studio"), width: 900, height: 1100, variant: 2, palette: palettes[5], label: "THE STUDIO" })
);

console.log(`Generated art for ${products.length} products and ${categories.length} categories.`);
