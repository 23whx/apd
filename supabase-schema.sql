-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_id INTEGER DEFAULT 1 CHECK (avatar_id >= 1 AND avatar_id <= 20),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'mod', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Works table
CREATE TABLE IF NOT EXISTS works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_cn TEXT NOT NULL,
  name_en TEXT,
  name_jp TEXT,
  alias JSONB DEFAULT '[]'::jsonb,
  type TEXT NOT NULL CHECK (type IN ('anime', 'manga', 'game', 'novel')),
  summary_md TEXT,
  source_urls JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  name_jp TEXT,
  avatar_url TEXT,
  source_link TEXT,
  summary_md TEXT,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personality votes table
CREATE TABLE IF NOT EXISTS personality_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mbti TEXT CHECK (mbti IS NULL OR mbti IN ('INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP')),
  enneagram TEXT,
  subtype TEXT CHECK (subtype IS NULL OR subtype IN ('sx', 'so', 'sp')),
  yi_hexagram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('work', 'character', 'poll')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_md TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE
);

-- Source snapshots table
CREATE TABLE IF NOT EXISTS source_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fetched_by TEXT,
  raw_md TEXT NOT NULL,
  raw_html TEXT,
  license_info TEXT
);

-- Indexes for better performance
CREATE INDEX idx_works_created_by ON works(created_by);
CREATE INDEX idx_works_type ON works(type);
CREATE INDEX idx_characters_work_id ON characters(work_id);
CREATE INDEX idx_personality_votes_character_id ON personality_votes(character_id);
CREATE INDEX idx_personality_votes_user_id ON personality_votes(user_id);
CREATE INDEX idx_comments_target ON comments(target_type, target_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: public read, users can update their own profile
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Works: public read, authenticated users can create
CREATE POLICY "Works are viewable by everyone" ON works FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create works" ON works FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own works" ON works FOR UPDATE USING (auth.uid() = created_by);

-- Characters: public read, work creators can manage
CREATE POLICY "Characters are viewable by everyone" ON characters FOR SELECT USING (true);
CREATE POLICY "Work creators can add characters" ON characters FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM works WHERE works.id = work_id AND works.created_by = auth.uid())
);

-- Personality votes: public read, authenticated users can vote
CREATE POLICY "Votes are viewable by everyone" ON personality_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON personality_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON personality_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON personality_votes FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, authenticated users can comment
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Source snapshots: public read, system only write
CREATE POLICY "Snapshots are viewable by everyone" ON source_snapshots FOR SELECT USING (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, display_name, avatar_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    FLOOR(RANDOM() * 20 + 1)::INTEGER
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

