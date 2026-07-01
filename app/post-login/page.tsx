import { auth } from "@/auth";
import { getAbsoluteDashboardRouteForRole } from "@/lib/role-redirect";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSafeRedirectUrl } from "@/lib/security/origin";

export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.isActive || session.user.sessionRevoked) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const originCallbackUrl = resolvedParams.callbackUrl;

  // If user is a CLIENTE and has an origin callback URL, redirect them back to it
  if (session.user.role === "CLIENTE" && originCallbackUrl) {
    redirect(getSafeRedirectUrl(originCallbackUrl, "/cliente"));
  }

  const headersList = await headers();
  const host = headersList.get("host") || "starfeetoficial.com";

  redirect(getAbsoluteDashboardRouteForRole(session.user.role, host));
}
