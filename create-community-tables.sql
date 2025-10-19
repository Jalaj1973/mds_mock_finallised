-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for replies
CREATE POLICY "Anyone can view replies" ON replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create replies" ON replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own replies" ON replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own replies" ON replies FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for votes
CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create votes" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_points
CREATE POLICY "Users can view their own points" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own points" ON user_points FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_subject ON posts(subject);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON replies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- Create function to update points
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id UUID,
  p_points_to_add INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (user_id, points, updated_at)
  VALUES (p_user_id, p_points_to_add, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    points = user_points.points + p_points_to_add,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update points when posts are created
CREATE OR REPLACE FUNCTION trigger_update_points_on_post()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_points(NEW.author_id, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_points_on_post();

-- Create trigger to automatically update points when replies are created
CREATE OR REPLACE FUNCTION trigger_update_points_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_points(NEW.author_id, 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_reply
  AFTER INSERT ON replies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_points_on_reply();

-- Create trigger to automatically update points when posts receive upvotes
CREATE OR REPLACE FUNCTION trigger_update_points_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
BEGIN
  -- Get the author of the post
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Only give points for upvotes
  IF NEW.vote_type = 'up' THEN
    PERFORM update_user_points(post_author_id, 2);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_vote
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_points_on_vote();
