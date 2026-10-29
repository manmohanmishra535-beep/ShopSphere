import bcrypt from "bcryptjs";
import type {
  Category,
  Database,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Review,
  Settings,
  TimelineEvent,
  User,
  Variant,
} from "../types.js";
import { addMinutes, newId, now, slugify } from "../lib/ids.js";

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

export function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const categories: Category[] = [
  { id: "cat_women", name: "Women", slug: "women", sortOrder: 1 },
  { id: "cat_dresses", name: "Dresses", slug: "dresses", parentId: "cat_women", sortOrder: 1 },
  { id: "cat_tops", name: "Tops", slug: "tops", parentId: "cat_women", sortOrder: 2 },
  { id: "cat_knitwear", name: "Knitwear", slug: "knitwear", parentId: "cat_women", sortOrder: 3 },
  { id: "cat_outerwear", name: "Outerwear", slug: "outerwear", parentId: "cat_women", sortOrder: 4 },
  { id: "cat_activewear-w", name: "Activewear", slug: "activewear-women", parentId: "cat_women", sortOrder: 5 },
  { id: "cat_accessories-w", name: "Accessories", slug: "accessories-women", parentId: "cat_women", sortOrder: 6 },

  { id: "cat_men", name: "Men", slug: "men", sortOrder: 2 },
  { id: "cat_shirts", name: "Shirts", slug: "shirts", parentId: "cat_men", sortOrder: 1 },
  { id: "cat_tshirts", name: "T-shirts", slug: "tshirts", parentId: "cat_men", sortOrder: 2 },
  { id: "cat_trousers", name: "Trousers", slug: "trousers", parentId: "cat_men", sortOrder: 3 },
  { id: "cat_outerwear-m", name: "Outerwear", slug: "outerwear-men", parentId: "cat_men", sortOrder: 4 },
  { id: "cat_footwear", name: "Footwear", slug: "footwear", parentId: "cat_men", sortOrder: 5 },
  { id: "cat_activewear-m", name: "Activewear", slug: "activewear-men", parentId: "cat_men", sortOrder: 6 },

  { id: "cat_home", name: "Home", slug: "home", sortOrder: 3 },
  { id: "cat_decor", name: "Decor", slug: "decor", parentId: "cat_home", sortOrder: 1 },
  { id: "cat_lighting", name: "Lighting", slug: "lighting", parentId: "cat_home", sortOrder: 2 },
  { id: "cat_kitchen", name: "Kitchen", slug: "kitchen", parentId: "cat_home", sortOrder: 3 },
  { id: "cat_bedding", name: "Bedding", slug: "bedding", parentId: "cat_home", sortOrder: 4 },

  { id: "cat_electronics", name: "Electronics", slug: "electronics", sortOrder: 4 },
  { id: "cat_audio", name: "Audio", slug: "audio", parentId: "cat_electronics", sortOrder: 1 },
  { id: "cat_wearables", name: "Wearables", slug: "wearables", parentId: "cat_electronics", sortOrder: 2 },

  { id: "cat_beauty", name: "Beauty", slug: "beauty", sortOrder: 5 },
  { id: "cat_skincare", name: "Skincare", slug: "skincare", parentId: "cat_beauty", sortOrder: 1 },
  { id: "cat_makeup", name: "Makeup", slug: "makeup", parentId: "cat_beauty", sortOrder: 2 },

  { id: "cat_kids", name: "Kids", slug: "kids", sortOrder: 6 },
  { id: "cat_kids-clothing", name: "Clothing", slug: "kids-clothing", parentId: "cat_kids", sortOrder: 1 },

  { id: "cat_sale", name: "Sale", slug: "sale", sortOrder: 7 },
];

interface SeedProduct {
  slug: string;
  title: string;
  brand: string;
  categoryId: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  colours: string[];
  sizes: string[];
  stock: number[];
  rating: number;
  ratingCount: number;
  sold: number;
  tags: string[];
  attributes: Record<string, string>;
  status?: Product["status"];
  lowStockThreshold?: number;
  daysOld?: number;
  reviewSeed?: { rating: number; title: string; body: string; author: string; days: number; status?: Review["status"] }[];
}

const seedProducts: SeedProduct[] = [
  {
    slug: "floral-wrap-dress",
    title: "Floral Wrap Dress",
    brand: "Aurelle",
    categoryId: "cat_dresses",
    price: 129900,
    compareAtPrice: 189900,
    description:
      "A softly structured wrap dress cut from breathable viscose, with a flattering V-neck and a tie waist that moves with you. Hand-painted florals in deep navy make it as at home at a summer wedding as it is on a slow Sunday.",
    colours: ["Navy", "Rose", "Olive"],
    sizes: ["S", "M", "L", "XL"],
    stock: [6, 12, 9, 4, 3, 8, 7, 2, 5, 4, 6, 1],
    rating: 4.5,
    ratingCount: 120,
    sold: 84,
    tags: ["new", "bestseller"],
    attributes: { Fabric: "100% Viscose", Fit: "True to size, wrap silhouette", Length: "Midi", Care: "Machine wash cold" },
    reviewSeed: [
      { rating: 5, title: "Beautiful drape", body: "The fabric feels lovely and the wrap sits perfectly. I wore it to a brunch and got three compliments.", author: "Ananya R.", days: 4 },
      { rating: 4, title: "Lovely colour", body: "Navy is exactly as pictured. Slightly long on me at 5'3\", but a quick hem fixed it.", author: "Priya K.", days: 11 },
      { rating: 5, title: "My new favourite", body: "Flattering, comfortable and easy to dress up or down. Worth every rupee.", author: "Meera S.", days: 20 },
    ],
  },
  {
    slug: "linen-shirt",
    title: "Linen Shirt",
    brand: "North & Co",
    categoryId: "cat_shirts",
    price: 89900,
    compareAtPrice: 119900,
    description:
      "An everyday linen shirt with a relaxed collar and a gently curved hem. Woven from European flax, it gets softer with every wash and works tucked, untucked or open over a tee.",
    colours: ["White", "Sand", "Sky"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: [2, 5, 8, 3, 0, 4, 7, 6, 2, 3, 5, 0, 4, 6, 2],
    rating: 4.2,
    ratingCount: 88,
    sold: 61,
    tags: ["essential"],
    attributes: { Fabric: "100% Linen", Fit: "Relaxed", Care: "Machine wash cold, line dry" },
    lowStockThreshold: 5,
    reviewSeed: [
      { rating: 5, title: "Perfect summer shirt", body: "Light, breathable and the sand colour goes with everything. Ordering a second.", author: "Rahul M.", days: 6 },
      { rating: 3, title: "Runs large", body: "Good fabric but I would size down. Returns were simple though.", author: "Arjun T.", days: 18 },
    ],
  },
  {
    slug: "denim-jacket",
    title: "Denim Jacket",
    brand: "Rivet Studio",
    categoryId: "cat_outerwear",
    price: 249900,
    compareAtPrice: 319900,
    description:
      "A classic trucker jacket in rigid 12oz cotton denim, with copper shanks and a lived-in wash. Cut boxy through the body so it layers over knitwear without pulling.",
    colours: ["Indigo", "Washed Black"],
    sizes: ["S", "M", "L", "XL"],
    stock: [4, 8, 6, 2, 3, 5, 4, 1],
    rating: 4.8,
    ratingCount: 301,
    sold: 47,
    tags: ["bestseller"],
    attributes: { Fabric: "100% Cotton denim, 12oz", Fit: "Boxy", Care: "Wash inside out, cold" },
    reviewSeed: [
      { rating: 5, title: "Proper denim", body: "Heavy in the best way, and the indigo has faded beautifully after a month.", author: "Kabir N.", days: 2 },
    ],
  },
  {
    slug: "canvas-tote",
    title: "Canvas Tote",
    brand: "Aurelle",
    categoryId: "cat_accessories-w",
    price: 64900,
    compareAtPrice: 89900,
    description:
      "A generous 16oz canvas tote with reinforced handles and an inside pocket for the things you always lose. Fits a 14-inch laptop, a water bottle and the market shop.",
    colours: ["Natural", "Charcoal"],
    sizes: ["One size"],
    stock: [1, 7],
    rating: 4.0,
    ratingCount: 45,
    sold: 39,
    tags: ["essential"],
    attributes: { Material: "16oz cotton canvas", Dimensions: "38 x 42 cm", Care: "Spot clean" },
    lowStockThreshold: 5,
  },
  {
    slug: "wool-scarf",
    title: "Wool Scarf",
    brand: "Loom & Laine",
    categoryId: "cat_accessories-w",
    price: 119900,
    description:
      "A featherweight merino scarf woven in a soft herringbone. Warm without bulk, and long enough to loop twice on the coldest mornings.",
    colours: ["Oat", "Rust", "Forest"],
    sizes: ["One size"],
    stock: [9, 4, 6],
    rating: 4.6,
    ratingCount: 67,
    sold: 33,
    tags: ["new"],
    attributes: { Fabric: "100% Merino wool", Dimensions: "180 x 35 cm", Care: "Dry clean" },
  },
  {
    slug: "everyday-sneakers",
    title: "Everyday Sneakers",
    brand: "Form & Field",
    categoryId: "cat_footwear",
    price: 299900,
    compareAtPrice: 379900,
    description:
      "A low-profile leather sneaker on a cushioned rubber sole. Clean enough for work, comfortable enough for a 12,000-step day.",
    colours: ["White", "Bone"],
    sizes: ["7", "8", "9", "10", "11"],
    stock: [3, 6, 8, 4, 2, 5, 7, 3, 1, 0],
    rating: 4.4,
    ratingCount: 156,
    sold: 52,
    tags: ["bestseller"],
    attributes: { Upper: "Full-grain leather", Sole: "Rubber", Fit: "True to size" },
  },
  {
    slug: "leather-watch",
    title: "Leather Strap Watch",
    brand: "Meridian",
    categoryId: "cat_wearables",
    price: 449900,
    compareAtPrice: 599900,
    description:
      "A 38mm brushed-steel case with a warm tan leather strap and a clean, quiet dial. Japanese quartz movement and 5ATM water resistance.",
    colours: ["Tan", "Black"],
    sizes: ["One size"],
    stock: [5, 3],
    rating: 4.7,
    ratingCount: 92,
    sold: 26,
    tags: ["gift"],
    attributes: { Case: "38mm stainless steel", Movement: "Japanese quartz", Water: "5 ATM" },
  },
  {
    slug: "studio-headphones",
    title: "Studio Headphones",
    brand: "Kanso",
    categoryId: "cat_audio",
    price: 599900,
    compareAtPrice: 749900,
    description:
      "Over-ear wireless headphones with 40mm drivers, adaptive noise cancelling and 40 hours of playback. Memory-foam cups stay comfortable through long sessions.",
    colours: ["Graphite", "Sand"],
    sizes: ["One size"],
    stock: [7, 4],
    rating: 4.6,
    ratingCount: 214,
    sold: 44,
    tags: ["bestseller", "gift"],
    attributes: { Battery: "40 hours", Drivers: "40mm", Connectivity: "Bluetooth 5.3, USB-C" },
  },
  {
    slug: "paper-table-lamp",
    title: "Paper Table Lamp",
    brand: "Halo House",
    categoryId: "cat_lighting",
    price: 219900,
    description:
      "A sculptural lamp with a rice-paper shade that throws a warm, even glow. Dimmable in three steps with a touch of the base.",
    colours: ["Ivory"],
    sizes: ["One size"],
    stock: [6],
    rating: 4.5,
    ratingCount: 38,
    sold: 18,
    tags: ["new"],
    attributes: { Material: "Rice paper, oak base", Height: "42 cm", Bulb: "E27, max 9W LED" },
  },
  {
    slug: "ceramic-mug",
    title: "Ceramic Mug",
    brand: "Kanso",
    categoryId: "cat_kitchen",
    price: 39900,
    compareAtPrice: 49900,
    description:
      "A hand-thrown stoneware mug with a speckled glaze and a handle that actually fits. Holds 350ml, which is exactly one good coffee.",
    colours: ["Speckle", "Chalk"],
    sizes: ["350ml"],
    stock: [24, 18],
    rating: 4.3,
    ratingCount: 51,
    sold: 72,
    tags: ["gift"],
    attributes: { Material: "Stoneware", Volume: "350 ml", Care: "Dishwasher safe" },
  },
  {
    slug: "soy-candle",
    title: "Cedar & Fig Candle",
    brand: "Halo House",
    categoryId: "cat_decor",
    price: 54900,
    description:
      "Cedarwood, ripe fig and a whisper of smoke in a reusable amber glass. Hand-poured soy wax with a cotton wick and a 45-hour burn.",
    colours: ["Amber"],
    sizes: ["220g"],
    stock: [12],
    rating: 4.4,
    ratingCount: 73,
    sold: 31,
    tags: ["new", "gift"],
    attributes: { Wax: "Soy blend", Burn: "45 hours", Notes: "Cedar, fig, vetiver" },
  },
  {
    slug: "vitamin-c-serum",
    title: "Vitamin C Serum",
    brand: "Botanica",
    categoryId: "cat_skincare",
    price: 89900,
    compareAtPrice: 109900,
    description:
      "A stabilised 10% vitamin C serum with ferulic acid and hyaluronic acid. Brightens dullness and softens the look of fine lines without the sting.",
    colours: ["30ml"],
    sizes: ["30ml"],
    stock: [15],
    rating: 4.2,
    ratingCount: 188,
    sold: 64,
    tags: ["bestseller"],
    attributes: { Actives: "10% Vitamin C, 0.5% Ferulic acid", Skin: "All types", Use: "Morning, before SPF" },
  },
  {
    slug: "silk-pillowcase",
    title: "Silk Pillowcase",
    brand: "Loom & Laine",
    categoryId: "cat_bedding",
    price: 149900,
    description:
      "22-momme mulberry silk with a hidden zip. Kinder to hair and skin than cotton, and cool to the touch all night.",
    colours: ["Pearl", "Sage"],
    sizes: ["Standard", "King"],
    stock: [8, 5, 4, 2],
    rating: 4.6,
    ratingCount: 59,
    sold: 22,
    tags: ["gift"],
    attributes: { Material: "22-momme mulberry silk", Care: "Hand wash cold" },
  },
  {
    slug: "cashmere-cardigan",
    title: "Cashmere Cardigan",
    brand: "Loom & Laine",
    categoryId: "cat_knitwear",
    price: 329900,
    compareAtPrice: 429900,
    description:
      "A gently oversized cardigan in two-ply cashmere, with mother-of-pearl buttons and ribbed cuffs. The kind of layer you keep by the door all winter.",
    colours: ["Oat", "Charcoal", "Rose"],
    sizes: ["S", "M", "L"],
    stock: [3, 4, 2, 5, 1, 0, 2, 3, 1],
    rating: 4.9,
    ratingCount: 44,
    sold: 15,
    tags: ["new"],
    attributes: { Fabric: "100% Cashmere", Fit: "Relaxed", Care: "Hand wash, dry flat" },
  },
  {
    slug: "chino-trousers",
    title: "Chino Trousers",
    brand: "North & Co",
    categoryId: "cat_trousers",
    price: 159900,
    compareAtPrice: 199900,
    description:
      "Mid-rise chinos in a stretch cotton twill with a clean, tapered leg. Smart enough for the office, easy enough for the weekend.",
    colours: ["Stone", "Navy"],
    sizes: ["30", "32", "34", "36", "38"],
    stock: [4, 6, 8, 5, 2, 3, 5, 6, 4, 1],
    rating: 4.3,
    ratingCount: 96,
    sold: 41,
    tags: ["essential"],
    attributes: { Fabric: "98% Cotton, 2% Elastane", Fit: "Tapered", Care: "Machine wash" },
  },
  {
    slug: "graphic-tee",
    title: "Graphic Cotton Tee",
    brand: "Rivet Studio",
    categoryId: "cat_tshirts",
    price: 59900,
    compareAtPrice: 79900,
    description:
      "A heavyweight organic cotton tee with a small screen-printed mark at the chest. Pre-shrunk, with a boxy fit that holds its shape.",
    colours: ["Ecru", "Ink"],
    sizes: ["S", "M", "L", "XL"],
    stock: [10, 14, 12, 6, 5, 9, 11, 4],
    rating: 4.1,
    ratingCount: 132,
    sold: 58,
    tags: ["essential"],
    attributes: { Fabric: "100% Organic cotton, 220gsm", Fit: "Boxy", Care: "Machine wash cold" },
  },
  {
    slug: "kids-hoodie",
    title: "Kids Hoodie",
    brand: "Little Field",
    categoryId: "cat_kids-clothing",
    price: 79900,
    description:
      "A soft brushed-fleece hoodie with a kangaroo pocket and a roomy hood. Made for playgrounds and built to survive the wash.",
    colours: ["Butter", "Fern", "Denim"],
    sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y"],
    stock: [6, 8, 5, 3, 4, 7, 4, 2, 5, 6, 3, 1],
    rating: 4.7,
    ratingCount: 63,
    sold: 27,
    tags: ["new"],
    attributes: { Fabric: "80% Cotton, 20% Polyester fleece", Care: "Machine wash" },
  },
  {
    slug: "running-shorts",
    title: "Running Shorts",
    brand: "Form & Field",
    categoryId: "cat_activewear-m",
    price: 99900,
    description:
      "Lightweight 5-inch shorts with a built-in liner, a zip back pocket and four-way stretch. Sweat-wicking and quick to dry.",
    colours: ["Black", "Slate"],
    sizes: ["S", "M", "L", "XL"],
    stock: [5, 7, 9, 4, 3, 6, 8, 2],
    rating: 4.2,
    ratingCount: 74,
    sold: 35,
    tags: [],
    attributes: { Fabric: "Recycled polyester stretch", Inseam: '5"', Care: "Machine wash cold" },
  },
  {
    slug: "yoga-leggings",
    title: "High-Rise Yoga Leggings",
    brand: "Form & Field",
    categoryId: "cat_activewear-w",
    price: 119900,
    compareAtPrice: 149900,
    description:
      "Buttery, squat-proof leggings with a wide high-rise waistband and a hidden key pocket. Four-way stretch that stays put through every flow.",
    colours: ["Black", "Plum"],
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: [4, 8, 10, 6, 2, 3, 6, 7, 4, 1],
    rating: 4.5,
    ratingCount: 205,
    sold: 66,
    tags: ["bestseller"],
    attributes: { Fabric: "Nylon-elastane blend", Rise: "High", Care: "Machine wash cold" },
  },
  {
    slug: "straw-hat",
    title: "Wide-Brim Straw Hat",
    brand: "Aurelle",
    categoryId: "cat_accessories-w",
    price: 74900,
    description:
      "A hand-woven paper straw hat with a wide brim and a soft cotton band. Packs flat and springs back into shape.",
    colours: ["Natural"],
    sizes: ["One size"],
    stock: [7],
    rating: 4.0,
    ratingCount: 29,
    sold: 12,
    tags: ["new"],
    attributes: { Material: "Paper straw", Brim: "12 cm", Care: "Spot clean" },
  },
  {
    slug: "marble-board",
    title: "Marble Serving Board",
    brand: "Halo House",
    categoryId: "cat_kitchen",
    price: 129900,
    description:
      "A generous marble board with a leather loop, for cheese, charcuterie or just a very good sandwich. Every slab is unique.",
    colours: ["White"],
    sizes: ["One size"],
    stock: [4],
    rating: 4.4,
    ratingCount: 22,
    sold: 9,
    tags: ["gift"],
    attributes: { Material: "Italian marble, leather", Dimensions: "45 x 20 cm", Care: "Wipe clean" },
  },
  {
    slug: "bluetooth-speaker",
    title: "Pocket Bluetooth Speaker",
    brand: "Kanso",
    categoryId: "cat_audio",
    price: 349900,
    compareAtPrice: 399900,
    description:
      "A palm-sized speaker with surprising low end, IPX7 waterproofing and 18 hours of battery. Pair two for stereo.",
    colours: ["Forest", "Clay"],
    sizes: ["One size"],
    stock: [9, 6],
    rating: 4.3,
    ratingCount: 118,
    sold: 38,
    tags: ["gift"],
    attributes: { Battery: "18 hours", Water: "IPX7", Connectivity: "Bluetooth 5.2" },
  },
  {
    slug: "tinted-lip-balm",
    title: "Tinted Lip Balm",
    brand: "Botanica",
    categoryId: "cat_makeup",
    price: 34900,
    description:
      "A sheer wash of colour with shea butter and jojoba. Keeps lips comfortable for hours, with no waxy finish.",
    colours: ["Fig", "Rosewood", "Bare"],
    sizes: ["4.5g"],
    stock: [18, 12, 9],
    rating: 4.6,
    ratingCount: 87,
    sold: 54,
    tags: ["new"],
    attributes: { Formula: "Shea butter, jojoba", Finish: "Sheer satin", Vegan: "Yes" },
  },
  {
    slug: "canvas-backpack",
    title: "Canvas Backpack",
    brand: "Rivet Studio",
    categoryId: "cat_accessories-w",
    price: 189900,
    compareAtPrice: 239900,
    description:
      "A 20-litre waxed-canvas backpack with a padded laptop sleeve, two bottle pockets and leather reinforcements at the base.",
    colours: ["Olive", "Black"],
    sizes: ["20L"],
    stock: [5, 7],
    rating: 4.5,
    ratingCount: 64,
    sold: 21,
    tags: ["essential"],
    attributes: { Material: "Waxed canvas, leather", Capacity: "20 L", Laptop: "Up to 15 inches" },
    daysOld: 3,
  },
];

function buildVariants(p: SeedProduct): Variant[] {
  const prefix = p.slug
    .split("-")
    .map((s) => s.slice(0, 3).toUpperCase())
    .join("-")
    .slice(0, 8);
  const variants: Variant[] = [];
  let i = 0;
  for (const colour of p.colours) {
    for (const size of p.sizes) {
      const colourCode = colour.slice(0, 3).toUpperCase();
      const sizeCode = size.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
      const stock = p.stock[i] ?? 0;
      variants.push({
        sku: `${prefix}-${colourCode}-${sizeCode}`,
        options: { colour, size },
        price: p.price,
        stock,
        reserved: 0,
        lowStockThreshold: p.lowStockThreshold ?? 5,
      });
      i++;
    }
  }
  return variants;
}

const image = (slug: string, n: number, title: string) => ({
  publicId: `shopsphere/${slug}-${n}`,
  url: `/products/${slug}-${n}.svg`,
  alt: `${title} — view ${n}`,
});

function buildProducts(): Product[] {
  return seedProducts.map((p, index) => {
    const created = daysAgo(p.daysOld ?? 12 + index * 2, 9);
    return {
      id: `prd_${p.slug}`,
      title: p.title,
      slug: p.slug,
      description: p.description,
      brand: p.brand,
      categoryId: p.categoryId,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      images: [1, 2, 3].map((n) => image(p.slug, n, p.title)),
      attributes: p.attributes,
      variants: buildVariants(p),
      status: p.status ?? "active",
      ratingAvg: p.rating,
      ratingCount: p.ratingCount,
      sold: p.sold,
      tags: p.tags,
      createdAt: iso(created),
      updatedAt: iso(created),
    };
  });
}

const firstNames = ["Ananya", "Rahul", "Priya", "Kabir", "Meera", "Arjun", "Sara", "Vikram", "Nisha", "Aditya", "Tara", "Rohan"];
const lastNames = ["Sharma", "Mehta", "Iyer", "Nair", "Kapoor", "Rao", "Banerjee", "Singh", "Desai", "Verma"];

function buildUsers(adminHash: string, customerHash: string): User[] {
  const users: User[] = [
    {
      id: "usr_admin",
      name: "Manmohan Mishra",
      email: "admin@shopsphere.in",
      passwordHash: adminHash,
      role: "admin",
      phone: "+91 98200 11223",
      addresses: [],
      createdAt: iso(daysAgo(240, 9)),
    },
    {
      id: "usr_demo",
      name: "Riya Mehta",
      email: "demo@shopsphere.in",
      passwordHash: customerHash,
      role: "customer",
      phone: "+91 98330 44556",
      addresses: [
        {
          id: "adr_demo_home",
          label: "Home",
          name: "Riya Mehta",
          phone: "+91 98330 44556",
          line1: "12, Sunder Nagar",
          line2: "Near Hill Road",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
          isDefault: true,
        },
        {
          id: "adr_demo_office",
          label: "Office",
          name: "Riya Mehta",
          phone: "+91 98330 44556",
          line1: "4th floor, Raheja Plaza",
          line2: "Linking Road, Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400050",
        },
      ],
      createdAt: iso(daysAgo(210, 11)),
    },
  ];

  for (let i = 0; i < 9; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 3) % lastNames.length];
    users.push({
      id: `usr_seed_${i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      passwordHash: customerHash,
      role: "customer",
      phone: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
      addresses: [
        {
          id: `adr_seed_${i}`,
          label: "Home",
          name: `${first} ${last}`,
          phone: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
          line1: `${12 + i * 7}, Palm Residency`,
          city: ["Mumbai", "Pune", "Bengaluru", "Delhi", "Hyderabad", "Chennai"][i % 6],
          state: ["Maharashtra", "Maharashtra", "Karnataka", "Delhi", "Telangana", "Tamil Nadu"][i % 6],
          pincode: ["400050", "411001", "560001", "110001", "500001", "600001"][i % 6],
          isDefault: true,
        },
      ],
      createdAt: iso(daysAgo(150 - i * 9, 14)),
    });
  }
  return users;
}

function timelineFor(status: OrderStatus, created: Date): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { status: "pending", note: "Order placed", at: iso(created), by: "customer" },
  ];
  const push = (s: string, note: string, minutes: number) => {
    events.push({
      status: s,
      note,
      at: new Date(created.getTime() + minutes * 60_000).toISOString(),
      by: s === "shipped" || s === "packed" ? "admin" : "system",
    });
  };
  if (status === "cancelled") {
    push("cancelled", "Order cancelled", 60);
    return events;
  }
  push("paid", "Payment captured", 2);
  if (["packed", "shipped", "delivered"].includes(status)) push("packed", "Packed and ready to ship", 60 * 20);
  if (["shipped", "delivered"].includes(status)) push("shipped", "Handed to Delhivery", 60 * 30);
  if (status === "delivered") push("delivered", "Delivered to customer", 60 * 74);
  return events;
}

function buildOrders(users: User[], products: Product[]): Order[] {
  const orders: Order[] = [];
  let counter = 100240;
  const rand = mulberry32(20261027);

  const makeOrder = (user: User, days: number, forcedStatus?: OrderStatus, forcedProduct?: Product): Order => {
    const created = daysAgo(days, 9 + Math.floor(rand() * 9));
    const createdIso = iso(created);
    const address = user.addresses[0];
    const itemCount = 1 + Math.floor(rand() * 2);
    const chosen: Product[] = [];
    if (forcedProduct) chosen.push(forcedProduct);
    while (chosen.length < itemCount) {
      const candidate = products[Math.floor(rand() * products.length)];
      if (!chosen.some((p) => p.id === candidate.id)) chosen.push(candidate);
    }
    const items: OrderItem[] = chosen.map((p) => {
      const variant = p.variants.find((v) => v.stock > 2) ?? p.variants[0];
      return {
        productId: p.id,
        slug: p.slug,
        title: p.title,
        sku: variant.sku,
        options: variant.options,
        price: p.price,
        qty: 1 + Math.floor(rand() * 2),
        image: p.images[0].url,
      };
    });
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const shipping = subtotal >= 99900 ? 0 : 4900;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + shipping;
    const status: OrderStatus =
      forcedStatus ??
      (days > 14 ? "delivered" : days > 7 ? "shipped" : days > 4 ? "packed" : days > 2 ? "paid" : rand() > 0.82 ? "cancelled" : "paid");
    const paymentStatus =
      status === "cancelled" ? (rand() > 0.5 ? "refunded" : "failed") : status === "pending" ? "created" : "paid";
    counter += 1;
    const order: Order = {
      id: `ord_${counter}`,
      orderNumber: `EC-${counter}`,
      userId: user.id,
      items,
      shippingAddress: address,
      subtotal,
      shipping,
      tax,
      discount: 0,
      total,
      currency: "INR",
      status,
      deliveryMethod: "standard",
      payment: {
        provider: "mock",
        providerOrderId: `pay_${counter}mock`,
        paymentId: paymentStatus === "paid" ? `pay_${counter}captured` : undefined,
        status: paymentStatus as Order["payment"]["status"],
        method: ["upi", "card", "netbanking"][Math.floor(rand() * 3)],
        amount: total,
      },
      timeline: timelineFor(status, created),
      tracking:
        status === "shipped" || status === "delivered"
          ? {
              carrier: "Delhivery",
              awb: `${1000000000 + counter * 7}`,
              url: "https://www.delhivery.com/track/package/",
            }
          : undefined,
      reservationExpiresAt: null,
      createdAt: createdIso,
      updatedAt: createdIso,
    };
    return order;
  };

  // Demo customer: a delivered order containing the dress, plus recent orders.
  const dress = products.find((p) => p.slug === "floral-wrap-dress")!;
  const shirt = products.find((p) => p.slug === "linen-shirt")!;
  const mug = products.find((p) => p.slug === "ceramic-mug")!;
  const headphones = products.find((p) => p.slug === "studio-headphones")!;
  const demo = users.find((u) => u.id === "usr_demo")!;
  orders.push(makeOrder(demo, 16, "delivered", dress));
  orders.push(makeOrder(demo, 9, "delivered", shirt));
  orders.push(makeOrder(demo, 3, "shipped", headphones));
  orders.push(makeOrder(demo, 1, "paid", mug));

  // Historical orders for dashboard and customer lists.
  for (let i = 0; i < 58; i++) {
    const customer = users[2 + Math.floor(rand() * (users.length - 2))];
    orders.push(makeOrder(customer, Math.floor(rand() * 30)));
  }

  // A just-cancelled order for the admin table.
  const cancelled = makeOrder(users[4], 0, "cancelled", products[3]);
  cancelled.payment.status = "failed";
  orders.push(cancelled);

  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function buildReviews(users: User[], products: Product[], orders: Order[]): Review[] {
  const reviews: Review[] = [];
  const delivered = orders.filter((o) => o.status === "delivered");
  let pendingMade = 0;

  for (const product of products) {
    const seed = seedProducts.find((p) => p.slug === product.slug);
    if (!seed?.reviewSeed) continue;
    seed.reviewSeed.forEach((r, i) => {
      const author =
        users.find((u) => u.name.startsWith(r.author.split(" ")[0])) ??
        users[3 + (i % 6)];
      const order = orders.find(
        (o) => o.userId === author.id && o.items.some((it) => it.productId === product.id)
      );
      reviews.push({
        id: `rev_${product.slug}_${i}`,
        productId: product.id,
        userId: author.id,
        orderId: order?.id ?? delivered[0]?.id ?? "ord_100241",
        rating: r.rating,
        title: r.title,
        body: r.body,
        images: [],
        status: r.status ?? "published",
        helpful: 3 + ((i * 7) % 19),
        createdAt: iso(daysAgo(r.days, 15)),
        updatedAt: iso(daysAgo(r.days, 15)),
      });
    });
  }

  // A few more published reviews from delivered orders.
  for (const order of delivered.slice(0, 10)) {
    for (const item of order.items) {
      if (reviews.some((r) => r.productId === item.productId && r.userId === order.userId)) continue;
      if (pendingMade > 9) break;
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      const pending = pendingMade < 3;
      reviews.push({
        id: `rev_seed_${order.orderNumber}_${item.sku}`,
        productId: item.productId,
        userId: order.userId,
        orderId: order.id,
        rating: pending ? 3 : 4 + (product.title.length % 2),
        title: pending ? "Nice, but sizing was off" : "Happy with this purchase",
        body: pending
          ? "The quality is good but the fit was not quite right for me. Considering an exchange."
          : `Exactly as described. The ${product.title.toLowerCase()} has held up well after a few weeks of use.`,
        images: [],
        status: pending ? "pending" : "published",
        helpful: pending ? 0 : 2 + (product.sold % 11),
        createdAt: iso(daysAgo(pending ? 1 : 5 + (product.sold % 12), 17)),
        updatedAt: iso(daysAgo(pending ? 1 : 5 + (product.sold % 12), 17)),
      });
      if (pending) pendingMade++;
    }
  }

  return reviews;
}

export function buildSettings(): Settings {
  return {
    storeName: "ShopSphere",
    supportEmail: "help@shopsphere.in",
    shippingFee: 4900,
    freeShippingThreshold: 99900,
    expressFee: 9900,
    taxRatePercent: 5,
    lowStockEmail: true,
    orderEmail: true,
    paymentKeysConfigured: true,
    orderCounter: 100300,
  };
}

export async function buildSeed(): Promise<Database> {
  const adminHash = await bcrypt.hash("admin123", 10);
  const customerHash = await bcrypt.hash("demo123", 10);
  const users = buildUsers(adminHash, customerHash);
  const products = buildProducts();
  const orders = buildOrders(users, products);
  const reviews = buildReviews(users, products, orders);

  const settings = buildSettings();
  settings.orderCounter = Math.max(
    settings.orderCounter,
    ...orders.map((order) => Number(order.orderNumber.replace(/^EC-/, "")) || 0)
  );

  const stockMovements = products.slice(0, 8).flatMap((p, i) => {
    const v = p.variants[0];
    return [
      {
        id: newId("mov"),
        sku: v.sku,
        delta: 20,
        reason: "restock" as const,
        note: `PO 44${71 + i}`,
        actor: "admin@shopsphere.in",
        at: iso(daysAgo(6 - (i % 5), 11)),
      },
      {
        id: newId("mov"),
        sku: v.sku,
        delta: -1,
        reason: "sale" as const,
        note: "Order EC-1002" + (40 + i),
        actor: "system",
        at: iso(daysAgo(2, 16)),
      },
    ];
  });

  return {
    users,
    categories,
    products,
    carts: [],
    wishlists: [
      { id: "wl_demo", userId: "usr_demo", productIds: ["prd_wool-scarf", "prd_paper-table-lamp"] },
    ],
    orders,
    reviews,
    stockMovements,
    auditLogs: [],
    settings,
  };
}

export { categories as seedCategories };
