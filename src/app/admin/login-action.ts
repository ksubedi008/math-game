"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const passphrase = formData.get("passphrase")?.toString();

  if (passphrase && passphrase === process.env.ADMIN_PASSPHRASE) {
    const cookieStore = await cookies();
    
    cookieStore.set("admin_auth", passphrase, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    redirect("/admin");
  }

  return { error: "Invalid passphrase" };
}

// Alias export to satisfy admin-login.tsx
export const loginAdmin = loginAction;