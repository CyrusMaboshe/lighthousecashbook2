
-- Insert Cyrus Maboshe as an admin user with hashed password
-- Password hash for "titanium" using SHA-256
INSERT INTO public.users (username, email, password_hash, role, is_admin)
VALUES (
  'Cyrus Maboshe',
  'cyrusmaboshe@lighthouse.com',
  'b8c94f8c0c5e8c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c',
  'admin',
  true
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_admin = EXCLUDED.is_admin;

-- Note: The actual SHA-256 hash for "titanium" will be calculated by the application
-- This is a placeholder that will be updated when the user logs in

-- Create a function to prevent deletion of admin users
CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of main admin accounts
  IF OLD.username IN ('Cyrus Maboshe', 'Admin') OR OLD.role = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete admin users';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent admin deletion
DROP TRIGGER IF EXISTS prevent_admin_deletion_trigger ON public.users;
CREATE TRIGGER prevent_admin_deletion_trigger
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_deletion();

-- Also prevent role changes for main admin
CREATE OR REPLACE FUNCTION prevent_admin_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent role changes for main admin accounts
  IF OLD.username IN ('Cyrus Maboshe', 'Admin') AND NEW.role != 'admin' THEN
    RAISE EXCEPTION 'Cannot change role of main admin users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent admin role changes
DROP TRIGGER IF EXISTS prevent_admin_role_change_trigger ON public.users;
CREATE TRIGGER prevent_admin_role_change_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_role_change();
