"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoginSchema } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");

  const roleCallbackUrl = "/post-login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Validate with Zod Schema
    const result = LoginSchema.safeParse({ email, password });

    if (!result.success) {
      setLoading(false);
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          // Format message using next-intl params if needed (e.g. minPassword needs {min})
          const key = err.message;
          const msg = key === "minPassword" ? tVal("minPassword", { min: 6 }) : tVal(key);
          errors[err.path[0] as string] = msg;
        }
      });
      setFieldErrors(errors);

      // Focus the first invalid field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementById(`login-${firstErrorField}`)?.focus();
      }
      return;
    }

    const authResult = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
      callbackUrl: roleCallbackUrl,
    });

    setLoading(false);
    if (authResult?.error) {
      // Check if it's a lockout message or generic error
      if (authResult.error.includes("lockout")) {
        setError(t("lockoutError", { minutes: 15 }));
      } else {
        setError(t("loginError"));
      }
      return;
    }

    router.push(authResult?.url ?? roleCallbackUrl);
    router.refresh();
  }

  async function onGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn("google", { callbackUrl: roleCallbackUrl });
    } catch {
      setGoogleLoading(false);
      setError(t("googleError"));
    }
  }

  const inputClass = (fieldName: string) => [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed",
    fieldErrors[fieldName]
      ? "border-red-500 bg-red-50 focus:ring-red-500/30 dark:border-red-500 dark:bg-red-950/20 dark:focus:ring-red-500/20 text-red-900 dark:text-red-200"
      : "border-gray-300 bg-white focus:ring-starfeet-blue/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-sky-300/30",
  ].join(" ");

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700 dark:text-slate-300 mb-1"
        >
          {t("email")}
        </label>
        <input
          id="login-email"
          className={inputClass("email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || googleLoading}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        <AnimatePresence>
          {fieldErrors.email && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              id="email-error"
              className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.email}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-xs font-bold uppercase tracking-[0.14em] text-gray-700 dark:text-slate-300 mb-1"
        >
          {t("password")}
        </label>
        <input
          id="login-password"
          className={inputClass("password")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || googleLoading}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        <AnimatePresence>
          {fieldErrors.password && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              id="password-error"
              className="mt-1 block text-xs font-semibold text-red-700 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.password}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-sm text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full rounded-xl bg-starfeet-blue dark:bg-sky-400 dark:text-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-starfeet-blue/90 dark:hover:bg-sky-300 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-starfeet-blue/45 focus-visible:outline-none"
      >
        {loading ? t("submitting") : t("submit")}
      </button>

      <button
        type="button"
        onClick={onGoogle}
        disabled={loading || googleLoading}
        className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 px-4 py-2 text-sm font-bold transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gray-300/40 focus-visible:outline-none"
      >
        {googleLoading ? t("googleConnecting") : t("google")}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
        <Link href="/recuperar" className="text-starfeet-blue dark:text-sky-400 hover:underline">
          {t("recoverPassword")}
        </Link>
        <Link href="/registro" className="text-starfeet-blue dark:text-sky-400 hover:underline">
          {t("createAccount")}
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-3 text-sm text-gray-700 dark:text-slate-300">
        {t("guestPrompt")}{" "}
        <Link href="/invitado" className="font-bold text-starfeet-blue dark:text-sky-400 hover:underline">
          {t("guestAction")}
        </Link>
      </div>
    </form>
  );
}
