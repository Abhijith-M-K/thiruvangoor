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
        phone VARCHAR(20),
        email VARCHAR(100),
        shakha VARCHAR(100) NOT NULL,
        joining_date VARCHAR(50) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'touring')) NOT NULL,
        role VARCHAR(50) NOT NULL,
        dakshina INT DEFAULT 0,
        age INT
      )
    `;

    // Alter table to ensure phone column is optional and age column exists
    try {
      await sql`
        ALTER TABLE swayamsevaks ALTER COLUMN phone DROP NOT NULL;
      `;
    } catch (err) {
      console.warn("Could not alter phone column constraint:", err);
    }

    try {
      await sql`
        ALTER TABLE swayamsevaks ADD COLUMN IF NOT EXISTS age INT;
      `;
    } catch (err) {
      console.warn("Could not run migration to add age column:", err);
    }

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

    // 4. Create shakha_attendance_logs table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS shakha_attendance_logs (
        id VARCHAR(20) PRIMARY KEY,
        shakha_id VARCHAR(20) NOT NULL,
        log_date VARCHAR(50) NOT NULL,
        present_count INT NOT NULL,
        absent_count INT NOT NULL,
        absent_reason_count INT NOT NULL,
        remarks TEXT
      )
    `;

    // 5. Create events table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        event_date VARCHAR(50) NOT NULL,
        place VARCHAR(200) NOT NULL,
        informed_count INT NOT NULL,
        participant_count INT NOT NULL,
        absent_count INT NOT NULL,
        absent_reason_count INT NOT NULL
      )
    `;

    // Clean up initial mock seeds if existing in database
    try {
      await sql`DELETE FROM swayamsevaks WHERE id IN ('SW-93210', 'SW-69995', 'SW-38746', 'SW-36574', 'SW-72314', 'SW-41982', 'SW-10874')`;
      await sql`DELETE FROM contributions WHERE id IN ('CON-93210', 'CON-69995', 'CON-38746', 'CON-36574', 'CON-72314', 'CON-41982')`;
      await sql`DELETE FROM shakhas WHERE id IN ('SH-01', 'SH-02', 'SH-03')`;
      await sql`DELETE FROM shakha_attendance_logs WHERE id IN ('LOG-1001', 'LOG-1002', 'LOG-1003')`;
      await sql`DELETE FROM events WHERE id IN ('EV-1001', 'EV-1002', 'EV-1003', 'EV-1004')`;
    } catch (cleanErr) {
      console.warn("Could not clean mock seed rows:", cleanErr);
    }

    tablesInitialized = true;
  } catch (error) {
    console.error("Auto-table initialization check failed:", error);
  }
}
