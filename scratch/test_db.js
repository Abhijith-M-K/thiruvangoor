const { neon } = require("@neondatabase/serverless");

const url = "postgresql://neondb_owner:npg_pMO8TFHxQjz2@ep-crimson-hat-au7uneus-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
  console.log("Connecting to Neon DB...");
  const sql = neon(url);
  try {
    const res = await sql`SELECT NOW()`;
    console.log("Success! Current time from DB:", res[0]);
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

run();
