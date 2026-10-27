import fs from "node:fs";
import path from "node:path";

/*
 * ShopSphere demo art.
 *
 * These are deliberately product-shaped rather than abstract: the storefront
 * uses them as real product imagery, so a dress should read as a dress at
 * 160px wide in a four-up grid. Everything is generated, local and theme
 * independent, which keeps the demo zero-config and deterministic.
 */

const root = path.resolve(process.cwd(), "web/public");

const products = {
  "floral-wrap-dress": {
    colors: ["#263451", "#c48798", "#6d7c5c"],
    accent: "#d5a0ad",
    type: "dress",
  },
  "linen-shirt": {
    colors: ["#d7c3a1", "#9db9c3", "#98a581"],
    accent: "#c0ad8e",
    type: "shirt",
  },
  "denim-jacket": {
    colors: ["#365274", "#8ba2ba", "#d9d2c2"],
    accent: "#8ca3bd",
    type: "jacket",
  },
  "canvas-tote": {
    colors: ["#d8c5a5", "#5c6650", "#2f3433"],
    accent: "#b7a284",
    type: "tote",
  },
  "wool-scarf": {
    colors: ["#bc9261", "#4b4d50", "#a76b52"],
    accent: "#c7a47a",
    type: "scarf",
  },
  "everyday-sneakers": {
    colors: ["#e9e4d9", "#30343a", "#9aab93"],
    accent: "#c9bda9",
    type: "sneakers",
  },
  "leather-watch": {
    colors: ["#9a6c46", "#292d31", "#bd9c75"],
    accent: "#b98b5e",
    type: "watch",
  },
  "studio-headphones": {
    colors: ["#2f3338", "#ddd6c7", "#2f4b5b"],
    accent: "#a99b86",
    type: "headphones",
  },
  "paper-table-lamp": {
    colors: ["#f0e1c4", "#cf9d7c", "#3c4143"],
    accent: "#e0be92",
    type: "lamp",
  },
  "ceramic-mug": {
    colors: ["#ddd4c1", "#8b9a82", "#374244"],
    accent: "#b8af9c",
    type: "mug",
  },
  "soy-candle": {
    colors: ["#b98557", "#e6decb", "#5c6b54"],
    accent: "#c79d6d",
    type: "candle",
  },
  "vitamin-c-serum": {
    colors: ["#d3a15e", "#e8e4d7", "#4e7c72"],
    accent: "#d6ae74",
    type: "serum",
  },
  "silk-pillowcase": {
    colors: ["#e6ddd0", "#cda4a2", "#a6b1a2"],
    accent: "#c6b8a7",
    type: "pillow",
  },
  "cashmere-cardigan": {
    colors: ["#d8c9b3", "#b28c65", "#7e8785"],
    accent: "#bbaa91",
    type: "cardigan",
  },
  "chino-trousers": {
    colors: ["#b9a27b", "#3c4a5b", "#73785f"],
    accent: "#a8936f",
    type: "trousers",
  },
  "graphic-tee": {
    colors: ["#e7e2d7", "#2e3232", "#c6b494"],
    accent: "#bdae95",
    type: "tee",
  },
  "kids-hoodie": {
    colors: ["#c59a56", "#85a5b5", "#c98573"],
    accent: "#c2a778",
    type: "hoodie",
  },
  "running-shorts": {
    colors: ["#333c43", "#43586b", "#9e5b51"],
    accent: "#728492",
    type: "shorts",
  },
  "yoga-leggings": {
    colors: ["#2e3234", "#665069", "#426354"],
    accent: "#7b7a74",
    type: "leggings",
  },
  "straw-hat": {
    colors: ["#d6bb8b", "#c2a572", "#a47d52"],
    accent: "#c5a87c",
    type: "hat",
  },
  "marble-board": {
    colors: ["#e7e1d6", "#cbbfb1", "#4a4642"],
    accent: "#c7beb2",
    type: "board",
  },
  "bluetooth-speaker": {
    colors: ["#40464a", "#d1c3aa", "#3c5a50"],
    accent: "#8c918f",
    type: "speaker",
  },
  "tinted-lip-balm": {
    colors: ["#b77476", "#a5654f", "#8e4f60"],
    accent: "#c58e8d",
    type: "lipbalm",
  },
  "canvas-backpack": {
    colors: ["#68705a", "#303537", "#b1936d"],
    accent: "#8e927d",
    type: "backpack",
  },
};

const scenes = [
  { top: "#f5f1e9", bottom: "#e7dfd2", ink: "#2f2a24", line: "#cfc3b1" },
  { top: "#eef1ee", bottom: "#dde4de", ink: "#29312b", line: "#c5cec5" },
  { top: "#f5eeeb", bottom: "#e8dad4", ink: "#312723", line: "#d0bcb4" },
];

const categories = {
  women: { product: "floral-wrap-dress", variant: 1 },
  men: { product: "linen-shirt", variant: 0 },
  home: { product: "paper-table-lamp", variant: 0 },
  electronics: { product: "studio-headphones", variant: 1 },
  beauty: { product: "vitamin-c-serum", variant: 0 },
  kids: { product: "kids-hoodie", variant: 1 },
  sale: { product: "canvas-tote", variant: 0 },
};

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
}
function rgbToHex(rgb) {
  return "#" + rgb.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, amount) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((n, i) => n + (cb[i] - n) * amount));
}
const lighten = (color, amount) => mix(color, "#ffffff", amount);
const darken = (color, amount) => mix(color, "#000000", amount);

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

function paint(color, extra = {}) {
  const top = lighten(color, 0.16);
  const bottom = darken(color, 0.18);
  return {
    base: color,
    top,
    bottom,
    shade: darken(color, 0.27),
    deep: darken(color, 0.46),
    light: lighten(color, 0.34),
    pale: lighten(color, 0.68),
    ...extra,
  };
}

function svgScene({ width = 800, height = 1000, scene, tint, body, seed = 1, content, extraDefs = "" }) {
  const rand = rng(seed);
  const softTint = mix(tint, "#ffffff", 0.62);
  const archWidth = width * 0.66;
  const archLeft = (width - archWidth) / 2;
  const floor = height * 0.845;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${scene.top}"/>
      <stop offset="1" stop-color="${scene.bottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="32%" cy="18%" r="78%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${body.top}"/>
      <stop offset="0.55" stop-color="${body.base}"/>
      <stop offset="1" stop-color="${body.bottom}"/>
    </linearGradient>
    <linearGradient id="bodySoft" x1="0" y1="0" x2="1" y2="0.7">
      <stop offset="0" stop-color="${body.light}"/>
      <stop offset="1" stop-color="${body.base}"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f3eee2"/>
      <stop offset="0.35" stop-color="#cdbfa6"/>
      <stop offset="0.62" stop-color="#f8f3e8"/>
      <stop offset="1" stop-color="#9d8b70"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.11"/></feComponentTransfer>
    </filter>
    <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
    ${extraDefs}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <circle cx="${width * (0.8 + rand() * 0.1)}" cy="${height * 0.11}" r="${width * 0.18}" fill="${softTint}" opacity="0.55"/>
  <path d="M ${archLeft} ${floor} L ${archLeft} ${height * 0.34} C ${archLeft} ${height * 0.16} ${archLeft + archWidth} ${height * 0.16} ${archLeft + archWidth} ${height * 0.34} L ${archLeft + archWidth} ${floor} Z" fill="${softTint}" opacity="0.58"/>
  <path d="M ${archLeft + 1} ${floor} L ${archLeft + 1} ${height * 0.34} C ${archLeft + 1} ${height * 0.16} ${archLeft + archWidth - 1} ${height * 0.16} ${archLeft + archWidth - 1} ${height * 0.34} L ${archLeft + archWidth - 1} ${floor}" fill="none" stroke="${scene.line}" stroke-width="1.5" opacity="0.8"/>
  <line x1="${width * 0.1}" y1="${floor}" x2="${width * 0.9}" y2="${floor}" stroke="${scene.line}" stroke-width="1.5" opacity="0.9"/>
  <ellipse cx="${width * 0.5}" cy="${floor + 8}" rx="${width * 0.25}" ry="${height * 0.022}" fill="${scene.ink}" opacity="0.14" filter="url(#blur)"/>
  <g transform="translate(${width * 0.5} ${height * 0.5}) scale(${width / 800} ${height / 1000}) translate(-400 -500)">
    ${content}
  </g>
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.72"/>
</svg>`;
}

function dress(p) {
  const bodyPath =
    "M332 268 C348 244 366 240 382 258 C390 268 410 268 418 258 C434 240 452 244 468 268 L522 304 L504 376 L466 360 L494 754 C430 778 370 778 306 754 L334 360 L296 376 L278 304 Z";
  return `<defs>
    <clipPath id="dressClip"><path d="${bodyPath}"/></clipPath>
    <pattern id="floral" width="58" height="58" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
      <g fill="${p.light}" opacity="0.78">
        <circle cx="16" cy="16" r="3.2"/><circle cx="10" cy="21" r="2.5"/><circle cx="20" cy="23" r="2.4"/>
        <circle cx="42" cy="42" r="2.6"/><circle cx="37" cy="47" r="2"/><circle cx="47" cy="48" r="2.2"/>
      </g>
      <path d="M24 25 C31 17 39 20 40 27 C33 34 26 32 24 25Z" fill="${p.pale}" opacity="0.5"/>
      <path d="M5 39 C12 33 19 37 19 44 C12 50 6 47 5 39Z" fill="${p.pale}" opacity="0.4"/>
    </pattern>
  </defs>
  <g>
    <path d="${bodyPath}" fill="url(#body)"/>
    <g clip-path="url(#dressClip)"><rect x="260" y="230" width="300" height="570" fill="url(#floral)"/></g>
    <path d="M382 258 L400 326 L418 258 C410 270 390 270 382 258Z" fill="${p.deep}" opacity="0.82"/>
    <path d="M400 326 C368 354 341 386 323 438 C371 451 430 447 476 429 C452 384 429 352 400 326Z" fill="${p.light}" opacity="0.35"/>
    <path d="M335 430 C380 447 425 446 469 429" fill="none" stroke="${p.shade}" stroke-width="4" opacity="0.72"/>
    <path d="M383 438 C361 455 344 474 338 499 C362 492 381 481 393 465Z" fill="${p.shade}" opacity="0.58"/>
    <path d="M429 436 C450 449 461 463 467 486 C447 481 431 471 420 459Z" fill="${p.pale}" opacity="0.6"/>
    <path d="M348 566 C376 574 397 580 414 597" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.3"/>
    <path d="M452 603 C434 616 417 625 398 628" fill="none" stroke="${p.deep}" stroke-width="2.5" opacity="0.22"/>
    <path d="M330 708 C362 719 438 720 470 709" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.26"/>
    <path d="M305 754 C370 778 430 778 494 754" fill="none" stroke="${p.deep}" stroke-width="3" opacity="0.2"/>
    <path d="M334 360 L355 690 M466 360 L445 690" fill="none" stroke="${p.deep}" stroke-width="2" opacity="0.1"/>
  </g>`;
}

function shirt(p) {
  const bodyPath =
    "M310 272 L360 246 L387 274 L400 290 L413 274 L440 246 L490 272 L532 334 L506 374 L470 347 L486 740 L400 758 L314 740 L330 347 L294 374 L268 334 Z";
  return `<defs>
    <pattern id="linen" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M0 9 L9 0" stroke="${p.light}" stroke-width="0.7" opacity="0.28"/>
      <path d="M0 0 L9 9" stroke="${p.shade}" stroke-width="0.5" opacity="0.12"/>
    </pattern>
    <clipPath id="shirtClip"><path d="${bodyPath}"/></clipPath>
  </defs>
  <g>
    <path d="${bodyPath}" fill="url(#body)"/>
    <g clip-path="url(#shirtClip)"><rect x="260" y="230" width="290" height="540" fill="url(#linen)"/></g>
    <path d="M360 246 L387 274 L400 290 L372 307 L350 268Z" fill="${p.light}"/>
    <path d="M440 246 L413 274 L400 290 L428 307 L450 268Z" fill="${p.pale}"/>
    <path d="M400 290 L400 748" stroke="${p.shade}" stroke-width="3" opacity="0.5"/>
    <path d="M382 300 L382 740" stroke="${p.light}" stroke-width="1.5" opacity="0.5"/>
    ${[358, 414, 470, 526, 582, 638, 694].map((y) => `<circle cx="400" cy="${y}" r="4.1" fill="${p.pale}" stroke="${p.shade}" stroke-width="1.3"/>`).join("")}
    <path d="M424 392 L468 392 L468 452 L424 452Z" fill="none" stroke="${p.shade}" stroke-width="1.7" opacity="0.55"/>
    <path d="M330 347 L306 360 M470 347 L494 360" stroke="${p.shade}" stroke-width="2" opacity="0.35"/>
    <path d="M314 740 L330 347 M486 740 L470 347" stroke="${p.deep}" stroke-width="2" opacity="0.14"/>
    <path d="M352 432 C365 440 373 457 375 476" fill="none" stroke="${p.deep}" stroke-width="2" opacity="0.14"/>
    <path d="M444 510 C435 534 432 566 437 598" fill="none" stroke="${p.light}" stroke-width="2.2" opacity="0.3"/>
    <path d="M322 720 C350 731 450 731 478 720" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.3"/>
  </g>`;
}

function jacket(p) {
  const bodyPath =
    "M306 276 L356 248 L400 300 L444 248 L494 276 L542 338 L512 386 L478 356 L494 734 L400 754 L306 734 L322 356 L288 386 L258 338 Z";
  return `<defs>
    <pattern id="denim" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
      <path d="M0 0 L0 7" stroke="${p.light}" stroke-width="1.2" opacity="0.2"/>
      <path d="M3 0 L3 7" stroke="${p.deep}" stroke-width="0.6" opacity="0.12"/>
    </pattern>
    <clipPath id="jacketClip"><path d="${bodyPath}"/></clipPath>
  </defs>
  <g>
    <path d="${bodyPath}" fill="url(#body)"/>
    <g clip-path="url(#jacketClip)"><rect x="250" y="230" width="310" height="540" fill="url(#denim)"/></g>
    <path d="M356 248 L400 300 L378 320 L338 274Z" fill="${p.light}"/>
    <path d="M444 248 L400 300 L422 320 L462 274Z" fill="${p.pale}"/>
    <path d="M400 300 L400 754" stroke="${p.deep}" stroke-width="2.4" opacity="0.5"/>
    <path d="M382 300 L382 738 M418 300 L418 738" stroke="${p.light}" stroke-width="1.3" opacity="0.32"/>
    <path d="M382 376 C392 389 392 406 386 419 M418 376 C408 389 408 406 414 419" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.4"/>
    <path d="M326 418 L372 426 L366 473 L320 463Z" fill="none" stroke="${p.deep}" stroke-width="2" opacity="0.45"/>
    <path d="M428 426 L474 418 L480 463 L434 473Z" fill="none" stroke="${p.deep}" stroke-width="2" opacity="0.45"/>
    <path d="M322 356 L306 734 M478 356 L494 734" stroke="${p.deep}" stroke-width="2" opacity="0.16"/>
    ${[470, 530, 590, 650].map((y) => `<circle cx="400" cy="${y}" r="5" fill="${p.pale}" stroke="${p.shade}" stroke-width="1.4"/>`).join("")}
    <path d="M376 690 L424 690" stroke="${p.deep}" stroke-width="9" opacity="0.35"/>
    <path d="M350 510 C360 520 365 536 365 553 M450 600 C442 618 439 638 442 654" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.24"/>
    <path d="M320 720 C352 736 448 736 480 720" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.22"/>
  </g>`;
}

function cardigan(p) {
  const bodyPath =
    "M312 278 L360 252 L400 312 L440 252 L488 278 L530 340 L504 382 L472 354 L486 736 L400 752 L314 736 L328 354 L296 382 L270 340 Z";
  return `<defs>
    <pattern id="knit" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 10 C3 6 9 6 12 10" fill="none" stroke="${p.light}" stroke-width="1.1" opacity="0.28"/>
      <path d="M0 3 L12 3" stroke="${p.deep}" stroke-width="0.5" opacity="0.1"/>
    </pattern>
    <clipPath id="cardiganClip"><path d="${bodyPath}"/></clipPath>
  </defs>
  <g>
    <path d="${bodyPath}" fill="url(#body)"/>
    <g clip-path="url(#cardiganClip)"><rect x="260" y="240" width="280" height="530" fill="url(#knit)"/></g>
    <path d="M360 252 L400 312 L372 330 L338 280Z" fill="${p.light}"/>
    <path d="M440 252 L400 312 L428 330 L462 280Z" fill="${p.pale}"/>
    <path d="M400 312 L400 750" stroke="${p.shade}" stroke-width="3" opacity="0.5"/>
    <path d="M378 318 L378 736 M422 318 L422 736" stroke="${p.light}" stroke-width="3" opacity="0.5"/>
    ${[372, 430, 488, 546, 604, 662].map((y) => `<circle cx="400" cy="${y}" r="5" fill="${p.pale}" stroke="${p.shade}" stroke-width="1.4"/>`).join("")}
    <path d="M314 736 L328 354 M486 736 L472 354" stroke="${p.deep}" stroke-width="2.5" opacity="0.18"/>
    <path d="M328 354 L304 369 M472 354 L496 369" stroke="${p.light}" stroke-width="2" opacity="0.35"/>
    <path d="M344 410 C356 422 362 439 362 459 M454 520 C444 542 441 565 446 585" fill="none" stroke="${p.light}" stroke-width="2.2" opacity="0.34"/>
    <path d="M310 724 C350 741 450 741 490 724" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.25"/>
  </g>`;
}

function tee(p) {
  return `<g>
    <path d="M314 294 L364 270 C377 284 387 292 400 292 C413 292 423 284 436 270 L486 294 L522 354 L490 392 L462 366 L472 704 L328 704 L338 366 L310 392 L278 354 Z" fill="url(#body)"/>
    <path d="M364 270 C375 288 386 298 400 298 C414 298 425 288 436 270 L422 264 C416 277 408 283 400 283 C392 283 384 277 378 264Z" fill="${p.shade}" opacity="0.8"/>
    <path d="M400 318 L400 694" stroke="${p.light}" stroke-width="1.4" opacity="0.18"/>
    <path d="M338 366 L329 692 M462 366 L471 692" stroke="${p.deep}" stroke-width="2" opacity="0.12"/>
    <g fill="none" stroke="${p.shade}" stroke-width="3" opacity="0.45">
      <circle cx="400" cy="480" r="42"/>
      <path d="M400 438 L400 522 M358 480 L442 480"/>
      <path d="M372 452 L428 508 M428 452 L372 508" opacity="0.35"/>
    </g>
    <path d="M352 676 C376 684 424 684 448 676" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.28"/>
    <path d="M470 330 C480 344 485 360 485 379" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.2"/>
  </g>`;
}

function hoodie(p, scale = 1) {
  return `<g transform="translate(400 500) scale(${scale}) translate(-400 -500)">
    <path d="M356 294 C358 236 442 236 444 294 C446 345 428 376 400 376 C372 376 354 345 356 294Z" fill="${p.shade}"/>
    <path d="M366 300 C370 260 430 260 434 300 C435 332 423 350 400 350 C377 350 365 332 366 300Z" fill="${p.deep}" opacity="0.45"/>
    <path d="M310 324 L362 294 C376 326 424 326 438 294 L490 324 L528 390 L496 426 L468 400 L480 712 L320 712 L332 400 L304 426 L272 390Z" fill="url(#body)"/>
    <path d="M362 294 C369 322 382 338 400 338 C418 338 431 322 438 294" fill="none" stroke="${p.light}" stroke-width="4" opacity="0.55"/>
    <path d="M386 340 L387 446 M414 340 L413 446" stroke="${p.pale}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="386" cy="450" r="5" fill="${p.pale}"/><circle cx="414" cy="450" r="5" fill="${p.pale}"/>
    <path d="M340 548 L340 634 C340 648 352 656 368 656 L432 656 C448 656 460 648 460 634 L460 548 C440 563 360 563 340 548Z" fill="${p.shade}" opacity="0.45"/>
    <path d="M340 548 C360 563 440 563 460 548" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.42"/>
    <path d="M332 400 L320 700 M468 400 L480 700" stroke="${p.deep}" stroke-width="2" opacity="0.14"/>
    <path d="M320 694 C358 712 442 712 480 694" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.28"/>
  </g>`;
}

function trousers(p) {
  return `<g>
    <path d="M302 306 L498 306 L508 364 L492 780 L420 784 L401 500 L380 784 L308 780 L292 364 Z" fill="url(#body)"/>
    <path d="M302 306 L498 306 L496 348 L304 348Z" fill="${p.shade}" opacity="0.35"/>
    <path d="M400 350 L400 484" stroke="${p.light}" stroke-width="1.6" opacity="0.35"/>
    <path d="M380 784 L390 500 M420 784 L410 500" stroke="${p.deep}" stroke-width="2.4" opacity="0.2"/>
    <path d="M322 370 L336 430" stroke="${p.deep}" stroke-width="2" opacity="0.32"/>
    <path d="M478 370 L464 430" stroke="${p.deep}" stroke-width="2" opacity="0.32"/>
    <circle cx="400" cy="327" r="4" fill="${p.pale}" stroke="${p.shade}" stroke-width="1.2"/>
    <path d="M292 364 L314 364 M486 364 L508 364" stroke="${p.deep}" stroke-width="4" opacity="0.4"/>
    <path d="M365 545 C376 580 378 618 374 656 M435 545 C424 580 422 618 426 656" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.22"/>
  </g>`;
}

function shorts(p) {
  return `<g>
    <path d="M302 310 L498 310 L510 374 L500 584 L420 588 L401 480 L380 588 L300 584 L290 374 Z" fill="url(#body)"/>
    <path d="M302 310 L498 310 L496 350 L304 350Z" fill="${p.shade}" opacity="0.32"/>
    <path d="M400 350 L400 466" stroke="${p.light}" stroke-width="1.5" opacity="0.32"/>
    <path d="M380 588 L390 480 M420 588 L410 480" stroke="${p.deep}" stroke-width="2.2" opacity="0.2"/>
    <path d="M316 372 L328 424 M484 372 L472 424" stroke="${p.deep}" stroke-width="2" opacity="0.3"/>
    <path d="M342 564 C362 575 438 575 458 564" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.28"/>
    <circle cx="400" cy="329" r="4" fill="${p.pale}" stroke="${p.shade}" stroke-width="1.2"/>
  </g>`;
}

function leggings(p) {
  return `<g>
    <path d="M320 278 L480 278 L492 356 L474 786 L417 788 L401 508 L383 788 L326 786 L308 356 Z" fill="url(#body)"/>
    <path d="M320 278 L480 278 L477 334 L323 334Z" fill="${p.shade}" opacity="0.42"/>
    <path d="M400 334 L400 490" stroke="${p.light}" stroke-width="1.4" opacity="0.26"/>
    <path d="M383 788 L391 508 M417 788 L409 508" stroke="${p.light}" stroke-width="2" opacity="0.2"/>
    <path d="M340 390 C351 440 354 492 352 542 M460 390 C449 440 446 492 448 542" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.14"/>
    <path d="M323 334 L352 334 M448 334 L477 334" stroke="${p.deep}" stroke-width="2.5" opacity="0.3"/>
  </g>`;
}

function scarf(p) {
  return `<g>
    <path d="M298 264 C382 212 500 264 490 354 C481 437 383 444 346 515 C310 584 350 682 430 720" fill="none" stroke="${p.deep}" stroke-width="105" stroke-linecap="round" opacity="0.22"/>
    <path d="M288 254 C374 200 492 252 482 344 C473 427 373 436 336 505 C300 574 340 670 420 708" fill="none" stroke="url(#body)" stroke-width="92" stroke-linecap="round"/>
    <path d="M306 264 C380 226 464 270 456 342 C448 411 362 420 328 490 C297 552 335 638 400 674" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.34"/>
    <path d="M320 255 C382 231 438 264 438 324" fill="none" stroke="${p.pale}" stroke-width="12" opacity="0.13"/>
    <g stroke="${p.deep}" stroke-width="4" stroke-linecap="round" opacity="0.5">
      <path d="M410 699 L401 754"/><path d="M420 703 L414 758"/><path d="M430 704 L427 759"/>
      <path d="M440 702 L443 757"/><path d="M450 698 L457 752"/>
    </g>
    <path d="M365 470 C390 480 415 478 436 466" fill="none" stroke="${p.pale}" stroke-width="17" opacity="0.12"/>
  </g>`;
}

function hat(p) {
  return `<g>
    <ellipse cx="400" cy="546" rx="247" ry="83" fill="${p.shade}" opacity="0.32"/>
    <ellipse cx="400" cy="532" rx="247" ry="83" fill="url(#body)"/>
    <path d="M300 454 C304 352 334 296 400 296 C466 296 496 352 500 454 L518 526 C470 500 330 500 282 526Z" fill="url(#bodySoft)"/>
    <ellipse cx="400" cy="454" rx="100" ry="26" fill="${p.shade}" opacity="0.3"/>
    <path d="M294 492 C336 516 464 516 506 492 L515 530 C468 504 332 504 285 530Z" fill="${p.deep}" opacity="0.58"/>
    <path d="M400 296 C360 296 332 342 320 430" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.28"/>
    <g stroke="${p.shade}" stroke-width="1.2" opacity="0.3">
      <path d="M192 528 C250 555 550 555 608 528"/>
      <path d="M206 556 C270 580 530 580 594 556"/>
      <path d="M246 584 C300 602 500 602 554 584"/>
    </g>
    <path d="M300 454 C348 474 452 474 500 454" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.25"/>
  </g>`;
}

function sneakers(p) {
  const shoe = `<g>
    <path d="M210 605 C251 585 286 543 322 507 C339 490 362 491 375 508 L407 552 C443 576 500 585 563 596 L608 608 C628 614 638 636 634 662 L620 695 C508 716 332 714 205 688 L195 658 C192 637 198 616 210 605Z" fill="url(#body)"/>
    <path d="M195 658 C320 704 505 710 634 684 L628 714 C502 745 322 740 198 703Z" fill="${p.pale}"/>
    <path d="M198 703 C330 737 510 739 628 714 L624 730 C506 753 322 749 198 720Z" fill="${p.shade}"/>
    <path d="M210 605 C248 590 278 560 305 528 C330 556 350 580 375 600 C335 624 272 634 210 634Z" fill="${p.light}" opacity="0.52"/>
    <path d="M361 498 C382 516 391 542 389 571" fill="none" stroke="${p.shade}" stroke-width="3" opacity="0.58"/>
    <g stroke="${p.deep}" stroke-width="4" stroke-linecap="round" opacity="0.62">
      <path d="M316 535 L360 550"/><path d="M330 519 L375 535"/><path d="M345 504 L390 521"/>
    </g>
    <path d="M424 560 C468 585 518 596 568 602" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.3"/>
    <path d="M560 603 C581 610 596 626 602 646" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.34"/>
    <circle cx="560" cy="628" r="4" fill="${p.deep}" opacity="0.4"/>
  </g>`;
  return `<g>
    <g transform="translate(58 -42) scale(0.88) rotate(4 400 620)" opacity="0.55">${shoe}</g>
    <g transform="rotate(-2 400 610)">${shoe}</g>
  </g>`;
}

function watch(p) {
  return `<g>
    <rect x="344" y="242" width="112" height="516" rx="54" fill="url(#body)"/>
    <path d="M360 302 L360 698 M440 302 L440 698" stroke="${p.pale}" stroke-width="1.5" stroke-dasharray="6 7" opacity="0.45"/>
    <rect x="360" y="700" width="80" height="42" rx="18" fill="${p.shade}"/>
    <circle cx="400" cy="500" r="132" fill="url(#metal)"/>
    <circle cx="400" cy="500" r="117" fill="${p.deep}"/>
    <circle cx="400" cy="500" r="108" fill="url(#bodySoft)" opacity="0.26"/>
    <g stroke="${p.pale}" stroke-width="3" opacity="0.66">
      <path d="M400 399 L400 412"/><path d="M400 588 L400 601"/><path d="M299 500 L312 500"/><path d="M488 500 L501 500"/>
      <path d="M329 429 L338 438"/><path d="M462 562 L471 571"/><path d="M471 429 L462 438"/><path d="M338 562 L329 571"/>
    </g>
    <path d="M400 500 L400 443" stroke="${p.pale}" stroke-width="5" stroke-linecap="round"/>
    <path d="M400 500 L441 526" stroke="${p.pale}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="400" cy="500" r="8" fill="${p.pale}"/>
    <rect x="514" y="480" width="14" height="42" rx="7" fill="${p.pale}"/>
    <path d="M331 270 C350 252 366 246 382 246" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.28"/>
  </g>`;
}

function headphones(p) {
  return `<g>
    <path d="M250 560 C250 298 550 298 550 560" fill="none" stroke="${p.deep}" stroke-width="62" stroke-linecap="round"/>
    <path d="M250 560 C250 298 550 298 550 560" fill="none" stroke="url(#body)" stroke-width="43" stroke-linecap="round"/>
    <path d="M286 520 C286 336 514 336 514 520" fill="none" stroke="${p.light}" stroke-width="4" opacity="0.22"/>
    <rect x="198" y="492" width="104" height="206" rx="48" fill="${p.deep}"/>
    <rect x="498" y="492" width="104" height="206" rx="48" fill="${p.deep}"/>
    <rect x="214" y="508" width="72" height="172" rx="36" fill="url(#body)"/>
    <rect x="514" y="508" width="72" height="172" rx="36" fill="url(#body)"/>
    <rect x="237" y="536" width="42" height="118" rx="21" fill="${p.shade}" opacity="0.55"/>
    <rect x="521" y="536" width="42" height="118" rx="21" fill="${p.shade}" opacity="0.55"/>
    <circle cx="251" cy="595" r="4" fill="${p.pale}" opacity="0.7"/>
    <path d="M326 392 C360 360 440 360 474 392" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.3"/>
  </g>`;
}

function lamp(p) {
  return `<g>
    <ellipse cx="400" cy="420" rx="230" ry="220" fill="${p.pale}" opacity="0.25" filter="url(#blur)"/>
    <path d="M335 194 C365 184 435 184 465 194 L562 466 C520 482 280 482 238 466Z" fill="${p.pale}" opacity="0.8"/>
    <path d="M335 194 C365 184 435 184 465 194 L562 466 C520 482 280 482 238 466Z" fill="url(#body)" opacity="0.55"/>
    <path d="M335 194 C365 184 435 184 465 194 L472 218 C426 232 374 232 328 218Z" fill="${p.shade}" opacity="0.38"/>
    <path d="M250 451 C332 474 468 474 550 451" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.34"/>
    <path d="M400 473 L400 730" stroke="${p.deep}" stroke-width="13"/>
    <path d="M400 473 L400 730" stroke="${p.light}" stroke-width="4" opacity="0.28"/>
    <ellipse cx="400" cy="741" rx="96" ry="24" fill="${p.deep}"/>
    <ellipse cx="400" cy="733" rx="96" ry="24" fill="url(#bodySoft)"/>
    <path d="M300 214 C332 236 365 246 400 247" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.4"/>
    <path d="M400 247 C435 246 468 236 500 214" fill="none" stroke="${p.pale}" stroke-width="1.5" opacity="0.4"/>
  </g>`;
}

function mug(p) {
  return `<g>
    <path d="M282 410 L518 410 L507 676 C505 718 478 740 440 740 L360 740 C322 740 295 718 293 676Z" fill="url(#body)"/>
    <ellipse cx="400" cy="411" rx="118" ry="32" fill="${p.light}"/>
    <ellipse cx="400" cy="413" rx="97" ry="23" fill="${p.deep}" opacity="0.55"/>
    <ellipse cx="400" cy="414" rx="79" ry="16" fill="${p.shade}" opacity="0.7"/>
    <path d="M514 474 C603 474 626 566 617 614 C607 666 566 685 507 680" fill="none" stroke="${p.deep}" stroke-width="42"/>
    <path d="M514 474 C603 474 626 566 617 614 C607 666 566 685 507 680" fill="none" stroke="url(#body)" stroke-width="27"/>
    <path d="M536 490 C578 494 597 536 592 574 C588 608 568 631 539 642" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.32"/>
    <path d="M324 444 C314 494 312 547 318 599" fill="none" stroke="${p.light}" stroke-width="10" opacity="0.13"/>
    <path d="M470 455 C481 482 483 514 477 543" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.18"/>
    <g fill="none" stroke="${p.pale}" stroke-width="4" stroke-linecap="round" opacity="0.55">
      <path d="M362 364 C342 336 378 322 360 292"/>
      <path d="M408 356 C390 330 424 312 407 286"/>
      <path d="M450 368 C434 344 464 326 449 300"/>
    </g>
  </g>`;
}

function candle(p) {
  return `<g>
    <ellipse cx="400" cy="514" rx="170" ry="170" fill="${p.pale}" opacity="0.28" filter="url(#blur)"/>
    <rect x="310" y="438" width="180" height="314" rx="26" fill="${p.shade}" opacity="0.52"/>
    <rect x="322" y="444" width="156" height="300" rx="22" fill="url(#bodySoft)" opacity="0.8"/>
    <rect x="334" y="502" width="132" height="196" rx="8" fill="${p.pale}" opacity="0.82"/>
    <path d="M400 506 L400 467" stroke="${p.deep}" stroke-width="5" stroke-linecap="round"/>
    <path d="M400 463 C377 438 391 410 400 391 C411 414 426 438 400 463Z" fill="${p.light}"/>
    <path d="M400 451 C391 439 396 425 400 416 C407 428 412 439 400 451Z" fill="#fff8df"/>
    <ellipse cx="400" cy="452" rx="26" ry="52" fill="${p.light}" opacity="0.25" filter="url(#blur)"/>
    <rect x="359" y="548" width="82" height="92" rx="4" fill="${p.base}" opacity="0.28"/>
    <path d="M375 574 L425 574 M375 592 L411 592 M375 610 L419 610" stroke="${p.deep}" stroke-width="2" opacity="0.3"/>
    <path d="M334 454 C368 466 432 466 466 454" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.28"/>
    <path d="M338 716 C370 728 430 728 462 716" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.24"/>
  </g>`;
}

function serum(p) {
  return `<g>
    <rect x="332" y="466" width="136" height="278" rx="26" fill="${p.shade}" opacity="0.42"/>
    <rect x="342" y="472" width="116" height="266" rx="21" fill="url(#bodySoft)" opacity="0.8"/>
    <rect x="354" y="520" width="92" height="150" rx="7" fill="${p.pale}" opacity="0.9"/>
    <rect x="368" y="540" width="64" height="4" rx="2" fill="${p.deep}" opacity="0.4"/>
    <rect x="368" y="554" width="44" height="3" rx="1.5" fill="${p.deep}" opacity="0.25"/>
    <rect x="368" y="628" width="54" height="3" rx="1.5" fill="${p.deep}" opacity="0.25"/>
    <rect x="365" y="414" width="70" height="64" rx="10" fill="${p.deep}"/>
    <rect x="372" y="348" width="56" height="72" rx="9" fill="${p.deep}" opacity="0.8"/>
    <rect x="382" y="316" width="36" height="38" rx="8" fill="${p.deep}"/>
    <rect x="391" y="280" width="18" height="42" rx="8" fill="${p.deep}"/>
    <path d="M360 492 L360 706" stroke="${p.light}" stroke-width="8" opacity="0.2"/>
    <path d="M446 502 C454 538 454 584 447 620" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.18"/>
    <circle cx="400" cy="578" r="19" fill="none" stroke="${p.shade}" stroke-width="2" opacity="0.4"/>
    <path d="M400 560 L400 596 M383 578 L417 578" stroke="${p.shade}" stroke-width="1.5" opacity="0.35"/>
  </g>`;
}

function pillow(p) {
  return `<g transform="rotate(-7 400 500)">
    <path d="M270 318 C246 318 236 342 240 374 L258 638 C262 674 282 690 314 688 L512 676 C546 674 562 654 560 620 L544 366 C540 330 522 314 490 316Z" fill="url(#body)"/>
    <path d="M272 330 C300 350 326 358 358 358 C438 358 510 354 552 340" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.38"/>
    <path d="M265 650 C310 632 370 628 420 632 C468 636 516 648 554 664" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.32"/>
    <path d="M284 360 C300 438 302 538 291 640" fill="none" stroke="${p.shade}" stroke-width="2" opacity="0.18"/>
    <path d="M340 672 C366 648 381 610 381 574 C381 536 369 502 347 478" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.2"/>
    <path d="M460 664 C442 638 433 608 435 578 C437 546 451 516 475 497" fill="none" stroke="${p.shade}" stroke-width="2" opacity="0.16"/>
    <path d="M300 330 C334 342 366 348 400 348" fill="none" stroke="${p.pale}" stroke-width="1.5" opacity="0.4"/>
  </g>`;
}

function board(p) {
  return `<g>
    <path d="M292 258 C292 236 310 224 332 224 L468 224 C490 224 508 236 508 258 L516 742 C516 770 494 786 466 786 L334 786 C306 786 284 770 284 742Z" fill="${p.deep}" opacity="0.28"/>
    <path d="M286 252 C286 230 304 218 326 218 L474 218 C496 218 514 230 514 252 L522 736 C522 764 500 780 472 780 L328 780 C300 780 278 764 278 736Z" fill="${p.pale}"/>
    <circle cx="400" cy="252" r="22" fill="${p.base}" opacity="0.4"/>
    <path d="M292 250 C292 236 304 228 318 228" fill="none" stroke="${p.light}" stroke-width="4" opacity="0.55"/>
    <g fill="none" stroke="${p.shade}" stroke-width="2.4" opacity="0.35">
      <path d="M318 338 C364 326 402 378 444 356 C477 338 494 356 510 384"/>
      <path d="M284 514 C330 490 362 528 396 514 C436 498 466 536 516 522"/>
      <path d="M300 676 C348 650 390 692 428 670 C462 650 486 674 516 690"/>
      <path d="M338 250 C356 288 340 320 326 350"/>
    </g>
    <g fill="none" stroke="${p.deep}" stroke-width="1" opacity="0.2">
      <path d="M320 412 C360 398 394 432 428 418 C456 406 482 424 504 442"/>
      <path d="M300 588 C336 570 370 602 408 586 C444 570 476 596 514 610"/>
    </g>
    <path d="M310 760 C356 772 444 772 490 760" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.4"/>
    <path d="M400 274 L400 740" stroke="${p.deep}" stroke-width="1" opacity="0.12"/>
  </g>`;
}

function speaker(p) {
  return `<g>
    <ellipse cx="400" cy="740" rx="158" ry="25" fill="${p.deep}" opacity="0.22" filter="url(#blur)"/>
    <rect x="268" y="320" width="264" height="410" rx="112" fill="${p.deep}" opacity="0.55"/>
    <rect x="280" y="306" width="240" height="400" rx="104" fill="url(#body)"/>
    <rect x="306" y="342" width="188" height="312" rx="86" fill="${p.shade}" opacity="0.42"/>
    <g fill="${p.light}" opacity="0.28">
      ${Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => `<circle cx="${332 + col * 34}" cy="${374 + row * 38}" r="2.5"/>`).join("")
      ).join("")}
    </g>
    <ellipse cx="400" cy="336" rx="76" ry="22" fill="${p.light}" opacity="0.25"/>
    <circle cx="366" cy="331" r="6" fill="${p.pale}" opacity="0.6"/>
    <circle cx="390" cy="331" r="6" fill="${p.pale}" opacity="0.6"/>
    <circle cx="414" cy="331" r="6" fill="${p.pale}" opacity="0.6"/>
    <path d="M330 330 C360 340 440 340 470 330" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.3"/>
    <path d="M310 660 C360 676 440 676 490 660" fill="none" stroke="${p.deep}" stroke-width="3" opacity="0.26"/>
    <path d="M300 420 C290 474 290 546 300 600" fill="none" stroke="${p.light}" stroke-width="4" opacity="0.15"/>
  </g>`;
}

function lipbalm(p) {
  const tube = (x, y, rotation, shade) => `<g transform="translate(${x} ${y}) rotate(${rotation})">
    <rect x="-38" y="-150" width="76" height="300" rx="26" fill="${p.deep}" opacity="0.25" transform="translate(6 8)"/>
    <rect x="-38" y="-150" width="76" height="300" rx="26" fill="${shade}"/>
    <rect x="-38" y="-52" width="76" height="132" rx="22" fill="${p.pale}" opacity="0.86"/>
    <rect x="-26" y="30" width="52" height="4" rx="2" fill="${p.deep}" opacity="0.3"/>
    <rect x="-26" y="43" width="38" height="3" rx="1.5" fill="${p.deep}" opacity="0.22"/>
    <circle cx="0" cy="-101" r="14" fill="${p.light}" opacity="0.4"/>
    <path d="M-25 -130 L-25 120" stroke="${p.light}" stroke-width="5" opacity="0.22"/>
  </g>`;
  return `<g>
    ${tube(356, 502, -13, p.base)}
    ${tube(440, 510, 11, p.shade)}
    <ellipse cx="400" cy="708" rx="132" ry="20" fill="${p.deep}" opacity="0.18" filter="url(#blur)"/>
  </g>`;
}

function tote(p) {
  return `<g>
    <path d="M326 352 C326 216 474 216 474 352" fill="none" stroke="${p.deep}" stroke-width="18"/>
    <path d="M326 352 C326 216 474 216 474 352" fill="none" stroke="${p.base}" stroke-width="10"/>
    <path d="M270 344 L530 344 L554 756 C500 774 300 774 246 756Z" fill="url(#body)"/>
    <path d="M270 344 L530 344 L534 392 L266 392Z" fill="${p.shade}" opacity="0.28"/>
    <path d="M278 390 C300 406 500 406 522 390" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.3"/>
    <path d="M308 360 L320 758 M492 360 L480 758" stroke="${p.deep}" stroke-width="2" opacity="0.15"/>
    <rect x="354" y="506" width="92" height="56" rx="4" fill="${p.pale}" opacity="0.45"/>
    <path d="M366 526 L434 526 M366 540 L410 540" stroke="${p.deep}" stroke-width="2" opacity="0.28"/>
    <path d="M258 736 C322 756 478 756 542 736" fill="none" stroke="${p.light}" stroke-width="2" opacity="0.24"/>
  </g>`;
}

function backpack(p) {
  return `<g>
    <path d="M352 286 C352 246 448 246 448 286" fill="none" stroke="${p.deep}" stroke-width="18"/>
    <path d="M304 314 C304 278 336 258 372 258 L428 258 C464 258 496 278 496 314 L522 726 C522 762 496 782 460 782 L340 782 C304 782 278 762 278 726Z" fill="url(#body)"/>
    <path d="M304 340 C348 362 452 362 496 340" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.3"/>
    <path d="M304 314 C304 278 336 258 372 258 L428 258 C464 258 496 278 496 314" fill="none" stroke="${p.light}" stroke-width="3" opacity="0.24"/>
    <path d="M332 286 C332 360 332 478 340 574 M468 286 C468 360 468 478 460 574" stroke="${p.deep}" stroke-width="14" opacity="0.35"/>
    <path d="M330 522 L470 522 L478 680 C478 704 458 716 436 716 L364 716 C342 716 322 704 322 680Z" fill="${p.shade}" opacity="0.32"/>
    <path d="M330 522 C356 536 444 536 470 522" fill="none" stroke="${p.light}" stroke-width="2.5" opacity="0.36"/>
    <rect x="384" y="554" width="32" height="20" rx="5" fill="${p.pale}" opacity="0.58"/>
    <path d="M400 574 L400 596" stroke="${p.pale}" stroke-width="5" stroke-linecap="round"/>
    <rect x="354" y="636" width="92" height="7" rx="3.5" fill="${p.deep}" opacity="0.26"/>
    <path d="M306 336 L294 714 M494 336 L506 714" stroke="${p.deep}" stroke-width="3" opacity="0.16"/>
  </g>`;
}

const renderers = {
  dress,
  shirt,
  jacket,
  cardigan,
  tee,
  hoodie,
  trousers,
  shorts,
  leggings,
  scarf,
  hat,
  sneakers,
  watch,
  headphones,
  lamp,
  mug,
  candle,
  serum,
  pillow,
  board,
  speaker,
  lipbalm,
  tote,
  backpack,
};

function productArt(slug, variant = 0, options = {}) {
  const spec = products[slug];
  if (!spec) throw new Error(`Unknown product: ${slug}`);
  const color = spec.colors[variant % spec.colors.length];
  const p = paint(color);
  const scene = scenes[variant % scenes.length];
  const width = options.width ?? 800;
  const height = options.height ?? 1000;
  const rot = [-1.2, 1.8, -2.2][variant % 3];
  const scale = [1, 0.965, 1.035][variant % 3];
  const content = `<g transform="translate(400 500) rotate(${rot}) scale(${scale}) translate(-400 -500)">${renderers[spec.type](p)}</g>`;
  return svgScene({
    width,
    height,
    scene,
    tint: spec.accent,
    body: p,
    seed: hash(`${slug}-${variant}`),
    content,
  });
}

/* ------------------------------------------------------------------ */
/* Editorial still lifes                                               */
/* ------------------------------------------------------------------ */

function editorialArt() {
  const lampColor = paint("#e8d4b1");
  const mugColor = paint("#9aa38d");
  const boardColor = paint("#e4ded2");
  const width = 1200;
  const height = 900;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#efe8dc"/><stop offset="1" stop-color="#d9cdbd"/>
    </linearGradient>
    <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a97f5e"/><stop offset="1" stop-color="#7d5941"/>
    </linearGradient>
    <radialGradient id="sun" cx="25%" cy="20%" r="65%">
      <stop offset="0" stop-color="#fff8e9" stop-opacity="0.9"/><stop offset="1" stop-color="#fff8e9" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lampBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5e7ca"/><stop offset="1" stop-color="#d5ba8e"/></linearGradient>
    <linearGradient id="mugBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b8c1ad"/><stop offset="1" stop-color="#7d8975"/></linearGradient>
    <linearGradient id="slab" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f0ebe0"/><stop offset="1" stop-color="#d1c6b7"/></linearGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="1200" height="900" fill="url(#wall)"/>
  <rect width="1200" height="900" fill="url(#sun)"/>
  <path d="M0 660 C220 635 360 674 580 654 C790 635 980 670 1200 646 L1200 900 L0 900Z" fill="url(#table)"/>
  <path d="M0 660 C220 635 360 674 580 654 C790 635 980 670 1200 646" fill="none" stroke="#f3e6d4" stroke-width="3" opacity="0.4"/>
  <ellipse cx="560" cy="712" rx="420" ry="50" fill="#4f3325" opacity="0.22" filter="url(#blur)"/>
  <g transform="translate(80 30) scale(0.66)">${lamp(lampColor)}</g>
  <g transform="translate(600 210) scale(0.48)">${mug(mugColor)}</g>
  <g transform="translate(330 300) scale(0.5) rotate(-8 400 500)">${board(boardColor)}</g>
  <g transform="translate(770 365) scale(0.32) rotate(8 400 500)">
    <rect x="280" y="380" width="240" height="320" rx="12" fill="#cbb99b"/>
    <rect x="304" y="408" width="192" height="264" rx="6" fill="#e9dfce"/>
    <path d="M320 436 L480 436 M320 464 L444 464 M320 492 L466 492" stroke="#a58e6c" stroke-width="3" opacity="0.3"/>
  </g>
  <rect width="1200" height="900" filter="url(#grain)" opacity="0.7"/>
</svg>`;
}

function heroArt() {
  return productArt("cashmere-cardigan", 1, { width: 1000, height: 1200 });
}

/* ------------------------------------------------------------------ */

fs.mkdirSync(path.join(root, "products"), { recursive: true });
fs.mkdirSync(path.join(root, "categories"), { recursive: true });
fs.mkdirSync(path.join(root, "art"), { recursive: true });

for (const slug of Object.keys(products)) {
  for (let variant = 0; variant < 3; variant++) {
    fs.writeFileSync(
      path.join(root, "products", `${slug}-${variant + 1}.svg`),
      productArt(slug, variant)
    );
  }
}

for (const [slug, config] of Object.entries(categories)) {
  fs.writeFileSync(
    path.join(root, "categories", `${slug}.svg`),
    productArt(config.product, config.variant, { width: 640, height: 760 })
  );
}

fs.writeFileSync(path.join(root, "art", "hero.svg"), heroArt());
fs.writeFileSync(path.join(root, "art", "editorial.svg"), editorialArt());
fs.writeFileSync(path.join(root, "art", "story.svg"), productArt("paper-table-lamp", 2, { width: 900, height: 1100 }));

console.log(`Generated ${Object.keys(products).length * 3} product images, ${Object.keys(categories).length} categories and 3 editorial scenes.`);
