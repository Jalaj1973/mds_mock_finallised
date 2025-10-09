-- Enable RLS on all tables
ALTER TABLE "Questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;

-- Questions table: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read questions" ON "Questions"
    FOR SELECT USING (auth.role() = 'authenticated');

-- TestResults table: Users can only access their own results
CREATE POLICY "Users can only access their own test results" ON "TestResults"
    FOR ALL USING (auth.uid() = user_id);

-- Subjects table: Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read subjects" ON "subjects"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow users to insert their own test results
CREATE POLICY "Users can insert their own test results" ON "TestResults"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
