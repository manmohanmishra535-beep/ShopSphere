import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
