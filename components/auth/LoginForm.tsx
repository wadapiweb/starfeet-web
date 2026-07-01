"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const originCallback = searchParams.get("callbackUrl");

  const roleCallbackUrl = originCallback
    ? `/post-login?callbackUrl=${encodeURIComponent(originCallback)}`
    : "/post-login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
      callbackUrl: roleCallbackUrl,
    });

    setLoading(false);
    if (result?.error) {
      setError("No pudimos iniciar sesión. Verifica email/contraseña o estado de cuenta.");
      return;
    }

    router.push(result?.url ?? roleCallbackUrl);
  }

  async function onGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: roleCallbackUrl });
    } catch {
      setGoogleLoading(false);
      setError("No se pudo iniciar con Google en este momento.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
        Email
      </label>
      <input
        id="login-email"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
        Contraseña
      </label>
      <input
        id="login-password"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full rounded-xl bg-starfeet-blue px-4 py-2.5 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar con email"}
      </button>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase">o</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={loading || googleLoading}
        className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-starfeet-blue/50 disabled:opacity-50"
      >
        <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <g>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <path fill="none" d="M0 0h48v48H0z" />
          </g>
        </svg>
        <span>{googleLoading ? "Conectando con Google..." : "Iniciar sesión con Google"}</span>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
        <Link href="/recuperar" className="text-starfeet-blue hover:underline">
          Recuperar contraseña
        </Link>
        <Link href="/registro" className="text-starfeet-blue hover:underline">
          Crear cuenta
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        ¿Compraste como invitado?{" "}
        <Link href="/invitado" className="font-bold text-starfeet-blue hover:underline">
          Ver compra con email
        </Link>
      </div>
    </form>
  );
}
