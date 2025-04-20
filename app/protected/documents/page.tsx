// app/protected/documents/page.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

export default function DocumentsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authors, setAuthors] = useState('');
  const [documentType, setDocumentType] = useState('research');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content) {
      toast({
        title: "Missing fields",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const response = await fetch('/api/admin/documents-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          authors,
          documentType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }
      
      const result = await response.json();
      
      toast({
        title: "Document uploaded",
        description: `${result.chunks} chunks successfully processed`,
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setAuthors('');
      setDocumentType('research');
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload failed",
        description: error.message || 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <BookOpen className="mr-2 h-6 w-6" />
        Training Documents
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Document</CardTitle>
          <CardDescription>
            Add scientific papers, training materials, or coaching resources to improve the AI Coach's knowledge.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="e.g., Advanced Marathon Training Methods"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authors">Authors (comma separated)</Label>
              <Input
                id="authors"
                placeholder="e.g., John Smith, Jane Doe"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <select
                id="documentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="research">Research Paper</option>
                <option value="training">Training Guide</option>
                <option value="blog">Blog Post</option>
                <option value="book">Book Excerpt</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Document Content</Label>
              <Textarea
                id="content"
                placeholder="Paste the document content here..."
                className="min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={isUploading || !title || !content}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing document...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}