import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Headphones,
  PackageCheck,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { getHome } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/format";
import { ProductCard } from "@/components/shop/product-card";
import { WishlistButton } from "@/components/shop/wishlist-button";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const trustItems = [
  { icon: Truck, title: "Free shipping", copy: "On orders over ₹999" },
  { icon: RotateCcw, title: "7-day returns", copy: "No questions asked" },
  { icon: ShieldCheck, title: "Secure payments", copy: "UPI, cards & netbanking" },
  { icon: Headphones, title: "Real humans", copy: "Mon–Sat, 10am–6pm" },
];

const testimonials = [
  {
    quote: "The linen shirt has become the piece I reach for every week. You can feel the difference in the cloth.",
    name: "Ananya R.",
    meta: "Verified buyer · Mumbai",
    initial: "AR",
    tint: "bg-[#e7d8cc] text-[#6c4939]",
  },
  {
    quote: "Ordered on Tuesday, wearing it on Thursday. The packaging was lovely and nothing went to waste.",
    name: "Rahul M.",
    meta: "Verified buyer · Bengaluru",
    initial: "RM",
    tint: "bg-[#d8e0d6] text-[#405844]",
  },
  {
    quote: "Finally, a store where the photos match what arrives. The cashmere cardigan is genuinely special.",
    name: "Priya K.",
    meta: "Verified buyer · Pune",
    initial: "PK",
    tint: "bg-[#e5d9e5] text-[#644a64]",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-[clamp(1.65rem,3.2vw,2.15rem)] font-semibold leading-[1.08] tracking-[-0.035em]">{title}</h2>
        {description ? <p className="mt-2.5 text-[13px] leading-6 text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-text transition-colors hover:text-primary">
          {action ?? "View all"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function MiniRating() {
  return (
    <span className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400" aria-hidden>
      {[0, 1, 2, 3, 4].map((star) => (
        <Star key={star} className="h-3 w-3" fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export default async function HomePage() {
  const home = await getHome();

  if (!home) {
    return (
      <div className="container-shop py-24">
        <EmptyState
          title="The shop is taking a short breather"
          description="We couldn't load the catalogue just now. Please try again in a moment."
          action={<Link href="/products" className={buttonStyles("primary")}>Browse the catalogue</Link>}
        />
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-primary hover:underline">Refresh the page</Link>
        </div>
      </div>
    );
  }

  const { hero, newArrivals, bestSellers, editorsPicks, categories, stats } = home;
  const displayCategories = categories.filter((category) => category.slug !== "sale").slice(0, 6);
  const saleCategory = categories.find((category) => category.slug === "sale");
  const allCards = [...bestSellers, ...newArrivals, ...editorsPicks];
  const secondary = allCards.find((product) => product.id !== hero.id);
  const salePieces = editorsPicks.filter((product) => product.id !== hero.id).slice(0, 2);
  const fallbackSale = newArrivals.filter((product) => product.id !== hero.id).slice(0, 2);
  const saleProducts = salePieces.length ? salePieces : fallbackSale;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.42] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:84px_84px] [mask-image:radial-gradient(ellipse_at_82%_18%,black,transparent_68%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -left-36 top-20 h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="container-shop relative">
          <div className="grid items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-16">
            <div className="flex flex-col justify-center lg:pr-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted shadow-sm backdrop-blur">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  The autumn edit · 2026
                </span>
              </div>

              <h1 className="mt-6 text-[clamp(3rem,6.5vw,5.15rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
                Fewer,
                <br />
                <span className="text-primary">better</span> things.
              </h1>
              <p className="mt-6 max-w-[30rem] text-[15px] leading-7 text-muted">
                A tight edit of clothing and objects made to be lived in. Natural materials, honest prices, and
                nothing that needs replacing next season.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/products?sort=newest" className={buttonStyles("primary", "lg", "group h-12 w-full justify-center rounded-xl px-6 shadow-[0_12px_24px_-14px_var(--primary)] sm:w-auto")}>
                  Shop new arrivals
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/products?category=sale" className={buttonStyles("outline", "lg", "h-12 w-full justify-center rounded-xl bg-bg/60 px-6 backdrop-blur sm:w-auto")}>
                  Explore the sale
                </Link>
              </div>

              <div className="mt-9 grid grid-cols-3 divide-x divide-border border-t border-border pt-5">
                <div>
                  <p className="price-num text-lg font-semibold tracking-[-0.03em]">{formatNumber(stats.products)}</p>
                  <p className="mt-0.5 max-w-[90px] text-[9px] font-medium uppercase leading-3 tracking-[0.12em] text-muted sm:text-[10px] sm:leading-4 sm:tracking-[0.14em]">Considered pieces</p>
                </div>
                <div className="pl-4">
                  <p className="price-num text-lg font-semibold tracking-[-0.03em]">{formatNumber(stats.happyCustomers)}+</p>
                  <p className="mt-0.5 text-[9px] font-medium uppercase leading-3 tracking-[0.12em] text-muted sm:text-[10px] sm:leading-4 sm:tracking-[0.14em]">Happy homes</p>
                </div>
                <div className="pl-4">
                  <MiniRating />
                  <p className="mt-1.5 text-[9px] font-medium uppercase leading-3 tracking-[0.12em] text-muted sm:text-[10px] sm:leading-4 sm:tracking-[0.14em]">Loved by 1,200+</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[640px]">
              <div className="grid grid-cols-[1.42fr_0.78fr] gap-2.5 sm:gap-3.5">
                <div className="relative">
                  <Link
                    href={`/products/${hero.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] border border-border/70 bg-surface shadow-[0_26px_60px_-42px_rgb(16_24_40/0.55)] sm:rounded-[28px]"
                    aria-label={`Shop ${hero.title}`}
                  >
                    <img
                      src={hero.images[0]?.url}
                      alt={hero.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-900 shadow-sm backdrop-blur sm:left-4 sm:top-4">
                      The piece
                    </span>
                    <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/70 bg-white/94 p-3 shadow-[0_12px_28px_-18px_rgb(15_23_42/0.6)] backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">{hero.brand}</p>
                          <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-900">{hero.title}</p>
                          <p className="mt-1 flex items-baseline gap-2 text-[11px]">
                            <span className="font-semibold text-slate-900">{formatINR(hero.price)}</span>
                            {hero.compareAtPrice ? <s className="text-slate-500">{formatINR(hero.compareAtPrice)}</s> : null}
                          </p>
                        </div>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-white transition-transform duration-300 group-hover:rotate-45">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute right-3 top-3 z-10">
                    <WishlistButton productId={hero.id} floating />
                  </div>
                </div>

                <div className="grid grid-rows-1 gap-2.5 sm:grid-rows-[1fr_0.78fr] sm:gap-3.5">
                  {secondary ? (
                    <Link
                      href={`/products/${secondary.slug}`}
                      className="group relative overflow-hidden rounded-[20px] border border-border/70 bg-surface sm:rounded-[24px]"
                    >
                      <img
                        src={secondary.image}
                        alt={secondary.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/92 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-900 shadow-sm backdrop-blur">
                        Best seller
                      </span>
                      <div className="absolute inset-x-2.5 bottom-2.5 rounded-xl border border-white/70 bg-white/92 px-2.5 py-2 shadow-sm backdrop-blur">
                        <p className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-slate-900 sm:text-[11px] sm:leading-4">{secondary.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-600">{formatINR(secondary.price)}</p>
                      </div>
                    </Link>
                  ) : null}

                  <Link href="/products?sort=newest" className="group relative hidden flex-col justify-between overflow-hidden rounded-[20px] bg-primary p-4 text-white shadow-[0_20px_36px_-24px_var(--primary)] sm:flex sm:rounded-[24px] sm:p-5">
                    <div aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-white/20" />
                    <div aria-hidden className="absolute -right-2 top-7 h-16 w-16 rounded-full bg-white/10" />
                    <Sparkles className="h-4 w-4 text-white/80" strokeWidth={1.6} />
                    <div className="relative mt-6">
                      <p className="price-num text-[30px] font-semibold leading-none tracking-[-0.04em]">{formatNumber(stats.products)}</p>
                      <p className="mt-1.5 text-[11px] leading-4 text-white/70">pieces in<br />the current edit</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                        Browse all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="group flex items-center gap-3 bg-bg px-4 py-4 transition-colors hover:bg-surface/70">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
                  <item.icon className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[12px] font-semibold leading-tight">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-8" />
      </section>

      <section className="container-shop py-14 md:py-20">
        <SectionHeading
          eyebrow="Find your corner"
          title="Shop by category"
          description="Six small worlds, one considered point of view. Start with the room or the ritual you have in mind."
          href="/products"
          action="All categories"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {displayCategories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/70 bg-surface"
            >
              <img
                src={`/categories/${category.slug}.svg`}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-transparent" />
              <span className="absolute left-3 top-3 text-[10px] font-medium tabular-nums text-white/65">0{index + 1}</span>
              <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-white/30 bg-white/10 text-white opacity-0 backdrop-blur transition-all duration-200 group-hover:opacity-100">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-white">{category.name}</p>
                <p className="mt-0.5 text-[10px] text-white/65">{category.productCount ?? 0} pieces</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop pb-16 md:pb-20">
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          description="The latest additions, photographed exactly as they arrive — no retouching, no surprises."
          href="/products?sort=newest"
          action="Shop all new"
        />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {newArrivals.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="container-shop grid items-center gap-8 py-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16 lg:py-20">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[24px] border border-border/70 bg-surface sm:rounded-[28px]">
            <img src="/art/editorial.svg" alt="A still life of pieces from the ShopSphere studio" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white/92 px-4 py-3 shadow-[0_16px_32px_-24px_rgb(15_23_42/0.55)] backdrop-blur">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">From the studio</p>
                <p className="mt-0.5 text-[12px] font-semibold text-slate-900">Objects with a life beyond the season.</p>
              </div>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-white">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
          <div>
            <p className="eyebrow">Why ShopSphere</p>
            <h2 className="mt-2.5 text-[clamp(1.8rem,3.8vw,2.6rem)] font-semibold leading-[1.04] tracking-[-0.04em]">
              Made with intent.
              <br />
              Chosen to last.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              We work with a small number of makers, order in considered quantities, and say no to things that
              won&apos;t earn their place. The result is a shop you can trust, season after season.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                ["Natural, traceable materials", "Linen, merino, stoneware and solid wood."],
                ["Fair, direct partnerships", "Small batches from makers we know by name."],
                ["Honest pricing, always", "No invented discounts or inflated compare-at prices."],
              ].map(([title, copy], index) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-bg text-[9px] font-semibold tabular-nums text-muted">
                    0{index + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-text">{title}</span>
                    <span className="mt-0.5 block text-[12px] leading-5 text-muted">{copy}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/info/about" className="group mt-7 inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline">
              Read our story <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shop py-14 md:py-20">
        <SectionHeading
          eyebrow="Loved by many"
          title="Best sellers"
          description="The pieces our customers come back for, in the colours they reach for first."
          href="/products?sort=popular"
          action="Shop best sellers"
        />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {bestSellers.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-shop pb-16">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101524] text-white shadow-[0_32px_80px_-50px_rgb(15_23_42/0.9)]">
          <div aria-hidden className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#fb7185]/10 blur-3xl" />
          <div className="relative grid gap-0 lg:grid-cols-[1.02fr_1fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12">
              <Badge tone="sale" className="w-fit border-transparent bg-[#fb7185]/15 text-[#fda4af]">The sale edit</Badge>
              <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.85rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
                Last season&apos;s favourites,
                <br />
                this season&apos;s prices.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                Up to 40% off a small selection of pieces. No code, no countdown clock — just a good reason to
                keep something out of landfill.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/products?category=sale" className={buttonStyles("primary", "md", "h-11 rounded-xl bg-white px-5 text-slate-900 hover:bg-white/90")}>
                  Shop the sale <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-[11px] text-white/50">{saleCategory?.productCount ?? saleProducts.length} pieces reduced</span>
              </div>
              <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-4 text-[11px] text-white/40">
                <PackageCheck className="h-3.5 w-3.5" /> Every piece checked by hand before it leaves the studio.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 sm:p-7 md:gap-4 md:p-8">
              {saleProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[11px] font-medium text-white/90">{product.title}</p>
                    <p className="mt-1 flex items-baseline gap-2 text-[11px]">
                      <span className="price-num font-semibold text-white">{formatINR(product.price)}</span>
                      {product.compareAtPrice ? <s className="text-white/35">{formatINR(product.compareAtPrice)}</s> : null}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40">
        <div className="container-shop py-14 md:py-20">
          <SectionHeading
            eyebrow="Word of mouth"
            title="Good things, said better."
            description="A few notes from people who bought something, lived with it, and came back to tell us."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-[0.72fr_2fr]">
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-bg p-6">
              <div>
                <p className="price-num text-[52px] font-semibold leading-none tracking-[-0.055em]">4.9</p>
                <div className="mt-2 flex items-center gap-2">
                  <MiniRating />
                  <span className="text-[11px] font-medium text-muted">out of 5</span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-muted">From 1,200+ verified reviews across the edit.</p>
              </div>
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-[11px] font-semibold text-text">97% would recommend us</p>
                <p className="mt-1 text-[10px] text-muted">To a friend, a sibling, or a very particular colleague.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <figure key={item.name} className="flex flex-col rounded-2xl border border-border bg-bg p-5">
                  <div className="flex items-center justify-between">
                    <MiniRating />
                    <Quote className="h-4 w-4 text-primary/30" />
                  </div>
                  <blockquote className="mt-4 flex-1 text-[12px] leading-6 text-text">&ldquo;{item.quote}&rdquo;</blockquote>
                  <figcaption className="mt-5 flex items-center gap-2.5 border-t border-border pt-4">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-semibold ${item.tint}`}>{item.initial}</span>
                    <span>
                      <span className="block text-[11px] font-semibold">{item.name}</span>
                      <span className="block text-[10px] text-muted">{item.meta}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-bg px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-success/10 text-success">
                <PackageCheck className="h-4 w-4" />
              </span>
              <p className="text-[12px]">
                <span className="font-semibold">Every order is checked by hand.</span>{" "}
                <span className="text-muted">Free returns within 7 days, no questions asked.</span>
              </p>
            </div>
            <Link href="/info/returns" className="shrink-0 text-[11px] font-semibold text-primary hover:underline">Our returns promise</Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "ShopSphere",
            url: "https://shopsphere.in",
            description: "Considered pieces for everyday life.",
            sameAs: [],
          }),
        }}
      />
    </>
  );
}
