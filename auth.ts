import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "./lib/prisma"
import { ensureUserSlug } from "./lib/slug"
import { authorizeCredentials } from "./lib/security/credentials-auth.service"
import { authorizeOAuthSignIn } from "./lib/security/oauth-auth.service"
import {
    isTokenSessionVersionRevoked,
    markTokenSessionRevoked,
    markTokenSessionValid,
    primeTokenSessionVersion,
    shouldSyncTokenUser,
} from "./lib/security/session-version.service"

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
const useSecureCookies = 
  process.env.NODE_ENV === "production" || 
  (!baseDomain.includes("localhost") && !baseDomain.includes("127.0.0.1"));
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const cookieNamespace = process.env.AUTH_COOKIE_NAMESPACE ? `${process.env.AUTH_COOKIE_NAMESPACE}.` : "";
const sessionCookieName = `${cookiePrefix}${cookieNamespace}authjs.session-token`;
const callbackCookieName = `${cookiePrefix}${cookieNamespace}authjs.callback-url`;
const csrfCookieName = `${useSecureCookies ? "__Host-" : ""}${cookieNamespace}authjs.csrf-token`;

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    cookies: {
        sessionToken: {
            name: sessionCookieName,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                domain: useSecureCookies ? baseDomain : undefined,
            },
        },
        callbackUrl: {
            name: callbackCookieName,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: csrfCookieName,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
            },
        },
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: "Email y contraseña",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials, request) {
                return authorizeCredentials(credentials, request)
            },
        }),
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            const cleanBase = baseDomain.startsWith(".") ? baseDomain.slice(1) : baseDomain;
            try {
                const parsedUrl = new URL(url);
                if (parsedUrl.hostname === cleanBase || parsedUrl.hostname.endsWith(`.${cleanBase}`)) {
                    return url;
                }
            } catch {
                // fall through
            }
            return baseUrl;
        },
        async signIn({ user, account }) {
            return authorizeOAuthSignIn(user, account ?? null)
        },
        async jwt({ token, user }) {
            const now = Date.now();
            primeTokenSessionVersion(token, user)
            if (!shouldSyncTokenUser(token, now)) {
                return token;
            }
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, name: true, role: true, isActive: true, slug: true, sessionVersion: true }
                })
                if (dbUser) {
                    if (!dbUser.slug) {
                        await ensureUserSlug(dbUser.id, dbUser.name, token.email)
                    }
                    if (isTokenSessionVersionRevoked(token, dbUser)) {
                        markTokenSessionRevoked(token, now)
                        return token
                    }
                    token.role = dbUser.role
                    token.isActive = dbUser.isActive
                    markTokenSessionValid(token, dbUser.sessionVersion, now)
                } else {
                    markTokenSessionRevoked(token, now)
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as "CLIENTE" | "KINESIOLOGO" | "ADMIN" | "MARKETING"
                session.user.isActive = token.isActive as boolean
                session.user.sessionRevoked = Boolean(token.sessionRevoked)
                if (token.sub) {
                    session.user.id = token.sub
                }
            }
            return session
        },
    },
})
