import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import prisma from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
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
