-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for training documents
CREATE TABLE IF NOT EXISTS training_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  authors TEXT[], -- Array of author names
  publication_date DATE,
  document_type TEXT,
  embedding VECTOR(1536) -- For OpenAI embeddings
);

-- Create a similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  source TEXT,
  authors TEXT[],
  document_type TEXT,
  publication_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    td.id,
    td.title,
    td.content,
    td.source,
    td.authors,
    td.document_type,
    td.publication_date,
    1 - (td.embedding <=> query_embedding) AS similarity
  FROM
    training_documents td
  WHERE 
    1 - (td.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a policy to allow all authenticated users to read documents
CREATE POLICY "Allow authenticated users to read documents"
  ON training_documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fix the INSERT policy - this was causing the error
CREATE POLICY "Allow admins to insert documents"
  ON training_documents
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM admin_users
  ));

-- Create policies for UPDATE and DELETE (optional)
CREATE POLICY "Allow admins to update documents"
  ON training_documents
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "Allow admins to delete documents"
  ON training_documents
  FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

  /*
-- Simpler policy for MVP testing
CREATE POLICY "Allow authenticated users to insert documents"
  ON training_documents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
  */

