// scripts/ingest-documents.ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenAI API for embeddings
const openaiApiKey = process.env.OPENAI_API_KEY || '';

// Function to get embedding from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-ada-002"
      })
    });

    const result = await response.json();
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to process and chunk document content
function chunkDocument(content: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = content.split('. ');
  let currentChunk = '';

  for (const sentence of sentences) {
    // If adding this sentence would exceed max size, save current chunk and start a new one
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += sentence + '. ';
  }

  // Add the last chunk if there's anything left
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Define metadata interface
interface DocumentMetadata {
  title: string;
  source: string;
  authors: string[];
  publication_date: string;
  document_type: string;
}

// Function to ingest a document into Supabase
async function ingestDocument(filePath: string, metadata: DocumentMetadata): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const chunks = chunkDocument(content);
    
    console.log(`Processing ${filePath}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding for this chunk
      const embedding = await getEmbedding(chunk);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('training_documents')
        .insert({
          title: metadata.title,
          content: chunk,
          source: metadata.source,
          authors: metadata.authors,
          publication_date: metadata.publication_date,
          document_type: metadata.document_type,
          embedding
        });
      
      if (error) {
        console.error(`Error inserting chunk ${i}:`, error);
      } else {
        console.log(`Inserted chunk ${i + 1}/${chunks.length}`);
      }
      
      // Simple rate limiting to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Document "${metadata.title}" ingested successfully`);
  } catch (error: any) {
    console.error(`Error ingesting document ${filePath}:`, error);
  }
}

// Main function to process a directory of documents
async function processDocumentDirectory(directoryPath: string): Promise<void> {
  try {
    const files = fs.readdirSync(directoryPath);
    
    for (const file of files) {
      if (file.endsWith('.txt') || file.endsWith('.md')) {
        const filePath = path.join(directoryPath, file);
        
        // Extract simple metadata from filename and first line
        const content = fs.readFileSync(filePath, 'utf8');
        const firstLine = content.split('\n')[0];
        
        // Simple metadata extraction - in a real app you'd have better metadata
        const metadata: DocumentMetadata = {
          title: firstLine.replace('#', '').trim() || file.replace('.txt', '').replace('.md', ''),
          source: `Local document: ${file}`,
          authors: ['Unknown'],
          publication_date: new Date().toISOString().split('T')[0],
          document_type: 'research'
        };
        
        await ingestDocument(filePath, metadata);
      }
    }
  } catch (error: any) {
    console.error(`Error processing directory: ${error.message}`);
  }
}

// Run the ingestion process
const docsDirectory = path.join(process.cwd(), 'training-docs');
console.log(`Starting document ingestion from ${docsDirectory}`);
processDocumentDirectory(docsDirectory)
  .then(() => console.log('Document ingestion complete!'))
  .catch(err => console.error('Error in document ingestion:', err));