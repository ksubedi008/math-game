"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAdmin(passphrase: string) {
  if (passphrase === process.env.ADMIN_PASSPHRASE) {
    cookies().set("admin_auth", passphrase, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  } else {
    throw new Error("Invalid passphrase");
  }
}
