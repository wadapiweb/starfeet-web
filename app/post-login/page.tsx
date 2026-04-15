import { auth } from "@/auth";
import { getDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";

export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getDashboardRouteForRole(session.user.role));
}
