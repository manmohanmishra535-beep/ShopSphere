import Link from "next/link";
import { ArrowLeft, BadgeCheck, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";

const perks = [
  { icon: PackageCheck, title: "Orders that follow you", copy: "Track every parcel from packing to your doorstep." },
  { icon: BadgeCheck, title: "Verified reviews", copy: "Honest notes from customers who actually bought." },
  { icon: ShieldCheck, title: "Saved addresses", copy: "Check out in seconds with details kept safe." },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#0b1020] text-white lg:flex lg:flex-col">
        <img
          src="/art/editorial.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] via-[#0b1020]/70 to-[#312e81]/60" />
        <div className="relative z-10 flex flex-1 flex-col p-10 xl:p-14">
          <Link href="/" className="inline-flex w-fit items-center gap-2.5" aria-label="ShopSphere home">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8.5" />
                <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
                <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-xl font-semibold tracking-[-0.03em]">
              Shop<span className="text-[#a5b4fc]">Sphere</span>
            </span>
          </Link>

          <div className="mt-auto max-w-md">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              <Sparkles className="h-3 w-3 text-[#a5b4fc]" /> Members get more
            </p>
            <p className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] xl:text-[40px]">
              A quieter way to shop the things you&apos;ll keep.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              Save favourites, revisit past orders and pick up where you left off — on any device.
            </p>

            <ul className="mt-10 space-y-5">
              {perks.map((perk) => (
                <li key={perk.title} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <perk.icon className="h-4 w-4 text-[#c7d2fe]" strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{perk.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-white/55">{perk.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-12 text-[11px] text-white/40">© 2026 ShopSphere · Designed in India</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5 lg:invisible" aria-label="ShopSphere home">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8.5" />
                <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
                <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-[-0.03em]">
              Shop<span className="text-primary">Sphere</span>
            </span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
          </Link>
        </div>

        <main className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
