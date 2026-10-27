import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { getHome } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/format";
import { ProductCard } from "@/components/shop/product-card";
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
  },
  {
    quote: "Ordered on Tuesday, wearing it on Thursday. The packaging was lovely and nothing went to waste.",
    name: "Rahul M.",
    meta: "Verified buyer · Bengaluru",
  },
  {
    quote: "Finally, a store where the photos match what arrives. The cashmere cardigan is genuinely special.",
    name: "Priya K.",
    meta: "Verified buyer · Pune",
  },
];

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

  return (
    <>
      <section className="border-b border-border">
        <div className="container-shop">
          <div className="grid items-stretch gap-6 py-8 md:gap-8 md:py-12 lg:grid-cols-[1.02fr_1fr] lg:py-14">
            <div className="flex flex-col justify-center py-2 lg:pr-8">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                  <Sparkles className="h-3 w-3 text-primary" /> The autumn edit · 2026
                </span>
              </div>
              <h1 className="mt-5 text-[clamp(2.6rem,6.5vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.045em]">
                Fewer,
                <br />
                <span className="text-primary">better</span> things.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-7 text-muted">
                A tight edit of clothing and objects made to be lived in. Natural materials, honest prices and
                nothing that needs replacing next season.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/products?sort=newest" className={buttonStyles("primary", "lg", "group")}>
                  Shop new arrivals
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/products?category=sale" className={buttonStyles("outline", "lg")}>
                  Explore the sale
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 border-t border-border pt-5 text-xs text-muted">
                <span><strong className="text-text">{formatNumber(stats.products)}</strong> considered pieces</span>
                <span className="h-3 w-px bg-border" />
                <span><strong className="text-text">{formatNumber(stats.happyCustomers)}+</strong> happy homes</span>
              </div>
            </div>

            <div className="relative min-h-[380px] overflow-hidden rounded-2xl bg-surface md:min-h-[520px]">
              <img src="/art/hero.svg" alt="The ShopSphere autumn edit" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-900 backdrop-blur">
                  New season
                </span>
              </div>
              <Link
                href={`/products/${hero.slug}`}
                className="group absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-white/20 bg-white/92 p-3 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-0.5 sm:right-auto sm:max-w-[300px]"
              >
                <img src={hero.images[0]?.url} alt="" className="h-14 w-12 rounded-md object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">{hero.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{formatINR(hero.price)}</span>
                    {hero.compareAtPrice ? <s>{formatINR(hero.compareAtPrice)}</s> : null}
                  </span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-center gap-3 bg-bg px-4 py-4">
                <item.icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
                <div>
                  <p className="text-[13px] font-medium leading-tight">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shop py-14 md:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Find your corner</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">Shop by category</h2>
          </div>
          <Link href="/products" className="group flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-text">
            All categories <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {displayCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface"
            >
              <img
                src={`/categories/${category.slug}.svg`}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                <p className="text-sm font-semibold tracking-[-0.01em]">{category.name}</p>
                <p className="mt-0.5 text-[11px] text-white/70">{category.productCount ?? 0} pieces</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-shop pb-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Just landed</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">New arrivals</h2>
          </div>
          <Link href="/products?sort=newest" className="group flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-text">
            View all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {newArrivals.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/60">
        <div className="container-shop grid items-center gap-8 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-surface">
            <img src="/art/editorial.svg" alt="Inside the ShopSphere studio" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/92 px-3 py-2 text-[11px] font-medium text-slate-900 backdrop-blur">
              The studio, 2026
            </div>
          </div>
          <div>
            <p className="eyebrow">Why ShopSphere</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.025em] md:text-[32px]">
              Made with intent.<br />Chosen to last.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              We work with a small number of makers, order in considered quantities and say no to things that
              won&apos;t earn their place. The result is a shop you can trust, season after season.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                ["Natural, traceable materials", "Linen, merino, stoneware and solid wood."],
                ["Fair, direct partnerships", "Small batches from makers we know by name."],
                ["Honest pricing, always", "No invented discounts or inflated compare-at prices."],
              ].map(([title, copy]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary">
                    <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-text">{title}</span>
                    <span className="block text-[13px] text-muted">{copy}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/info/about" className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Read our story <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shop py-14 md:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Loved by many</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] md:text-[28px]">Best sellers</h2>
          </div>
          <Link href="/products?sort=popular" className="group flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-text">
            Shop best sellers <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {bestSellers.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container-shop pb-16">
        <div className="overflow-hidden rounded-2xl border border-border bg-[#111827] text-white">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col justify-center p-8 md:p-12">
              <Badge tone="sale" className="w-fit border-transparent bg-[#fb7185]/15 text-[#fda4af]">The sale edit</Badge>
              <h2 className="mt-4 text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
                Last season&apos;s favourites,<br />this season&apos;s prices.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                Up to 40% off a small selection of pieces. When they&apos;re gone, they&apos;re gone.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/products?category=sale" className={buttonStyles("primary", "md", "bg-white text-slate-900 hover:bg-white/90")}>
                  Shop the sale <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-white/50">{saleCategory?.productCount ?? editorsPicks.length} pieces reduced</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 md:gap-4 md:p-8">
              {editorsPicks.slice(0, 2).map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group block overflow-hidden rounded-xl bg-white/5">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium text-white/90">{product.title}</p>
                    <p className="mt-1 flex items-baseline gap-2 text-xs">
                      <span className="font-semibold text-white">{formatINR(product.price)}</span>
                      {product.compareAtPrice ? <s className="text-white/40">{formatINR(product.compareAtPrice)}</s> : null}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface/40">
        <div className="container-shop py-14 md:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure key={item.name} className="rounded-xl border border-border bg-bg p-6">
                <div className="flex gap-0.5 text-amber-500">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />)}
                </div>
                <blockquote className="mt-4 text-sm leading-6 text-text">&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-border pt-4">
                  <p className="text-[13px] font-medium">{item.name}</p>
                  <p className="text-[11px] text-muted">{item.meta}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-bg px-6 py-5 sm:flex-row">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-success" />
              <p className="text-sm">
                <span className="font-medium">Every order is checked by hand.</span>{" "}
                <span className="text-muted">Free returns within 7 days, no questions asked.</span>
              </p>
            </div>
            <Link href="/info/returns" className="shrink-0 text-[13px] font-medium text-primary hover:underline">Our returns promise</Link>
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
