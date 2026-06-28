import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db, products, brands, categories } from "@/db";
import { slugify } from "@/lib/utils";
import { assertAdmin } from "@/lib/admin";

async function createProduct(formData: FormData) {
  "use server";
  await assertAdmin();
  const sku = String(formData.get("sku"));
  const name = String(formData.get("name"));
  await db.insert(products).values({
    sku,
    slug: `${slugify(name)}-${sku.toLowerCase()}`,
    name,
    brandSlug: String(formData.get("brandSlug")),
    categorySlug: String(formData.get("categorySlug")),
    priceCents: Math.round(parseFloat(String(formData.get("price"))) * 100),
    stockQty: parseInt(String(formData.get("stockQty")), 10) || 0,
    inStock: formData.get("inStock") === "on",
    shortDescription: String(formData.get("shortDescription")),
    description: String(formData.get("description")),
    imageUrl: String(formData.get("imageUrl") || ""),
    specs: {},
    rating: "4.5",
    reviewCount: 0,
  });
  redirect("/admin/products");
}

export default async function AdminProductNew() {
  const allBrands = await db.select().from(brands);
  const allCats = await db.select().from(categories);
  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">New Product</h1>
      <form action={createProduct} className="card-surface mt-6 grid gap-4 p-6 lg:grid-cols-2">
        <Field label="Name" full><Input name="name" required /></Field>
        <Field label="SKU"><Input name="sku" required /></Field>
        <Field label="Price (USD)"><Input name="price" type="number" step="0.01" required /></Field>
        <Field label="Brand">
          <select name="brandSlug" className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
            {allBrands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select name="categorySlug" className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
            {allCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Stock quantity"><Input name="stockQty" type="number" defaultValue={0} /></Field>
        <Field label="Image URL" full><Input name="imageUrl" placeholder="https://..." /></Field>
        <Field label="Short description" full><Input name="shortDescription" /></Field>
        <Field label="Description" full><Textarea name="description" rows={6} /></Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="inStock" defaultChecked className="size-4 rounded border-black/15 bg-bg-panel" /> In stock
        </label>
        <div className="lg:col-span-2"><Button type="submit">Create Product</Button></div>
      </form>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-2 ${full ? "lg:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
