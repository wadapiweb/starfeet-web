import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: "CLIENTE" | "KINESIOLOGO" | "ADMIN"
            isActive: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id?: string
        role?: "CLIENTE" | "KINESIOLOGO" | "ADMIN"
        isActive?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "CLIENTE" | "KINESIOLOGO" | "ADMIN"
        isActive?: boolean
    }
}
