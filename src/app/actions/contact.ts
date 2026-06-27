"use server";
import { redirect } from "next/navigation";

export async function submitContactForm(formData: FormData) {
  // In production, send to email/CRM/Slack here.
  // For now we log server-side and redirect to a thank-you state.
  const payload = Object.fromEntries(formData.entries());
  console.log("[contact]", payload);
  redirect("/contact?sent=1");
}
