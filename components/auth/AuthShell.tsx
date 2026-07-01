import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const landingUrl = process.env.NEXT_PUBLIC_URL_LANDING || "/";

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-32">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <header className="mb-6">
          <a
            href={landingUrl}
            className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-starfeet-blue/70 transition-colors hover:text-starfeet-blue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span>Volver</span>
          </a>
          <h1 className="mt-2 font-condensed text-4xl font-black uppercase tracking-tight text-starfeet-blue">{title}</h1>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </header>

        {children}

        <footer className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500">
          <p>
            ¿Necesitas comprar ahora?{" "}
            <Link className="font-bold text-starfeet-blue hover:underline" href="/tienda">
              Ir a tienda
            </Link>
          </p>
        </footer>
      </section>
    </main>
  );
}
