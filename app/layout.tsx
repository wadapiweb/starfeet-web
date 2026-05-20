import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScrollProvider } from "../components/providers/SmoothScrollProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { Navbar } from "../components/organisms/Navbar";

const helvetica = localFont({
  src: [
    { path: './fonts/HelveticaLTStd-Roman.woff2', weight: '400', style: 'normal' },
    { path: './fonts/HelveticaLTStd-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-helvetica',
  display: 'swap',
});

const helveticaCondensed = localFont({
  src: [
    { path: './fonts/HelveticaLTStd-LightCond.woff2', weight: '300', style: 'normal' },
    { path: './fonts/HelveticaLTStd-BoldCond.woff2', weight: '700', style: 'normal' },
    { path: './fonts/HelveticaLTStd-BlkCond.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-helvetica-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Starfeet E-commerce",
  description: "Starfeet E-commerce",
};

import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const isPlatform = host.startsWith("kine.") || host.startsWith("dashboard.");

  return (
    <html lang="es">
      <body
        className={`${helvetica.variable} ${helveticaCondensed.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <SmoothScrollProvider>
            {!isPlatform && <Navbar />}
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
