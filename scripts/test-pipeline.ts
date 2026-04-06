/**
 * Full pipeline test — calls all 4 Foundry agents end-to-end.
 *
 * Run with: npx tsx scripts/test-pipeline.ts
 */

import "dotenv/config";

async function main() {
  console.log("=== AI Ticket Pipeline — Full Test ===\n");

  // Verify env
  const required = ["AZURE_AI_FOUNDRY_ENDPOINT", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  // Get a real user ID from the DB
  const { getSupabase } = await import("../src/lib/db/supabase");
  const supabase = getSupabase();
  const { data: users } = await supabase
    .from("User")
    .select("id, displayName")
    .limit(1);

  const userId = users?.[0]?.id ?? undefined;
  console.log(`Test user: ${users?.[0]?.displayName ?? "anonymous"} (${userId})\n`);

  const { classifyTicket } = await import("../src/lib/ai/pipeline");

  // Test 1: Clear IT issue
  console.log("━━━ Test 1: Clear IT issue ━━━");
  const result1 = await classifyTicket({
    text: "I can't access SAP and I have a deadline tomorrow for the quarterly report",
    userId,
    channel: "PORTAL",
  });
  console.log("Result:", JSON.stringify(result1, null, 2));

  console.log("\n\n━━━ Done ━━━");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
