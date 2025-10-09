-- CRITICAL FIX: Complete RLS policy reset for students table
-- The recursion error is still happening despite previous migration

-- STEP 1: Drop ALL existing policies on students table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'students'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON students', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- STEP 2: Create simple, non-recursive policies
-- Policy 1: Students can view their own record (direct auth check, no subquery)
CREATE POLICY "students_view_own" ON students
  FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')::text
  );

-- Policy 2: Admins can view all students
CREATE POLICY "students_admins_view_all" ON students
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Policy 3: Partners can view students they manage (via leads)
CREATE POLICY "students_partners_view" ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.id = auth.uid()
        AND au.role = 'partner'::app_role
        AND au.partner_id IS NOT NULL
        AND au.is_active = true
        AND EXISTS (
          SELECT 1 FROM leads_new ln
          WHERE ln.student_id = students.id
            AND ln.partner_id = au.partner_id
        )
    )
  );

-- Policy 4: Admins can insert students
CREATE POLICY "students_admins_insert" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Policy 5: Partners can insert students
CREATE POLICY "students_partners_insert" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid()
        AND role = 'partner'::app_role
        AND partner_id IS NOT NULL
        AND is_active = true
    )
  );

-- Policy 6: Admins can update students
CREATE POLICY "students_admins_update" ON students
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Policy 7: Partners can update their students
CREATE POLICY "students_partners_update" ON students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      WHERE au.id = auth.uid()
        AND au.role = 'partner'::app_role
        AND au.partner_id IS NOT NULL
        AND au.is_active = true
        AND EXISTS (
          SELECT 1 FROM leads_new ln
          WHERE ln.student_id = students.id
            AND ln.partner_id = au.partner_id
        )
    )
  );

-- Verify policies were created
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'students';
    
  RAISE NOTICE '✅ Students table RLS reset complete!';
  RAISE NOTICE '   - Total policies: %', policy_count;
  RAISE NOTICE '   - Using auth.jwt() for student email check (NO recursion)';
END $$;