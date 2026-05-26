-- Create test users for login testing
-- Run this in your Supabase SQL editor

-- Check if users table exists and what users are there
SELECT * FROM users LIMIT 10;

-- Insert test users if they don't exist
INSERT INTO users (username, email, password_hash, role) 
VALUES 
  ('admin', 'admin@lighthouse.com', 'admin123', 'admin'),
  ('testuser', 'user@lighthouse.com', 'user123', 'user')
ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT username, email, role FROM users;
