// app/api/coach/documents/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';

// Define supported document types
const SUPPORTED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to extract text from a PDF
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read the file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer);
    
    // Return the text content
    return data.text || "";
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return "Error extracting text from PDF";
  }
}

// Helper function to extract text from different file types
async function extractText(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(filePath);
    } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      // For text files, simply read the content
      return fs.readFileSync(filePath, 'utf-8');
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // For DOCX files, we'd use a library like mammoth.js
      // This is a simplified implementation
      // In a production app, install mammoth: npm install mammoth
      // const mammoth = require('mammoth');
      // const result = await mammoth.extractRawText({ path: filePath });
      // return result.value;
      
      // Simplified implementation
      return "Text extracted from DOCX file: " + path.basename(filePath);
    }
    return "Text extraction not supported for this file type";
  } catch (error) {
    console.error('Error extracting text:', error);
    return "Error extracting text from document";
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const documentIds: string[] = [];
    
    try {
      // Parse the form data
      const formData = await request.formData();
      const files = formData.getAll('files');
      
      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
      }
      
      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Process each file
      for (const fileEntry of files) {
        const file = fileEntry as File;
        
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          continue; // Skip files that are too large
        }
        
        // Validate file type
        if (!SUPPORTED_TYPES.includes(file.type)) {
          continue; // Skip unsupported files
        }
        
        // Generate a unique filename
        const uniqueFilename = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadDir, uniqueFilename);
        
        // Convert file to buffer and save to disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        // Extract text from the document
        let text = "";
        if (file.type === 'application/pdf') {
          text = await extractTextFromPDF(filePath);
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
          text = fs.readFileSync(filePath, 'utf-8');
        } else {
          text = `Text extraction not implemented for: ${file.type}`;
        }
        
        // Generate a unique ID for the document
        const documentId = uuidv4();
        
        // Insert document into database
        const { error } = await supabase
          .from('coach_documents')
          .insert({
            id: documentId,
            user_id: user.id,
            title: file.name || 'Untitled Document',
            content: text,
            type: file.type,
            file_size: file.size,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          console.error('Error saving document:', error);
          continue;
        }
        
        documentIds.push(documentId);
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      }
    } catch (err) {
      console.error('Error processing form data:', err);
      return NextResponse.json({ error: 'Error processing form data' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${documentIds.length} documents uploaded successfully`,
      documentIds
    });
    
  } catch (err: any) {
    console.error('Error processing document upload:', err);
    return NextResponse.json(
      { error: 'Failed to process document upload: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}