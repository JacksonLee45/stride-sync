"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Brain, 
  SendHorizonal, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  Upload, 
  Zap,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";

// Define message types for the conversation
type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

interface WorkoutPlan {
  workouts: any[];
  planName: string;
  planDescription: string;
  targetRace?: string;
  duration?: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState<'initial' | 'in-progress' | 'plan-ready'>('initial');
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize the conversation when the component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessages: Message[] = [
        {
          role: 'assistant',
          content: "Hi, I'm Coach Claude! I'll help create a personalized training plan tailored to your goals and fitness level. Let's start with your primary goal - what are you training for? (e.g., 5K, 10K, half marathon, marathon, or general fitness)"
        }
      ];
      setMessages(initialMessages);
      setConversationState('in-progress');
      // Set initial progress
      setProgress(10);
    }
  }, [messages.length]);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to the conversation
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send the conversation history to the AI coach API
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          documentIds: [], // We'll add document IDs here when we implement document upload
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Coach');
      }

      const data = await response.json();
      
      // Add the AI's response to the conversation
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      // Update progress based on conversation state
      if (progress < 90) {
        setProgress(prev => Math.min(prev + 20, 90));
      }
      
      // Check if the AI has generated a training plan
      if (data.workoutPlan) {
        setWorkoutPlan(data.workoutPlan);
        setConversationState('plan-ready');
        setProgress(100);
      }
    } catch (error) {
      console.error('Error communicating with Coach:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error while processing your request. Please try again."
        }
      ]);
      toast({
        variant: "destructive",
        title: "Communication Error",
        description: "There was a problem connecting with Coach. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      setUploadedDocuments(prev => [...prev, ...files]);
      
      // Upload files to the server
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/coach/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }
      
      const data = await response.json();
      
      toast({
        title: "Documents Uploaded",
        description: `${files.length} document(s) uploaded successfully. Coach will reference these in the conversation.`
      });
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "There was a problem uploading your documents. Please try again."
      });
      // Remove the failed uploads from the list
      setUploadedDocuments(prev => prev.slice(0, prev.length - e.target.files!.length));
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveWorkoutPlan = async () => {
    if (!workoutPlan) return;
    
    setIsLoading(true);
    try {
      // Send the workout plan to the server to save in the database
      const response = await fetch('/api/coach/save-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutPlan,
          conversationId: null // You could generate and track conversation IDs if needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workout plan');
      }

      const data = await response.json();
      
      toast({
        title: "Training Plan Saved!",
        description: `${data.savedWorkouts} workouts have been added to your calendar.`,
      });
      
      // Redirect to the calendar view after a short delay
      setTimeout(() => {
        router.push('/protected');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving workout plan:', error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "There was a problem saving your training plan. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setWorkoutPlan(null);
    setConversationState('initial');
    setProgress(0);
    setUploadedDocuments([]);
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto p-4">
        <header className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2 pl-0"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Coach Claude</h1>
              <p className="text-muted-foreground">Your AI running coach powered by Claude</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat area - takes 2/3 of space on larger screens */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Training Consultation</CardTitle>
                <CardDescription>Chat with Coach Claude to create your personalized training plan</CardDescription>
                <Progress value={progress} className="mt-2" />
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[calc(100vh-300px)]">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Coach is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={triggerFileInput}
                    disabled={isUploading || conversationState === 'plan-ready'}
                    title="Upload running resources for Coach to reference"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={isLoading || conversationState === 'plan-ready'}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading || conversationState === 'plan-ready'}
                    size="icon"
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </Button>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDocumentUpload}
                    accept=".pdf,.txt,.md,.docx"
                    multiple
                    className="hidden"
                  />
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Side panel for plan details and uploaded documents - takes 1/3 of space */}
          <div className="lg:col-span-1">
            {/* Plan details card - only shown when plan is ready */}
            {conversationState === 'plan-ready' && workoutPlan && (
              <Card className="mb-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                      Plan Ready
                    </Badge>
                    <CheckCircle className="text-green-600 dark:text-green-400 h-5 w-5" />
                  </div>
                  <CardTitle>{workoutPlan.planName}</CardTitle>
                  <CardDescription>{workoutPlan.planDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    {workoutPlan.targetRace && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Target Race:</span>
                        <span className="font-medium">{workoutPlan.targetRace}</span>
                      </div>
                    )}
                    {workoutPlan.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{workoutPlan.duration}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workouts:</span>
                      <span className="font-medium">{workoutPlan.workouts.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={saveWorkoutPlan}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Plan...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Add to Calendar
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Uploaded documents card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Training Resources</CardTitle>
                <CardDescription>
                  Upload training documents for Coach to reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploadedDocuments.length > 0 ? (
                  <ul className="space-y-2">
                    {uploadedDocuments.map((doc, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        <span className="truncate flex-1" title={doc.name}>
                          {doc.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {(doc.size / 1024).toFixed(0)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm mb-2">No documents uploaded yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start space-y-2 pt-0">
                <p className="text-xs text-muted-foreground">
                  Upload PDFs of training books, research papers, or coaching guides to help Coach create better plans.
                </p>
                {conversationState !== 'initial' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={resetConversation}
                  >
                    <Zap className="mr-1 h-3 w-3" />
                    Start New Conversation
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}