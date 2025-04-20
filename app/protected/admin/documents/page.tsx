/* // app/api/admin/documents/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parse } from 'querystring';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as formidable from 'formidable';

// Disable default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

// Function to get embedding from OpenAI
async function getEmbedding(text: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to process and chunk document content
function chunkDocument(content: string, maxChunkSize: number = 1000) {
  const chunks = [];
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

// Process form data from the request
const readFormData = async (req: Request): Promise<any> => {
  const boundary = req.headers.get('content-type')?.split('boundary=')[1];
  if (!boundary) {
    throw new Error('No multipart boundary found');
  }

  // Create a temporary file to store the upload
  const tmpDir = join(process.cwd(), 'tmp');
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (err) {
    console.error('Error creating tmp directory:', err);
  }
  
  const filePath = join(tmpDir, `upload-${uuidv4()}.txt`);
  const arrayBuffer = await req.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  
  // Parse the form data
  const form = formidable({
    uploadDir: tmpDir,
    filename: () => `upload-${uuidv4()}.txt`,
    multiples: false,
  });
  
  return new Promise((resolve, reject) => {
    form.parse(filePath, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        fields,
        files,
      });
    });
  });
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is an admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Since form parsing is complex, we'll use a simpler approach for this MVP
    // Instead of handling multipart form data, we'll process JSON directly
    
    // Parse the request as JSON instead for simplicity
    const { title, content, authors, documentType } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    
    // Split author string into array
    const authorsList = authors ? authors.split(',').map((a: string) => a.trim()) : ['Unknown'];
    
    // Chunk the document
    const chunks = chunkDocument(content);
    console.log(`Processing document: ${title} with ${chunks.length} chunks`);
    
    // Process each chunk
    let insertedChunks = 0;
    for (const chunk of chunks) {
      // Generate embedding
      const embedding = await getEmbedding(chunk);
      
      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('training_documents')
        .insert({
          title,
          content: chunk,
          source: `Admin upload: ${title}`,
          authors: authorsList,
          publication_date: new Date().toISOString().split('T')[0],
          document_type: documentType || 'research',
          embedding
        });
      
      if (insertError) {
        console.error('Error inserting chunk:', insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      insertedChunks++;
    }
    
    return NextResponse.json({ 
      success: true, 
      chunks: insertedChunks 
    });
  } catch (error: any) {
    console.error('Error processing document:', error);
    return NextResponse.json({ 
      error: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
} */