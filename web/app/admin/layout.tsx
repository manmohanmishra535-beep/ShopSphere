import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getCurrentUser } from "@/lib/api";

export const metadata: Metadata = {
  title: {
    default: "Overview",
    template: "%s · ShopSphere Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-surface/50">
      <AdminSidebar user={user} />
      <div className="lg:pl-[240px]">
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
