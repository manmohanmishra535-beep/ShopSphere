import { CreditCard, Database, Image as ImageIcon, Mail, Zap } from "lucide-react";
import { getSettings } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();

  const integrations: {
    icon: typeof Database;
    name: string;
    detail: string;
    status: string;
    tone: "neutral" | "primary" | "success" | "warning" | "danger" | "sale" | "info";
    note: string;
  }[] = [
    {
      icon: Database,
      name: "Database",
      detail: "JSON persistence at api/data/db.json",
      status: "Local file",
      tone: "info",
      note: "Swap for MongoDB by implementing the same repository calls.",
    },
    {
      icon: Zap,
      name: "Cache",
      detail: "In-memory TTL cache for catalogue reads",
      status: "In-process",
      tone: "info",
      note: "Replace with Redis in production for shared cache.",
    },
    {
      icon: CreditCard,
      name: "Payments",
      detail: "Mock UPI, cards, netbanking and wallets",
      status: settings.paymentKeysConfigured ? "Keys found" : "Mock mode",
      tone: settings.paymentKeysConfigured ? "success" : "warning",
      note: "Razorpay adapter is stubbed; verify + webhook routes are live.",
    },
    {
      icon: ImageIcon,
      name: "Media",
      detail: "Locally generated SVG artwork",
      status: "Local",
      tone: "neutral" as const,
      note: "Media signing endpoint is ready for Cloudinary.",
    },
    {
      icon: Mail,
      name: "Email",
      detail: "Order and stock emails log to the console",
      status: "Mock",
      tone: "neutral" as const,
      note: "Wire an SMTP or Resend provider in production.",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Store details, fulfilment rates and the integration points behind this demo."
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsForm settings={settings} />

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Integrations</h2>
            <p className="text-[11px] text-muted">This build runs entirely locally.</p>
            <ul className="mt-3 space-y-3">
              {integrations.map((item) => (
                <li key={item.name} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-muted">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-medium">{item.name}</p>
                      <Badge tone={item.tone}>{item.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted">{item.detail}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-muted/80">{item.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Reference</h2>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2"><dt className="text-muted">Order counter</dt><dd className="price-num">{settings.orderCounter}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Payment keys</dt><dd>{settings.paymentKeysConfigured ? "Configured" : "Not configured"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Tax rate</dt><dd>{settings.taxRatePercent}%</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Free shipping</dt><dd>₹{(settings.freeShippingThreshold / 100).toLocaleString("en-IN")}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-dashed border-border bg-surface/40 p-4">
            <h2 className="text-[12px] font-semibold">Production checklist</h2>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-muted">
              <li>· Move the data layer to MongoDB replicas.</li>
              <li>· Put Redis in front of catalogue reads.</li>
              <li>· Replace the mock payment provider with Razorpay.</li>
              <li>· Point media uploads at Cloudinary.</li>
              <li>· Rotate the JWT secret and set secure cookies.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
