-- CRITICAL: Enable Row Level Security on all tables
ALTER TABLE "Questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read questions
CREATE POLICY "Allow authenticated users to read questions" ON "Questions"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only access their own test results
CREATE POLICY "Users can only access their own test results" ON "TestResults"
    FOR ALL USING (auth.uid() = user_id);

-- Allow all authenticated users to read subjects
CREATE POLICY "Allow authenticated users to read subjects" ON "subjects"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow users to insert their own test results
CREATE POLICY "Users can insert their own test results" ON "TestResults"
    FOR INSERT WITH CHECK (auth.uid() = user_id);
