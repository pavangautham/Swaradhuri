-- Enable RLS on all tables to resolve security vulnerabilities
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_removed_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_library ENABLE ROW LEVEL SECURITY;

-- Since the application currently uses the service_role key for most backend operations, 
-- these operations bypass RLS by default.
-- However, we enable RLS to prevent unauthorized access via the public 'anon' key.

-- Default policies (optional but recommended for complete security)
-- For now, we allow full access to the service_role (implicit) and define no public policies,
-- which effectively blocks all client-side 'anon' access while allowing the backend to work.

-- If you plan to move logic to the client-side using the 'anon' or 'authenticated' keys, 
-- you should add specific policies here, for example:
-- CREATE POLICY "Teachers can see their own lessons" ON lessons FOR SELECT USING (auth.uid()::text = teacher_id);
