-- Schema Creation for Rashtriya Swayamsevak Sangh (RSS) Admin Portal
-- Database: Vercel Neon PostgreSQL

-- Drop table if exists (for re-initialization)
-- DROP TABLE IF EXISTS swayamsevaks;

-- Create swayamsevaks table
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
);

-- Insert initial seed data
INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-93210', 'ANAGHA PC', '7907500400', 'anagha@mailinator.com', 'Thiruvangoor Prabhat', '07 May 2026', 'active', 'Gathanayak', 3000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-69995', 'VIJESH PB', '9946381671', 'vijesh@mailinator.com', 'Chemancheri Sayam', '07 May 2026', 'active', 'Swayamsevak', 11000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-38746', 'MIDHUN TP', '9846977074', 'midhun@mailinator.com', 'Thiruvangoor Prabhat', '07 May 2026', 'active', 'Mukhya Shikshak', 5000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-36574', 'ANAGHA MV', '7012735865', 'anaghamv@mailinator.com', 'Kappad Sayam', '07 May 2026', 'active', 'Shikshak', 11000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-72314', 'JOSNA V K', '8590646303', 'josna@mailinator.com', 'Thiruvangoor Prabhat', '07 May 2026', 'active', 'Karyavah', 3000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-41982', 'RAJESH KUMAR', '9447281982', 'rajesh@mailinator.com', 'Chemancheri Sayam', '12 Dec 2025', 'touring', 'Bhag Karyavah', 15000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO swayamsevaks (id, name, phone, email, shakha, joining_date, status, role, dakshina)
VALUES
  ('SW-10874', 'SANDEEP MEHTA', '9876543210', 'sandeep@mailinator.com', 'Kappad Sayam', '20 Jan 2026', 'inactive', 'Swayamsevak', 0)
ON CONFLICT (id) DO NOTHING;
