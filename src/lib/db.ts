import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

// Checks if database configuration is available and is not the default template placeholder
export const isDbConfigured = !!(
  databaseUrl && 
  databaseUrl !== "postgres://username:password@ep-host.region.aws.neon.tech/neondb?sslmode=require" &&
  databaseUrl.startsWith("postgres")
);

// Returns a neon connection function or null
export const getDbClient = () => {
  if (!isDbConfigured) {
    console.warn("Neon Database URL not configured. Operating in mock fallback mode.");
    return null;
  }
  try {
    return neon(databaseUrl!);
  } catch (error) {
    console.error("Failed to initialize Neon connection pool:", error);
    return null;
  }
};

let tablesInitialized = false;

// Helper function to auto-create tables and seed data if missing
export async function ensureTablesExist(sql: any) {
  if (tablesInitialized) {
    return;
  }
  try {
    // 1. Create swayamsevaks table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS swayamsevaks (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        shakha VARCHAR(100) NOT NULL,
        joining_date VARCHAR(50) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'touring')) NOT NULL,
        role VARCHAR(50) NOT NULL,
        dakshina INT DEFAULT 0
      )
    `;

    // 2. Create contributions table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS contributions (
        id VARCHAR(20) PRIMARY KEY,
        swayamsevak_id VARCHAR(20),
        name VARCHAR(100) NOT NULL,
        shakha VARCHAR(100) NOT NULL,
        contribution_date VARCHAR(50) NOT NULL,
        amount INT NOT NULL
      )
    `;

    // Check if swayamsevaks table is empty
    const mCountRes = await sql`SELECT COUNT(*) as count FROM swayamsevaks`;
    const memberCount = Number(mCountRes[0]?.count || 0);

    // Seed swayamsevaks if empty
    if (memberCount === 0) {
      console.log("Database swayamsevaks table is empty. Injecting initial seed rows...");
      const swayamsevakSeeds = [
        ["SW-93210", "ANAGHA PC", "7907500400", "anagha@mailinator.com", "Bal Shakha", "07 May 2026", "active", "Gathanayak", 3000],
        ["SW-69995", "VIJESH PB", "9946381671", "vijesh@mailinator.com", "Tarun Shakha", "07 May 2026", "active", "Swayamsevak", 11000],
        ["SW-38746", "MIDHUN TP", "9846977074", "midhun@mailinator.com", "Bal Shakha", "07 May 2026", "active", "Mukhya Shikshak", 5000],
        ["SW-36574", "ANAGHA MV", "7012735865", "anaghamv@mailinator.com", "Pravaudh Shakha", "07 May 2026", "active", "Shikshak", 11000],
        ["SW-72314", "JOSNA V K", "8590646303", "josna@mailinator.com", "Bal Shakha", "07 May 2026", "active", "Karyavah", 3000],
        ["SW-41982", "RAJESH KUMAR", "9447281982", "rajesh@mailinator.com", "Tarun Shakha", "12 Dec 2025", "touring", "Bhag Karyavah", 15000],
        ["SW-10874", "SANDEEP MEHTA", "9876543210", "sandeep@mailinator.com", "Pravaudh Shakha", "20 Jan 2026", "inactive", "Swayamsevak", 0]
      ];

      for (const row of swayamsevakSeeds) {
        await sql`
          INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
          VALUES (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]}, ${row[7]}, ${row[8]})
        `;
      }
    }

    // Check if contributions table is empty
    const cCountRes = await sql`SELECT COUNT(*) as count FROM contributions`;
    const contributionCount = Number(cCountRes[0]?.count || 0);

    // Seed contributions if empty
    if (contributionCount === 0) {
      console.log("Database contributions table is empty. Injecting initial seed rows...");
      const contributionSeeds = [
        ["CON-93210", "SW-93210", "ANAGHA PC", "Bal Shakha", "07 May 2026", 3000],
        ["CON-69995", "SW-69995", "VIJESH PB", "Tarun Shakha", "07 May 2026", 11000],
        ["CON-38746", "SW-38746", "MIDHUN TP", "Bal Shakha", "07 May 2026", 5000],
        ["CON-36574", "SW-36574", "ANAGHA MV", "Pravaudh Shakha", "07 May 2026", 11000],
        ["CON-72314", "SW-72314", "JOSNA V K", "Bal Shakha", "07 May 2026", 3000],
        ["CON-41982", "SW-41982", "RAJESH KUMAR", "Tarun Shakha", "12 Dec 2025", 15000]
      ];

      for (const row of contributionSeeds) {
        await sql`
          INSERT INTO contributions (id, swayamsevak_id, name, shakha, contribution_date, amount)
          VALUES (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]})
        `;
      }
    }

    // 3. Create shakhas table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS shakhas (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        time VARCHAR(100) NOT NULL,
        location VARCHAR(200) NOT NULL,
        mukhya_shikshak VARCHAR(100) NOT NULL,
        attendance INT DEFAULT 0
      )
    `;

    // Check if shakhas table is empty
    const sCountRes = await sql`SELECT COUNT(*) as count FROM shakhas`;
    const shakhaCount = Number(sCountRes[0]?.count || 0);

    // Seed shakhas if empty
    if (shakhaCount === 0) {
      console.log("Database shakhas table is empty. Injecting initial seed rows...");
      const shakhaSeeds = [
        ["SH-01", "Bal Shakha", "prabhat", "06:00 AM - 07:00 AM", "Thiruvangoor Temple Ground", "MIDHUN TP", 24],
        ["SH-02", "Tarun Shakha", "sayam", "05:30 PM - 06:30 PM", "Chemancheri School Ground", "K. ARUN", 18],
        ["SH-03", "Pravaudh Shakha", "ratri", "07:00 PM - 08:30 PM", "Thiruvangoor Shakha Karyalaya", "JOSNA V K", 15]
      ];

      for (const row of shakhaSeeds) {
        await sql`
          INSERT INTO shakhas (id, name, type, time, location, mukhya_shikshak, attendance)
          VALUES (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]})
        `;
      }
    }

    tablesInitialized = true;
  } catch (error) {
    console.error("Auto-table initialization check failed:", error);
  }
}
