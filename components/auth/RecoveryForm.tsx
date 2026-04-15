"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotResponse = {
  ok?: boolean;
  devCode?: string;
  error?: string;
};

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function onRequestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setDevCode(null);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const payload = (await response.json()) as ForgotResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo enviar el código.");
      }

      setStep("verify");
      setMessage("Si existe una cuenta activa, enviamos un código de recuperación al email.");
      if (payload.devCode) setDevCode(payload.devCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (password.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }
      if (password !== confirmPassword) {
        throw new Error("La confirmación de contraseña no coincide.");
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code.trim(),
          password,
        }),
      });
      const payload = (await res.json()) as ForgotResponse;
      if (!res.ok) {
        throw new Error(payload.error ?? "No se pudo actualizar la contraseña.");
      }

      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      setCode("");
      setPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {step === "request" ? (
        <form onSubmit={onRequestCode} className="space-y-4" noValidate>
          <label htmlFor="recovery-email" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Email de tu cuenta
          </label>
          <input
            id="recovery-email"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
          >
            {loading ? "Enviando código..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={onResetPassword} className="space-y-4" noValidate>
          <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">Email: {email.toLowerCase().trim()}</p>

          {devCode ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Código de desarrollo: <strong>{devCode}</strong>
            </p>
          ) : null}

          <label htmlFor="recovery-code" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Código recibido
          </label>
          <input
            id="recovery-code"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            required
          />

          <label htmlFor="recovery-password" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Nueva contraseña
          </label>
          <input
            id="recovery-password"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="recovery-confirm-password" className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700">
            Confirmar contraseña
          </label>
          <input
            id="recovery-confirm-password"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-starfeet-blue transition focus:ring-2"
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-starfeet-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("request");
              setCode("");
              setPassword("");
              setConfirmPassword("");
              setError(null);
              setMessage(null);
            }}
            className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Reenviar código
          </button>
        </form>
      )}

      <p className="text-sm text-gray-600">
        <Link href="/login" className="text-starfeet-blue hover:underline">
          Volver a login
        </Link>
      </p>
    </div>
  );
}
