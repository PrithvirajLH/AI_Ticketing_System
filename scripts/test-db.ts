import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  console.log("=== Database Connection Test ===\n");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  console.log("URL prefix:", process.env.DATABASE_URL.substring(0, 40) + "...");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Connecting to Supabase...");
    const result = await prisma.$queryRawUnsafe("SELECT 1 as test");
    console.log("Raw query result:", JSON.stringify(result));
    console.log("\n=== DB Connection: OK ===");
  } catch (error) {
    console.error(`\nFAILED:`, error);
    process.exit(1);
  }
}

main();
