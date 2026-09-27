"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(passphrase: string) {
  if (passphrase === process.env.ADMIN_PASSPHRASE) {
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