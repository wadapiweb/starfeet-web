import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
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
                if (!user || !user.password || !user.isActive) return null;

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

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
        async signIn({ user }) {
            if (!user?.email) return false
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email.toLowerCase() },
                select: { isActive: true },
            })
            if (!dbUser) return true
            return dbUser.isActive
        },
        async jwt({ token }) {
            if (token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email },
                    select: { role: true, isActive: true }
                })
                if (dbUser) {
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
