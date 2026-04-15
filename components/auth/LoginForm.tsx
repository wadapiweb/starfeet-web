"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
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
      callbackUrl: "/cliente",
    });

    setLoading(false);
    if (result?.error) {
      setError("No pudimos iniciar sesión. Verifica email/contraseña o estado de cuenta.");
      return;
    }

    router.push(result?.url ?? "/cliente");
    router.refresh();
  }

  async function onGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/cliente" });
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
        className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar con email"}
      </button>

      <button
        type="button"
        onClick={onGoogle}
        disabled={loading || googleLoading}
        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
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
