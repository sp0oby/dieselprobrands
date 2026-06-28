"use server";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartQuantity, applyPromoCode, removePromoCode, setShippingMethod } from "@/lib/cart";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CartActionResult = { ok: true } | { ok: false; error: string };

export async function addToCartAction(productId: string, quantity = 1): Promise<CartActionResult> {
  if (!UUID_RE.test(productId)) return { ok: false, error: "Invalid product." };
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return { ok: false, error: "Invalid quantity." };
  try {
    await addToCart(productId, quantity);
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    console.error("addToCartAction failed:", e);
    return { ok: false, error: "Couldn't add to cart. Please try again." };
  }
}

export async function updateCartAction(productId: string, quantity: number): Promise<CartActionResult> {
  if (!UUID_RE.test(productId)) return { ok: false, error: "Invalid product." };
  try {
    await updateCartQuantity(productId, quantity);
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    console.error("updateCartAction failed:", e);
    return { ok: false, error: "Couldn't update cart." };
  }
}

export async function removeFromCartAction(productId: string): Promise<CartActionResult> {
  if (!UUID_RE.test(productId)) return { ok: false, error: "Invalid product." };
  try {
    await removeFromCart(productId);
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true };
  } catch (e) {
    console.error("removeFromCartAction failed:", e);
    return { ok: false, error: "Couldn't remove from cart." };
  }
}

export async function applyPromoAction(code: string) {
  const res = await applyPromoCode(code);
  revalidatePath("/cart");
  return res;
}

export async function removePromoAction() {
  await removePromoCode();
  revalidatePath("/cart");
}

export async function setShippingMethodAction(slug: string) {
  await setShippingMethod(slug);
  revalidatePath("/cart");
}
