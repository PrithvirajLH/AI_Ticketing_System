import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getSupabase } from "@/lib/db/supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      // Upsert user in Supabase on login
      try {
        const supabase = getSupabase();

        const { data: existing } = await supabase
          .from("User")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!existing) {
          // Create new user
          const id = crypto.randomUUID();
          await supabase.from("User").insert({
            id,
            email: user.email,
            displayName: user.name ?? user.email.split("@")[0],
            role: "EMPLOYEE",
            updatedAt: new Date().toISOString(),
            graphProfile: profile ?? null,
          });
        } else {
          // Update graph profile on login
          await supabase
            .from("User")
            .update({
              displayName: user.name ?? undefined,
              graphProfile: profile ?? undefined,
              updatedAt: new Date().toISOString(),
            })
            .eq("id", existing.id);
        }
      } catch {
        // Don't block login if DB update fails
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        // Fetch the DB user ID and role
        try {
          const supabase = getSupabase();
          const { data } = await supabase
            .from("User")
            .select("id, role, primaryTeamId, displayName")
            .eq("email", user.email)
            .single();

          if (data) {
            token.userId = data.id;
            token.role = data.role;
            token.primaryTeamId = data.primaryTeamId;
            token.displayName = data.displayName;
          }
        } catch {
          // ignore
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.primaryTeamId = token.primaryTeamId as string | null;
        session.user.displayName = token.displayName as string;
      }
      return session;
    },
  },
});
