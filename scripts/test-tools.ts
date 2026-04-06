import "dotenv/config";
import { getUserProfile, getUserHistory } from "../src/lib/ai/tools/user-tools";
import { getDepartments, getCategories, getRoutingRules } from "../src/lib/ai/tools/classification-tools";

async function main() {
  console.log("=== Tool Functions Test ===\n");

  // Test getDepartments
  console.log("--- get_departments ---");
  const depts = await getDepartments();
  if (depts.success) {
    console.log(`  Found ${depts.data.length} departments:`);
    for (const d of depts.data) {
      console.log(`  - ${d.name} (${d.slug})`);
    }
  } else {
    console.error(`  FAIL: ${depts.error}`);
  }

  // Test getCategories
  console.log("\n--- get_categories ---");
  const cats = await getCategories();
  if (cats.success) {
    console.log(`  Found ${cats.data.length} root categories:`);
    for (const c of cats.data) {
      console.log(`  - ${c.name} (${c.slug})${c.children.length > 0 ? ` → ${c.children.length} children` : ""}`);
    }
  } else {
    console.error(`  FAIL: ${cats.error}`);
  }

  // Test getRoutingRules
  console.log("\n--- get_routing_rules ---");
  const rules = await getRoutingRules();
  if (rules.success) {
    console.log(`  Found ${rules.data.length} rules:`);
    for (const r of rules.data) {
      console.log(`  - ${r.name} → ${r.teamName} [${r.keywords.join(", ")}]`);
    }
  } else {
    console.error(`  FAIL: ${rules.error}`);
  }

  // Test getUserProfile (use a known user from the DB)
  console.log("\n--- get_user_profile ---");
  // First, find a user ID
  const { getSupabase } = await import("../src/lib/db/supabase");
  const supabase = getSupabase();
  const { data: users } = await supabase
    .from("User")
    .select("id, displayName, role")
    .limit(3);

  if (users && users.length > 0) {
    const testUser = users[0];
    console.log(`  Testing with user: ${testUser.displayName} (${testUser.id})`);
    const profile = await getUserProfile(testUser.id);
    if (profile.success) {
      console.log(`  Name: ${profile.data.displayName}`);
      console.log(`  Role: ${profile.data.role}`);
      console.log(`  Department: ${profile.data.department ?? "none"}`);
    } else {
      console.error(`  FAIL: ${profile.error}`);
    }

    // Test getUserHistory
    console.log("\n--- get_user_history ---");
    const history = await getUserHistory(testUser.id);
    if (history.success) {
      console.log(`  Found ${history.data.length} tickets for ${testUser.displayName}`);
      for (const t of history.data) {
        console.log(`  - #${t.number} [${t.priority}] ${t.subject}`);
      }
    } else {
      console.error(`  FAIL: ${history.error}`);
    }
  }

  console.log("\n=== All tool tests complete ===");
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
