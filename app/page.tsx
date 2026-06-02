import { redirect } from "next/navigation";

export default function RootPage() {
  const landingUrl = process.env.LANDING_URL || "https://dev.starfeet.ar";
  redirect(landingUrl);
}
