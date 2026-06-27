"use server";
import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, updateCartQuantity, applyPromoCode, removePromoCode, setShippingMethod } from "@/lib/cart";

export async function addToCartAction(productId: string, quantity = 1) {
  await addToCart(productId, quantity);
  revalidatePath("/", "layout");
  revalidatePath("/cart");
}

export async function updateCartAction(productId: string, quantity: number) {
  await updateCartQuantity(productId, quantity);
  revalidatePath("/", "layout");
  revalidatePath("/cart");
}

export async function removeFromCartAction(productId: string) {
  await removeFromCart(productId);
  revalidatePath("/", "layout");
  revalidatePath("/cart");
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
