import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { Adapter } from "next-auth/adapters";
import { UserRole } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const adapter = PrismaAdapter(prisma) as Adapter;

export const authConfig: NextAuthConfig = {
  adapter,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          enterpriseId: user.enterpriseId,
        } satisfies {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          enterpriseId: string | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: UserRole }).role ?? UserRole.MEMBER;
        token.enterpriseId = (user as { enterpriseId?: string | null }).enterpriseId ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.MEMBER;
        session.user.enterpriseId = (token.enterpriseId as string | null) ?? null;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        await prisma.session.deleteMany({ where: { userId: token.sub } });
      }
    },
  },
  cookies: {
    sessionToken: {
      name: "certnode.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
