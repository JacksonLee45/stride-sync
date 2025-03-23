// components/ai-coach-page.tsx - Updated to support citations
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
  Zap,
  CheckCircle,
  BookOpen
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";

// Define message types for the conversation
type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

// Interface for citations that might be provided by Claude
interface Citation {
  start: number;
  end: number;
  text: string;
  document_ids: string[];
  document_titles?: string[];
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
  const [citations, setCitations] = useState<Citation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

// Handle sending a message to the AI coach
const handleSendMessage = async () => {
  if (!input.trim() || isLoading) return;

  // Add user message to the conversation
  const userMessage = { role: 'user' as MessageRole, content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput('');
  setIsLoading(true);
  
  // Add a placeholder for the assistant's response
  setMessages(prev => [...prev, { role: 'assistant' as MessageRole, content: '' }]);

  try {
    // Send the conversation history to the AI coach API
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...messages, userMessage],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Coach');
    }

    // Process the streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    // Initialize accumulated content
    let accumulatedContent = '';
    
    // Read and process each chunk
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'chunk') {
            // Update the current assistant message with new text
            accumulatedContent += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: 'assistant' as MessageRole,
                content: accumulatedContent
              };
              return newMessages;
            });
            
            // Auto-scroll to bottom
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          } else if (data.type === 'complete') {
            // When complete, check for workout plan
            if (data.workoutPlan) {
              setWorkoutPlan(data.workoutPlan);
              setConversationState('plan-ready');
              setProgress(100);
            }
            
            // Store citations if available
            if (data.citations && Array.isArray(data.citations)) {
              setCitations(data.citations);
            }
            
            // Update progress based on conversation state
            if (progress < 90) {
              setProgress(prev => Math.min(prev + 20, 90));
            }
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        } catch (e) {
          console.error('Error parsing stream chunk:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error communicating with Coach:', error);
    setMessages(prev => {
      // Replace the last message with an error message
      const newMessages = [...prev];
      newMessages[newMessages.length - 1] = { 
        role: 'assistant' as MessageRole, 
        content: "I'm sorry, I encountered an error while processing your request. Please try again."
      };
      return newMessages;
    });
    
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

  const resetConversation = () => {
    setMessages([]);
    setWorkoutPlan(null);
    setConversationState('initial');
    setProgress(0);
    setCitations([]);
  };

  const renderMessageWithCitations = (message: string, messageCitations: Citation[]) => {
    if (!messageCitations || messageCitations.length === 0) {
      return <p className="whitespace-pre-wrap">{message}</p>;
    }

    // Sort citations by their start position in descending order
    // so we can replace from end to start without messing up indices
    const sortedCitations = [...messageCitations].sort((a, b) => b.start - a.start);
    
    let parts = message;
    
    // Replace each citation with a highlighted version
    sortedCitations.forEach((citation, index) => {
      if (citation.start !== undefined && citation.end !== undefined) {
        const prefix = parts.substring(0, citation.start);
        const citedText = parts.substring(citation.start, citation.end);
        const suffix = parts.substring(citation.end);
        
        // Create a unique key for this citation
        const citationKey = `citation-${index}`;
        
        // Replace with JSX element (will be converted to string and handled below)
        parts = `${prefix}<<${citationKey}>>${citedText}<</citation>>${suffix}`;
      }
    });
    
    // Convert string with placeholders to actual React elements
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    
    sortedCitations.forEach((citation, index) => {
      const citationKey = `citation-${index}`;
      const startTag = `<<${citationKey}>>`;
      const endTag = '<</citation>>';
      
      const startIndex = parts.indexOf(startTag, currentIndex);
      if (startIndex === -1) return;
      
      // Add text before citation
      if (startIndex > currentIndex) {
        elements.push(parts.substring(currentIndex, startIndex));
      }
      
      // Extract cited text
      const contentStart = startIndex + startTag.length;
      const contentEnd = parts.indexOf(endTag, contentStart);
      const citedText = parts.substring(contentStart, contentEnd);
      
      // Get document titles if available
      const docTitles = citation.document_titles?.join(', ') || 'Source document';
      
      // Add citation with tooltip
      elements.push(
        <TooltipProvider key={citationKey}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="bg-primary/10 px-1 py-0.5 rounded text-primary hover:bg-primary/20 cursor-help">
                {citedText}
                <sup className="ml-0.5">
                  <BookOpen className="inline h-3 w-3" />
                </sup>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs font-medium">Citation</p>
              <p className="text-xs">{docTitles}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      
      // Update current index
      currentIndex = contentEnd + endTag.length;
    });
    
    // Add any remaining text
    if (currentIndex < parts.length) {
      elements.push(parts.substring(currentIndex));
    }
    
    return <p className="whitespace-pre-wrap">{elements}</p>;
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
                      {message.role === 'assistant' 
                        ? renderMessageWithCitations(message.content, citations)
                        : <p className="whitespace-pre-wrap">{message.content}</p>
                      }
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
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Side panel for plan details and documents - takes 1/3 of space */}
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
            
            {/* Information about document knowledge */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>About Coach Claude</CardTitle>
                <CardDescription>
                  Powered by expert running knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Coach Claude has been trained on a curated collection of running and training documents, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Advanced Marathon Training Methods</li>
                    <li>Science of Running: Economy and Form</li>
                    <li>Injury Prevention for Distance Runners</li>
                    <li>5K/10K Training Methodology</li>
                    <li>Periodization for Endurance Athletes</li>
                  </ul>
                  <p>
                    The coach will automatically reference relevant information from these resources to create your personalized training plan.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
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