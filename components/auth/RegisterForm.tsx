"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error ?? "No se pudo registrar");
      }

      await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      const linked = payload?.linkedGoogleAccount === true;
      setMessage(
        linked
          ? "Cuenta Google existente integrada con contraseña correctamente."
          : "Cuenta creada correctamente."
      );
      router.push("/cliente");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
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
      <label htmlFor="register-name" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
        Nombre (opcional)
      </label>
      <input
        id="register-name"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />

      <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
        Email
      </label>
      <input
        id="register-email"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
        Contraseña
      </label>
      <input
        id="register-password"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
        type="password"
        minLength={6}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <p className="text-xs text-gray-500">Mínimo 6 caracteres.</p>

      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta con email"}
      </button>

      <button
        type="button"
        onClick={onGoogle}
        disabled={loading || googleLoading}
        className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
      >
        {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
      </button>

      <div className="pt-2 text-sm">
        <Link href="/login" className="text-starfeet-blue hover:underline">
          Ya tengo cuenta
        </Link>
      </div>
    </form>
  );
}
