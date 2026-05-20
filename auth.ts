import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "./lib/prisma"
import { auditSecurityEvent } from "./lib/security/audit"
import { ensureUserSlug } from "./lib/slug"

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || ".starfeet.ar";
const useSecureCookies = 
  process.env.NODE_ENV === "production" || 
  (!baseDomain.includes("localhost") && !baseDomain.includes("127.0.0.1"));
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}authjs.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: useSecureCookies,
                domain: useSecureCookies ? baseDomain : undefined,
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
            async authorize(credentials) {
                const rawEmail = credentials?.email;
                const rawPassword = credentials?.password;
                const email =
                    typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";
                const password =
                    typeof rawPassword === "string" ? rawPassword : "";
                if (!email || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { email },
                });
                if (!user || !user.password || !user.isActive) {
                    auditSecurityEvent({
                        action: "AUTH_LOGIN_FAILED",
                        email,
                        provider: "credentials",
                        route: "/api/auth/callback/credentials",
                        reason: "user_not_found_or_inactive_or_no_password",
                    });
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    auditSecurityEvent({
                        action: "AUTH_LOGIN_FAILED",
                        email,
                        provider: "credentials",
                        route: "/api/auth/callback/credentials",
                        reason: "invalid_password",
                    });
                    return null;
                }

                auditSecurityEvent({
                    action: "AUTH_LOGIN_SUCCESS",
                    email,
                    provider: "credentials",
                    route: "/api/auth/callback/credentials",
                });
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: user.isActive,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user?.email) return false
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email.toLowerCase() },
                select: { id: true, isActive: true, name: true, slug: true },
            })
            if (!dbUser) {
                auditSecurityEvent({
                    action: "AUTH_LOGIN_SUCCESS",
                    email: user.email,
                    provider: account?.provider,
                    route: "/api/auth/callback",
                    reason: "new_user_allowed",
                });
                return true
            }
            if (!dbUser.isActive) {
                auditSecurityEvent({
                    action: "AUTH_LOGIN_FAILED",
                    email: user.email,
                    provider: account?.provider,
                    route: "/api/auth/callback",
                    reason: "inactive_user",
                });
                return false
            }
            if (!dbUser.slug) {
                await ensureUserSlug(dbUser.id, dbUser.name ?? user.name, user.email)
            }
            auditSecurityEvent({
                action: "AUTH_LOGIN_SUCCESS",
                email: user.email,
                provider: account?.provider,
                route: "/api/auth/callback",
            });
            return true
        },
        async jwt({ token }) {
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { id: true, name: true, role: true, isActive: true, slug: true }
                })
                if (dbUser) {
                    if (!dbUser.slug) {
                        await ensureUserSlug(dbUser.id, dbUser.name, token.email)
                    }
                    token.role = dbUser.role
                    token.isActive = dbUser.isActive
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as "CLIENTE" | "KINESIOLOGO" | "ADMIN"
                session.user.isActive = token.isActive as boolean
                if (token.sub) {
                    session.user.id = token.sub
                }
            }
            return session
        },
    },
})
