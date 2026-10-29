"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Plus, Save, Trash2, Upload } from "lucide-react";
import type { AdminProduct, Category } from "@/lib/types";
import { api, ClientApiError, errorMessage } from "@/lib/client";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatINR, slugify } from "@/lib/format";

interface VariantRow {
  sku: string;
  optionsText: string;
  price: string;
  stock: string;
  threshold: string;
}

interface MediaSignature {
  provider: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  uploadPreset?: string;
  signature: string;
  uploadUrl: string;
  constraints: { formats: string[]; maxBytes: number };
  note?: string;
}

const uploadTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

async function compressForDemo(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1000;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return readAsDataUrl(file);
  }
}

function toRupees(paise: number | null | undefined) {
  return paise ? String(paise / 100) : "";
}

function parseOptions(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of text.split(/[;,]/)) {
    const [rawKey, ...rest] = part.split("=");
    const key = rawKey?.trim();
    const value = rest.join("=").trim();
    if (key && value) result[key] = value;
  }
  return result;
}

function optionsToText(options: Record<string, string>) {
  return Object.entries(options)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

export function ProductForm({ product, categories }: { product?: AdminProduct; categories: Category[] }) {
  const router = useRouter();
  const flat = useMemo(() => {
    const rows: { id: string; label: string }[] = [];
    const walk = (items: Category[], depth: number) => {
      for (const category of items) {
        rows.push({ id: category.id, label: `${"— ".repeat(depth)}${category.name}` });
        if (category.children?.length) walk(category.children, depth + 1);
      }
    };
    walk(categories, 0);
    return rows;
  }, [categories]);

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? flat.find((row) => !row.label.startsWith("—"))?.id ?? "");
  const [status, setStatus] = useState<"draft" | "active" | "archived">(product?.status ?? "draft");
  const [price, setPrice] = useState(toRupees(product?.price));
  const [compareAt, setCompareAt] = useState(toRupees(product?.compareAtPrice));
  const [description, setDescription] = useState(product?.description ?? "");
  const [tags, setTags] = useState(product?.tags.join(", ") ?? "");
  const initialImages = product?.images.map((image) => image.url) ?? [];
  const [imagesText, setImagesText] = useState(() =>
    initialImages.filter((url) => !url.startsWith("data:")).join("\n")
  );
  const [uploadedImages, setUploadedImages] = useState<string[]>(() =>
    initialImages.filter((url) => url.startsWith("data:"))
  );
  const [imagePublicIds, setImagePublicIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (product?.images ?? [])
        .filter((image) => image.publicId)
        .map((image) => [image.url, image.publicId!])
    )
  );
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>(
    Object.entries(product?.attributes ?? { material: "", care: "" }).map(([key, value]) => ({ key, value })) || []
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((variant) => ({
      sku: variant.sku,
      optionsText: optionsToText(variant.options),
      price: toRupees(variant.price),
      stock: String(variant.stock),
      threshold: String(variant.lowStockThreshold),
    })) ?? [{ sku: "", optionsText: "Size=M", price: "", stock: "0", threshold: "5" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textImageUrls = imagesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const imageUrls = [...textImageUrls, ...uploadedImages];
  const imagesPayload = [
    ...textImageUrls.map((url) => {
      const publicId = imagePublicIds[url];
      return publicId ? { url, alt: title.trim() || "Product image", publicId } : url;
    }),
    ...uploadedImages,
  ];

  const updateVariant = <K extends keyof VariantRow>(index: number, key: K, value: VariantRow[K]) => {
    setVariants((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const updateAttribute = (index: number, key: "key" | "value", value: string) => {
    setAttributes((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const fillArtwork = () => {
    const base = slug || slugify(title || "product");
    setImagesText([`/products/${base}-1.svg`, `/products/${base}-2.svg`, `/products/${base}-3.svg`].join("\n"));
    setUploadedImages([]);
    setImagePublicIds({});
    setUploadError("");
    setUploadNote("");
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadNote("");
    setUploading(true);
    try {
      const signature = await api<MediaSignature>("/media/sign", {
        method: "POST",
        body: { folder: "shopsphere/products" },
      });

      if (!uploadTypes.includes(file.type)) {
        throw new Error("Choose a JPG, PNG, WebP or AVIF image.");
      }
      if (file.size > signature.constraints.maxBytes) {
        throw new Error(`Image must be smaller than ${Math.round(signature.constraints.maxBytes / 1024 / 1024)} MB.`);
      }

      if (signature.provider === "cloudinary-demo") {
        const dataUrl = await compressForDemo(file);
        if (dataUrl.length > 900_000) {
          throw new Error("That image is still too large after compression. Try a smaller file.");
        }
        setUploadedImages((current) => [...current, dataUrl]);
        setUploadNote("Demo mode: the image is compressed and embedded with the product. Configure Cloudinary for hosted uploads.");
        toast.success("Image added", "Demo mode stores the image with the product.");
        return;
      }

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("folder", signature.folder);
      body.append("signature", signature.signature);
      if (signature.uploadPreset) body.append("upload_preset", signature.uploadPreset);

      const response = await fetch(signature.uploadUrl, { method: "POST", body });
      const result = (await response.json().catch(() => null)) as
        | { secure_url?: string; url?: string; public_id?: string; error?: { message?: string } }
        | null;
      if (!response.ok) throw new Error(result?.error?.message ?? "Cloudinary upload failed.");
      const url = result?.secure_url ?? result?.url;
      if (!url) throw new Error("Cloudinary did not return an image URL.");

      setImagesText((current) =>
        [...current.split("\n").map((line) => line.trim()).filter(Boolean), url].join("\n")
      );
      if (result?.public_id) {
        setImagePublicIds((current) => ({ ...current, [url]: result.public_id! }));
      }
      setUploadNote("Uploaded to Cloudinary.");
      toast.success("Image uploaded");
    } catch (err) {
      const message = errorMessage(err);
      setUploadError(message);
      toast.error("Image upload failed", message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!categoryId) {
      setError("Choose a category for this product.");
      return;
    }
    if (variants.some((variant) => !variant.sku.trim())) {
      setError("Every variant needs a SKU.");
      return;
    }
    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      brand: brand.trim(),
      categoryId,
      status,
      price: Math.round(Number(price) * 100),
      compareAtPrice: compareAt.trim() ? Math.round(Number(compareAt) * 100) : null,
      description: description.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      images: imagesPayload,
      attributes: Object.fromEntries(attributes.filter((row) => row.key.trim() && row.value.trim()).map((row) => [row.key.trim(), row.value.trim()])),
      variants: variants.map((variant) => ({
        sku: variant.sku.trim(),
        options: parseOptions(variant.optionsText),
        price: variant.price.trim() ? Math.round(Number(variant.price) * 100) : undefined,
        stock: Math.max(0, Number(variant.stock) || 0),
        lowStockThreshold: Math.max(0, Number(variant.threshold) || 0),
      })),
    };

    if (!Number.isFinite(payload.price) || payload.price <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    setSaving(true);
    try {
      if (product) {
        await api(`/products/${product.id}`, { method: "PATCH", body: payload });
        toast.success("Product saved", "Your changes are live.");
      } else {
        const data = await api<{ product: { id: string } }>("/products", { method: "POST", body: payload });
        toast.success("Product created", "You can add more detail any time.");
        router.push(`/admin/products/${data.product.id}`);
        router.refresh();
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.details.length) {
        setError(err.details.map((detail) => (typeof detail === "string" ? detail : JSON.stringify(detail))).join(" · "));
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const preview = imageUrls[0];

  return (
    <form id="product-form" onSubmit={submit}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-text">
            <ArrowLeft className="h-3.5 w-3.5" /> Products
          </Link>
          <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.03em] sm:text-[28px]">
            {product ? "Edit product" : "New product"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {product ? `Last updated ${new Date(product.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Add the essentials now — refine later."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className={buttonStyles("outline", "sm")}>Cancel</Link>
          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-4 w-4" /> {product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2.5 text-xs text-danger" role="alert">{error}</p>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Basics</h2>
            <div className="mt-4 space-y-4">
              <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={160} placeholder="Linen shirt" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="URL slug"
                  hint="Leave blank to generate from the title."
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="linen-shirt"
                />
                <Input label="Brand" value={brand} onChange={(event) => setBrand(event.target.value)} required placeholder="ShopSphere Studio" />
              </div>
              <Textarea
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                minLength={10}
                rows={5}
                placeholder="What makes this piece worth keeping?"
              />
              <Input
                label="Tags"
                hint="Comma separated. Use “new” or “bestseller” to control storefront badges."
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="new, linen, summer"
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Images</h2>
                <p className="text-[11px] text-muted">One URL per line. The first image is the card image; the second shows on hover.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={fillArtwork}>
                  <ImagePlus className="h-3.5 w-3.5" /> Use artwork
                </Button>
              </div>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_130px]">
              <Textarea
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                rows={5}
                placeholder={"/products/linen-shirt-1.svg\n/products/linen-shirt-2.svg"}
                className="font-mono text-xs"
              />
              <div className="overflow-hidden rounded-lg border border-dashed border-border bg-surface checker">
                {preview ? (
                  <img src={preview} alt="Product preview" className="aspect-[4/5] h-full w-full object-cover" />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center text-center text-[10px] text-muted">4:5 preview</div>
                )}
              </div>
            </div>
            {uploadedImages.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedImages.map((url, index) => (
                  <div
                    key={`${index}-${url.slice(0, 24)}`}
                    className="group relative h-20 w-16 overflow-hidden rounded-lg border border-border bg-surface"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImages((current) => current.filter((_, i) => i !== index));
                        setUploadNote("");
                        setUploadError("");
                      }}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Remove uploaded image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-[10px] leading-4 text-muted">
              JPG, PNG, WebP or AVIF, up to 5 MB.{" "}
              {uploadNote || "Uploads are hosted on Cloudinary when configured; demo mode embeds a compressed copy."}
            </p>
            {uploadError ? (
              <p className="mt-1 text-[11px] text-danger" role="alert">{uploadError}</p>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Variants</h2>
                <p className="text-[11px] text-muted">Each variant tracks its own stock. Options use the format Colour=Indigo; Size=M.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((current) => [...current, { sku: "", optionsText: "", price: "", stock: "0", threshold: "5" }])}
              >
                <Plus className="h-3.5 w-3.5" /> Add variant
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="rounded-lg border border-border bg-surface/40 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="SKU" value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} required placeholder="SS-LIN-M" />
                    <Input
                      label="Options"
                      value={variant.optionsText}
                      onChange={(event) => updateVariant(index, "optionsText", event.target.value)}
                      placeholder="Colour=Indigo; Size=M"
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <Input label="Price (₹)" type="number" min="0" step="1" value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} placeholder={price || "0"} />
                    <Input label="On hand" type="number" min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} />
                    <Input label="Low stock at" type="number" min="0" step="1" value={variant.threshold} onChange={(event) => updateVariant(index, "threshold", event.target.value)} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(parseOptions(variant.optionsText)).map(([key, value]) => (
                        <Badge key={key} tone="neutral">{key}: {value}</Badge>
                      ))}
                    </div>
                    {variants.length > 1 ? (
                      <Button type="button" variant="ghost" size="sm" className="text-muted hover:text-danger" onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Attributes</h2>
                <p className="text-[11px] text-muted">Shown in the product accordion, e.g. Material = 100% linen.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setAttributes((current) => [...current, { key: "", value: "" }])}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {attributes.length === 0 ? <p className="text-xs text-muted">No attributes yet.</p> : null}
              {attributes.map((row, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Input label="Attribute" value={row.key} onChange={(event) => updateAttribute(index, "key", event.target.value)} placeholder="Material" />
                  <Input label="Value" value={row.value} onChange={(event) => updateAttribute(index, "value", event.target.value)} placeholder="100% linen" />
                  <Button type="button" variant="ghost" size="icon" className="mb-0.5 text-muted hover:text-danger" onClick={() => setAttributes((current) => current.filter((_, i) => i !== index))} aria-label="Remove attribute">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Publishing</h2>
            <div className="mt-3 space-y-3.5">
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                <option value="draft">Draft — hidden</option>
                <option value="active">Active — on sale</option>
                <option value="archived">Archived</option>
              </Select>
              <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
                <option value="">Choose a category</option>
                {flat.map((row) => (
                  <option key={row.id} value={row.id}>{row.label}</option>
                ))}
              </Select>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Pricing</h2>
            <div className="mt-3 space-y-3.5">
              <Input
                label="Price (₹)"
                type="number"
                min="1"
                step="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                prefix="₹"
              />
              <Input
                label="Compare at (₹)"
                hint="Optional. Shows a strike-through and discount badge."
                type="number"
                min="0"
                step="1"
                value={compareAt}
                onChange={(event) => setCompareAt(event.target.value)}
                prefix="₹"
              />
              {Number(compareAt) > Number(price) && Number(price) > 0 ? (
                <p className="rounded-md bg-sale/10 px-2.5 py-1.5 text-[11px] font-medium text-sale">
                  {Math.round(((Number(compareAt) - Number(price)) / Number(compareAt)) * 100)}% off · customer pays {formatINR(Number(price) * 100)}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Summary</h2>
            <div className="mt-3 flex gap-3">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface checker">
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-medium">{title || "Untitled product"}</p>
                <p className="mt-0.5 text-[11px] text-muted">{brand || "No brand"}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="price-num text-[13px] font-semibold">{price ? formatINR(Number(price) * 100) : "₹—"}</span>
                  <Badge tone={status === "active" ? "success" : status === "draft" ? "warning" : "neutral"}>{status}</Badge>
                </div>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11px]">
              <div className="flex justify-between"><dt className="text-muted">Variants</dt><dd>{variants.length}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Total stock</dt><dd>{variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Images</dt><dd>{imageUrls.length}</dd></div>
            </dl>
            <p className="mt-3 text-[10px] leading-4 text-muted">Stock changes made here overwrite on-hand counts. Use Inventory for audit-friendly adjustments.</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
