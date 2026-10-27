import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { MobileTabBar } from "@/components/shop/mobile-tab-bar";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { StoreInitializer } from "@/components/shop/store-initializer";
import { getCategories, getCurrentUser } from "@/lib/api";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);

  return (
    <div className="flex min-h-screen flex-col">
      <StoreInitializer signedIn={Boolean(user)} />
      <Header user={user} categories={categories} />
      <main className="flex-1">{children}</main>
      <div className="pb-16 md:pb-0">
        <Footer />
      </div>
      <MobileTabBar user={user} />
      <CartDrawer />
    </div>
  );
}
