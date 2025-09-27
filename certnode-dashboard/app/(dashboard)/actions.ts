"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}
