import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: "CLIENTE" | "KINESIOLOGO" | "ADMIN" | "MARKETING"
            isActive: boolean
            sessionRevoked?: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id?: string
        role?: "CLIENTE" | "KINESIOLOGO" | "ADMIN" | "MARKETING"
        isActive?: boolean
        sessionVersion?: number
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "CLIENTE" | "KINESIOLOGO" | "ADMIN" | "MARKETING"
        isActive?: boolean
        sessionVersion?: number
        sessionRevoked?: boolean
        lastUserSyncAt?: number
    }
}
