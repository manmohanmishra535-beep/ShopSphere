import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { infoPages, infoSlugs, type InfoSection } from "@/lib/info-content";
import { ContactForm } from "@/components/shop/contact-form";

export function generateStaticParams() {
  return infoSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = infoPages[slug];
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.intro,
  };
}

function anchor(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function Section({ section, index }: { section: InfoSection; index: number }) {
  return (
    <section id={anchor(section.heading)} className="scroll-mt-28 border-t border-border pt-8 first:border-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-[-0.02em]">
        <span className="mr-2 text-sm font-medium text-muted/70">{String(index + 1).padStart(2, "0")}</span>
        {section.heading}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 24)} className="mt-3 text-sm leading-7 text-muted">
          {paragraph}
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-4 space-y-2">
          {section.bullets.map((bullet) => (
            <li key={bullet.slice(0, 24)} className="flex gap-2.5 text-sm leading-6 text-muted">
              <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/70 text-left">
                {section.table.head.map((cell) => (
                  <th key={cell} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.join("-")} className="border-b border-border last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={cellIndex === 0 ? "px-4 py-2.5 font-medium text-text" : "px-4 py-2.5 text-muted"}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = infoPages[slug];
  if (!page) notFound();

  const contact = slug === "contact";

  return (
    <div className="container-shop py-8 md:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-text">Home</Link>
        <span aria-hidden>/</span>
        <span>{page.eyebrow}</span>
        <span aria-hidden>/</span>
        <span className="text-text">{page.title}</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.04em] sm:text-[40px]">{page.title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">{page.intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[236px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="eyebrow">On this page</p>
            <ul className="mt-3 space-y-1 border-l border-border">
              {page.sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${anchor(section.heading)}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-3 text-[13px] text-muted transition-colors hover:border-primary hover:text-text"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-[13px] font-semibold">Still need help?</p>
              <p className="mt-1 text-xs leading-5 text-muted">Our team replies within a working day.</p>
              <a href="mailto:help@shopsphere.in" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" /> help@shopsphere.in
              </a>
            </div>
          </div>
        </aside>

        <article className="min-w-0 max-w-[740px]">
          {contact ? (
            <div className="mb-10">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Mail, label: "Email", value: "help@shopsphere.in" },
                  { icon: Phone, label: "Phone", value: "+91 80 4567 1200" },
                  { icon: Clock3, label: "Hours", value: "Mon–Sat, 10am–6pm" },
                ].map((channel) => (
                  <div key={channel.label} className="rounded-xl border border-border p-4">
                    <channel.icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">{channel.label}</p>
                    <p className="mt-0.5 text-[13px] font-medium">{channel.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-border bg-surface/40 p-5 sm:p-6">
                <h2 className="text-base font-semibold">Send us a message</h2>
                <p className="mb-4 mt-1 text-xs text-muted">We read every note and reply personally.</p>
                <ContactForm />
              </div>
            </div>
          ) : null}

          <div className="space-y-8">
            {page.sections.map((section, index) => (
              <Section key={section.heading} section={section} index={index} />
            ))}
          </div>

          {page.note ? (
            <div className="mt-10 flex gap-3 rounded-xl border border-border bg-surface/60 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-muted">{page.note}</p>
            </div>
          ) : null}

          <div className="mt-10 border-t border-border pt-6">
            <Link href="/info/contact" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Contact support
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
