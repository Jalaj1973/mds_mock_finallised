-- Create TestResults table for storing user test results
CREATE TABLE IF NOT EXISTS "TestResults" (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  skipped_count INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_per_question INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE "TestResults" ENABLE ROW LEVEL SECURITY;

-- Create policies for TestResults table
CREATE POLICY "Users can only access their own test results" ON "TestResults"
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_testresults_user_id ON "TestResults"(user_id);
CREATE INDEX IF NOT EXISTS idx_testresults_created_at ON "TestResults"(created_at);
CREATE INDEX IF NOT EXISTS idx_testresults_subject ON "TestResults"(subject);
