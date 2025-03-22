-- Store user-uploaded documents for context
CREATE TABLE coach_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX coach_documents_user_id_idx ON coach_documents(user_id);

-- Store coaching conversations for future analysis
CREATE TABLE ai_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_generated BOOLEAN DEFAULT FALSE,
  workouts_created INTEGER DEFAULT 0,
  feedback_rating INTEGER, -- User feedback on plan quality (1-5)
  feedback_comments TEXT
);

-- Create index for faster queries
CREATE INDEX ai_coaching_sessions_user_id_idx ON ai_coaching_sessions(user_id);

-- Enable row level security for these tables
ALTER TABLE coach_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for coach_documents
CREATE POLICY "Users can view their own documents"
  ON coach_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON coach_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON coach_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON coach_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for ai_coaching_sessions
CREATE POLICY "Users can view their own coaching sessions"
  ON ai_coaching_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coaching sessions"
  ON ai_coaching_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);