import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db, products, brands, categories } from "@/db";

async function updateProduct(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await db
    .update(products)
    .set({
      name: String(formData.get("name")),
      brandSlug: String(formData.get("brandSlug")),
      categorySlug: String(formData.get("categorySlug")),
      priceCents: Math.round(parseFloat(String(formData.get("price"))) * 100),
      stockQty: parseInt(String(formData.get("stockQty")), 10) || 0,
      inStock: formData.get("inStock") === "on",
      shortDescription: String(formData.get("shortDescription")),
      description: String(formData.get("description")),
      imageUrl: String(formData.get("imageUrl") || ""),
    })
    .where(eq(products.id, id));
  redirect("/admin/products");
}

async function deleteProduct(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await db.delete(products).where(eq(products.id, id));
  redirect("/admin/products");
}

export default async function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) notFound();
  const allBrands = await db.select().from(brands);
  const allCats = await db.select().from(categories);

  return (
    <div>
      <h1 className="text-3xl font-bold text-ink">Edit Product</h1>
      <form action={updateProduct} className="card-surface mt-6 grid gap-4 p-6 lg:grid-cols-2">
        <input type="hidden" name="id" value={p.id} />
        <Field label="Name" full><Input name="name" defaultValue={p.name} required /></Field>
        <Field label="Brand">
          <select name="brandSlug" defaultValue={p.brandSlug} className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
            {allBrands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select name="categorySlug" defaultValue={p.categorySlug} className="h-10 w-full rounded-md border border-black/10 bg-bg-panel px-3 text-sm text-ink">
            {allCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Price (USD)"><Input name="price" type="number" step="0.01" defaultValue={(p.priceCents / 100).toFixed(2)} required /></Field>
        <Field label="Stock quantity"><Input name="stockQty" type="number" defaultValue={p.stockQty} /></Field>
        <Field label="Image URL" full><Input name="imageUrl" defaultValue={p.imageUrl ?? ""} /></Field>
        <Field label="Short description" full><Input name="shortDescription" defaultValue={p.shortDescription} /></Field>
        <Field label="Description" full><Textarea name="description" rows={6} defaultValue={p.description} /></Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="inStock" defaultChecked={p.inStock} className="size-4 rounded border-black/15 bg-bg-panel" /> In stock
        </label>
        <div className="lg:col-span-2 flex justify-between gap-3">
          <Button type="submit">Save Changes</Button>
          <Button type="submit" variant="destructive" formAction={deleteProduct}>Delete</Button>
        </div>
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
