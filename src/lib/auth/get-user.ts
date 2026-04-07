import { auth } from "./config";

/**
 * Gets the current authenticated user from the session.
 * Use in API routes and server components.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.displayName ?? session.user.name,
    role: session.user.role ?? "EMPLOYEE",
    primaryTeamId: session.user.primaryTeamId ?? null,
  };
}
