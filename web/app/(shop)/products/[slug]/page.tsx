import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getCurrentUser, getProduct, getReviews } from "@/lib/api";
import { formatINR, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCart } from "@/components/shop/add-to-cart";
import { PinCheck } from "@/components/shop/pin-check";
import { ProductAccordions } from "@/components/shop/product-accordions";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { ProductCard } from "@/components/shop/product-card";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found" };
  const { product } = data;
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0]?.url ? [{ url: product.images[0].url }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, related } = data;
  const [reviews, user] = await Promise.all([getReviews(product.id), getCurrentUser()]);
  const totalAvailable = product.availableStock;
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);

  return (
    <div className="container-shop pb-24 pt-6 md:pb-10 md:pt-9">
      <nav className="flex flex-wrap items-center gap-1 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {product.category ? (
          <>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-text">{product.category.name}</Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="line-clamp-1 text-text">{product.title}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div>
          <ProductGallery images={product.images} title={product.title} />
          <div className="mt-3 hidden items-center justify-between text-[11px] text-muted md:flex">
            <span>Actual colours may vary slightly by screen.</span>
            <span>{product.images.length} views</span>
          </div>
        </div>

        <div className="lg:pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/products?brand=${encodeURIComponent(product.brand)}`} className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted hover:text-primary">
              {product.brand}
            </Link>
            {onSale ? <Badge tone="sale">Save {formatINR(product.compareAtPrice! - product.price)}</Badge> : null}
            {product.tags.includes("new") ? <Badge tone="primary">New in</Badge> : null}
          </div>

          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em] md:text-[34px]">{product.title}</h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href="#reviews" className="flex items-center gap-1.5 hover:opacity-80">
              <RatingStars value={product.ratingAvg} count={product.ratingCount} />
            </a>
            <span className="text-[11px] text-muted">·</span>
            <span className="text-[11px] text-muted">{formatNumber(product.sold)} sold</span>
            {totalAvailable > 0 && totalAvailable <= 10 ? (
              <span className="text-[11px] font-medium text-warning">Selling fast</span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="xl" showDiscount />
          </div>
          <p className="mt-1 text-[11px] text-muted">MRP inclusive of all taxes · Free shipping over ₹999</p>

          <div className="mt-6 border-t border-border pt-6">
            <AddToCart product={product} />
          </div>

          <div className="mt-5">
            <PinCheck />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, label: "Free over ₹999" },
              { icon: Sparkles, label: "Small-batch made" },
              { icon: ShieldCheck, label: "Secure payments" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border px-2 py-3">
                <item.icon className="mx-auto h-4 w-4 text-muted" strokeWidth={1.6} />
                <p className="mt-1.5 text-[10px] text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <ProductAccordions product={product} />
      </div>

      {reviews ? (
        <ReviewsSection
          productId={product.id}
          productName={product.title}
          initial={reviews}
          signedIn={Boolean(user)}
        />
      ) : null}

      {related.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="eyebrow">Complete the edit</p>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em]">You may also like</h2>
            </div>
            <Link href={`/products?category=${product.category?.slug ?? ""}`} className="text-[13px] font-medium text-muted hover:text-text">
              View more
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: product.images.map((image) => `https://shopsphere.in${image.url}`),
            description: product.description,
            brand: { "@type": "Brand", name: product.brand },
            sku: product.variants[0]?.sku,
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: (product.price / 100).toFixed(2),
              availability: totalAvailable > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `https://shopsphere.in/products/${product.slug}`,
            },
            aggregateRating:
              product.ratingCount > 0
                ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount }
                : undefined,
          }),
        }}
      />
    </div>
  );
}
