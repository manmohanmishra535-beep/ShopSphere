import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Profile",
  description: "Update your ShopSphere profile details.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div>
      <header>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em]">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your details, in one place.</p>
      </header>
      <div className="mt-6">
        {user ? <ProfileForm user={user} /> : null}
      </div>
    </div>
  );
}
