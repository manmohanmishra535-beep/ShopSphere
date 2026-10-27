import { getCategories } from "@/lib/api";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return <ProductForm categories={categories} />;
}
