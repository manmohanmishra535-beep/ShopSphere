import Link from "next/link";
import { Instagram, Mail, ShieldCheck } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

const shopLinks = [
  { label: "New arrivals", href: "/products?sort=newest" },
  { label: "Best sellers", href: "/products?sort=popular" },
  { label: "Women", href: "/products?category=women" },
  { label: "Men", href: "/products?category=men" },
  { label: "Home & living", href: "/products?category=home" },
  { label: "Sale", href: "/products?category=sale" },
];

const helpLinks = [
  { label: "Shipping & delivery", href: "/info/shipping" },
  { label: "Returns & exchanges", href: "/info/returns" },
  { label: "Size guide", href: "/info/size-guide" },
  { label: "Track your order", href: "/account/orders" },
  { label: "Contact us", href: "/info/contact" },
  { label: "FAQs", href: "/info/faq" },
];

const companyLinks = [
  { label: "Our story", href: "/info/about" },
  { label: "Journal", href: "/info/journal" },
  { label: "Careers", href: "/info/careers" },
  { label: "Privacy policy", href: "/info/privacy" },
  { label: "Terms of service", href: "/info/terms" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface/60">
      <div className="container-shop">
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ShopSphere home">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="8.5" />
                  <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
                  <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-[19px] font-semibold tracking-[-0.03em]">
                Shop<span className="text-primary">Sphere</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              Considered pieces for everyday life. Designed in India, made to be kept.
            </p>
            <div className="mt-6">
              <p className="text-[13px] font-medium text-text">Good things, occasionally.</p>
              <p className="mb-3 mt-1 text-xs text-muted">New arrivals and stories. No noise.</p>
              <NewsletterForm />
            </div>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Shop</h3>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-text">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Help</h3>
            <ul className="space-y-2.5">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-text">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-text">{link.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-xs text-muted">
              <a href="mailto:help@shopsphere.in" className="flex items-center gap-2 hover:text-text">
                <Mail className="h-3.5 w-3.5" /> help@shopsphere.in
              </a>
              <p className="flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5" /> @shopsphere.in
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© 2026 ShopSphere. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            {["UPI", "Visa", "Mastercard", "RuPay", "Netbanking"].map((method) => (
              <span key={method} className="rounded border border-border bg-bg px-2 py-1 text-[10px] font-medium text-muted">{method}</span>
            ))}
            <span className="ml-1 flex items-center gap-1 text-[10px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Secure checkout
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
