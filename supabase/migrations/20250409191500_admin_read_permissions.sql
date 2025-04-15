-- Ensure RLS is enabled on relevant tables
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- Already likely enabled

-- Policy for Admins to read ALL club memberships
DROP POLICY IF EXISTS "Allow admin read access to all club memberships" ON public.club_memberships;
CREATE POLICY "Allow admin read access to all club memberships"
ON public.club_memberships
FOR SELECT
TO authenticated -- Check applies to logged-in users
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true -- Check if the user is an admin
);

-- Policy for Authenticated users to read basic club info (needed for joins)
-- This might already exist or need adjustment based on your needs
DROP POLICY IF EXISTS "Allow authenticated users to read clubs" ON public.clubs;
CREATE POLICY "Allow authenticated users to read clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (true); -- Allow any logged-in user to read club details

-- Re-apply/confirm policy for Authenticated users to read public profile info (needed for joins)
DROP POLICY IF EXISTS "Allow authenticated users to read public profile info" ON public.profiles;
-- Ensure previous conflicting policies are dropped
DROP POLICY IF EXISTS "Allow authenticated users to select any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Allow individual user access" ON public.profiles; 
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles; 
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles; 

CREATE POLICY "Allow authenticated users to read public profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true); -- Allow reading profiles (columns limited by GRANTs if used)

-- Ensure users can still update their own profiles
DROP POLICY IF EXISTS "Allow individual user update access" ON public.profiles;
CREATE POLICY "Allow individual user update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure users can still manage their own club memberships (SELECT/INSERT/DELETE)
-- Re-apply policies from migration 20250405170700_add_rls_club_members.sql
DROP POLICY IF EXISTS select_own_memberships ON public.club_memberships;
DROP POLICY IF EXISTS insert_own_memberships ON public.club_memberships;
-- Add DELETE policy if missing
DROP POLICY IF EXISTS delete_own_memberships ON public.club_memberships;

CREATE POLICY select_own_memberships ON public.club_memberships
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY insert_own_memberships ON public.club_memberships
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY delete_own_memberships ON public.club_memberships
FOR DELETE USING (user_id = (select auth.uid()));
