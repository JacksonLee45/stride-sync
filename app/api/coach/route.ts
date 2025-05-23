// app/api/coach/route.ts - Updated with RAG integration
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// This function cleans JSON strings by removing JavaScript-style comments
function cleanJsonString(jsonString: string): string {
  // Remove single-line comments (both // and # styles)
  let cleaned = jsonString.replace(/\/\/.*?($|\n)/g, '');
  cleaned = cleaned.replace(/#.*?($|\n)/g, '');
  
  // Remove multi-line comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove trailing commas before closing brackets/braces
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
  
  return cleaned;
}

// Base system prompt - now we include instructions for using references
const BASE_SYSTEM_PROMPT = `You are Coach Claude, an expert running coach with deep knowledge of exercise physiology, training methodology, and race preparation.

Your goal is to create personalized training plans for runners. Follow this approach:

1. ASSESSMENT:
   - Gather information about the runner's goals (race distance, target time)
   - Understand their current fitness level (weekly mileage, recent races)
   - Learn about their schedule constraints and preferences
   - Ask about injury history and concerns
   - Determine their experience level with running

2. PLAN DEVELOPMENT:
   - Apply science-based training principles
   - Include appropriate workout types based on their goal race
   - Respect their time constraints and preferences
   - Build progressions that follow established training principles
   - Incorporate rest and recovery appropriately

3. COMMUNICATION:
   - Ask one question at a time to gather information
   - Be conversational but focused on creating an effective plan
   - When you have enough information, generate a training plan
   - Explain the purpose of different workouts in the plan

4. CITATION:
   - When providing advice based on scientific research, cite the specific source
   - Format citations as [Author, Title] or [Source]
   - Use retrieved documents to provide evidence-based advice

When creating a training plan, use these established principles:
- Progressive overload
- Specificity
- Periodization (base, build, peak, taper)
- Polarized training (80/20 rule)
- Individualization based on experience and constraints

When you're ready to provide the final plan, include a JSON structure with the plan details in this format:

\`\`\`json
{
  "workoutPlan": {
    "planName": "8-Week 5K Training Plan for Beginners",
    "planDescription": "A gradual plan to help you reach your first 5K goal with 3 runs per week",
    "targetRace": "5K",
    "duration": "8 weeks",
    "workouts": [
      {
        "title": "Easy Run",  // REQUIRED
        "date": "2025-03-25", // REQUIRED - must be in YYYY-MM-DD format
        "type": "run",        // REQUIRED - must be either "run" or "weightlifting"
        "runType": "Easy",    // REQUIRED for run workouts
        "distance": 2.5,      // REQUIRED for run workouts (in miles)
        "pace": "comfortable conversation pace",
        "notes": "Focus on maintaining good form"
      },
      {
        "title": "Strength Training", // REQUIRED
        "date": "2025-03-26",        // REQUIRED - must be in YYYY-MM-DD format
        "type": "weightlifting",     // REQUIRED
        "focusArea": "Core & Lower Body", // REQUIRED for weightlifting workouts
        "duration": "30 minutes",    // REQUIRED for weightlifting workouts
        "notes": "Focus on form and control"
      }
    ]
  }
}
\`\`\`

DATE REQUIREMENTS (CRITICAL):
1. ALL workout dates MUST be in the future, starting from the CURRENT DATE.
2. The first workout MUST start either TODAY or in the FUTURE (no past dates).
3. Use the correct YYYY-MM-DD format (e.g., 2025-03-25).
4. The current date is ${new Date().toISOString().split('T')[0]}.
5. Double-check that all dates are AFTER or EQUAL TO ${new Date().toISOString().split('T')[0]}.
6. NEVER generate workout dates in the past, such as 2023 or 2024 before today's date.
7. Calculate dates correctly, ensuring weekdays align properly (e.g., if today is Monday, 7 days from now is also Monday).

IMPORTANT FORMATTING RULES:
1. Do NOT use JavaScript comments (// or /* */) in the JSON.
2. Do NOT use trailing commas in arrays or objects.
3. Include ALL workouts in the workouts array - do not abbreviate with comments.
4. Each workout MUST include all required fields listed above.
5. After generating the JSON plan, conclude with: "Your personalized training plan is ready! Would you like to save this plan to your calendar?"

This specific message is important for the app interface to recognize that the plan is ready to be saved.

Ensure the workouts follow these principles:
- Realistic progression (no more than 10% mileage increase per week)
- Appropriate mix of workout types (easy runs, speed work, long runs)
- Proper spacing of hard efforts
- Inclusion of rest days
- Specific to the target race distance

For run workouts, include details like distance, pace guidance, and purpose.
For strength workouts, include the focus area and duration.

Start the conversation by asking about their running goals. During the conversation, be friendly, encouraging, and demonstrate your expertise as a running coach.`;

// Function to generate embeddings
async function generateEmbedding(text: string) {
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
      console.error('Error from OpenAI:', result.error);
      throw new Error(result.error.message);
    }
    return result.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to analyze conversation and update user profile
async function updateUserTrainingProfile(userId: string, messages: any[]) {
  try {
    const supabase = await createClient();
    
    // Extract key training information from the conversation
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(" ");
    
    // Use Claude to analyze the conversation - using fetch directly to analyze
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system: `You're an exercise physiologist analyzing a conversation between a runner and coach. 
        Extract key training information:
        1. Runner's experience level
        2. Weekly mileage
        3. Target race distance
        4. Training pace information
        5. Injury history
        
        Output as JSON with these fields. If information is not available, mark as null.`,
        messages: [
          {
            role: "user",
            content: `Here is a conversation with a runner. Extract key training information: ${userMessages}`
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze conversation');
    }
    
    const data = await response.json();
    
    // Get the response text
    const analysisText = data.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => (block.type === 'text' ? block.text : ''))
      .join('');
    
    const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const trainingProfile = JSON.parse(jsonMatch[1]);
      
      // Update or insert user profile
      const { error } = await supabase
        .from('user_fitness_profiles')
        .upsert({
          user_id: userId,
          experience_level: trainingProfile.experience_level,
          weekly_mileage_avg: trainingProfile.weekly_mileage,
          training_paces: trainingProfile.pace_information,
          injuries_history: trainingProfile.injury_history,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating user profile:', error);
      }
    }
  } catch (err) {
    console.error('Error analyzing conversation:', err);
    // Non-critical, we can continue without profile update
  }
}

// Save conversation for feedback and improvement
async function saveConversation(userId: string, messages: any[], workoutPlan: any | null) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('ai_coaching_sessions')
      .insert({
        user_id: userId,
        conversation: messages,
        plan_generated: !!workoutPlan,
        workouts_created: workoutPlan ? workoutPlan.workouts.length : 0
      });
    
    if (error) {
      console.error('Error saving conversation:', error);
    }
  } catch (err) {
    console.error('Error in saveConversation:', err);
    // Non-critical, we can continue without saving
  }
}

// Function to fetch relevant documents from vector database
async function fetchRelevantDocuments(query: string, supabase: any) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar documents in Supabase
    const { data: documents, error } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: 3
      }
    );
    
    if (error) {
      console.error('Error searching for relevant documents:', error);
      return [];
    }
    
    return documents || [];
  } catch (error) {
    console.error('Error fetching relevant documents:', error);
    return [];
  }
}

// app/api/coach/route.ts - Updated for streaming with RAG
export async function POST(request: Request) {
  const supabase = await createClient();
  
  // Authentication check...
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  
  const { messages } = await request.json();
  
  // Extract the latest user message for RAG retrieval
  const lastUserMessage = messages
    .filter((m: any) => m.role === 'user')
    .slice(-1)[0]?.content || '';
  
  // Fetch relevant documents
  const relevantDocuments = await fetchRelevantDocuments(lastUserMessage, supabase);
  
  // Format documents as context
  const contextText = relevantDocuments.length > 0 
    ? relevantDocuments.map((doc: any) => 
        `SOURCE: ${doc.title}
          CONTENT: ${doc.content}
          SOURCE_TYPE: ${doc.document_type || 'research'}
          CITATION: [${doc.authors?.join(', ') || 'Unknown'}, ${doc.title}]
          SIMILARITY: ${Math.round(doc.similarity * 100)}%

`)
    .join('\n')
    : 'No specific resources available for this query.';
  
  // Prepare system prompt with context
  const systemPromptWithContext = `${BASE_SYSTEM_PROMPT}

REFERENCE DOCUMENTS (Use these to provide scientific backing to your advice):
${contextText}

When using information from these documents, cite them using the provided CITATION format.
`;
  
  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create Anthropic fetch request with stream: true
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4000,
            system: systemPromptWithContext,
            messages: messages,
            stream: true
          })
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        if (!response.body) throw new Error('Response body is null');
        
        const reader = response.body.getReader();
        let fullText = '';
        let workoutPlan = null;
        
        // Process the stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Parse the SSE data
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                
                if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
                  const textChunk = data.delta.text;
                  fullText += textChunk;
                  
                  // Send text chunk to client
                  controller.enqueue(encoder.encode(JSON.stringify({ 
                    type: 'chunk', 
                    content: textChunk 
                  }) + '\n'));
                } else if (data.type === 'message_stop') {
                  // Message is complete - check for workout plan in the content
                  const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
                  if (jsonMatch && jsonMatch[1]) {
                    try {
                      // Clean the JSON string before parsing
                      const cleanedJsonString = cleanJsonString(jsonMatch[1]);
                      const parsedJson = JSON.parse(cleanedJsonString);
                      workoutPlan = parsedJson.workoutPlan || null;
                      
                      // Log the cleaned JSON for debugging
                      console.log('Cleaned JSON successfully parsed');
                      
                      // Explicitly flag that a plan was found
                      const planFound = !!workoutPlan;
                      
                      // Send complete message with workout plan status
                      controller.enqueue(encoder.encode(JSON.stringify({ 
                        type: 'complete', 
                        workoutPlan: workoutPlan,
                        planFound: planFound,
                        citations: data.message?.citations || [],
                        sources: relevantDocuments.map((doc: any) => ({
                          title: doc.title,
                          authors: doc.authors,
                          similarity: doc.similarity
                        }))
                      }) + '\n'));
                    } catch (error) {
                      console.error('Error parsing workout plan JSON:', error);
                      // Send the error but continue
                      controller.enqueue(encoder.encode(JSON.stringify({ 
                        type: 'complete', 
                        parseError: true,
                        errorDetails: error instanceof Error ? error.message : 'Unknown JSON parsing error',
                        rawJsonString: jsonMatch[1], // Send the raw JSON string for client-side handling
                        citations: data.message?.citations || [],
                        sources: relevantDocuments.map((doc: any) => ({
                          title: doc.title,
                          authors: doc.authors,
                          similarity: doc.similarity
                        }))
                      }) + '\n'));
                    }
                  } else {
                    // No JSON found in the response
                    controller.enqueue(encoder.encode(JSON.stringify({ 
                      type: 'complete', 
                      planFound: false,
                      citations: data.message?.citations || [],
                      sources: relevantDocuments.map((doc: any) => ({
                        title: doc.title,
                        authors: doc.authors,
                        similarity: doc.similarity
                      }))
                    }) + '\n'));
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        // Save conversation after completion
        const finalMessage = { role: 'assistant', content: fullText };
        saveConversation(user.id, [...messages, finalMessage], workoutPlan);
        
        // If we should update user profile...
        if (messages.length > 3) {
          updateUserTrainingProfile(user.id, [...messages, finalMessage]);
        }
        
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}