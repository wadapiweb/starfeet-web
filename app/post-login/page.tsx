import { auth } from "@/auth";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const headersList = await headers();
  const host = headersList.get("host") || "starfeetoficial.com";

  redirect(getAbsoluteDashboardRouteForRole(session.user.role, host));
}

