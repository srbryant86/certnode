import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootRedirect() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
