// app/api/coach/route.ts - Implemented with Claude Web API and Knowledge Retrieval
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Base system prompt - now we don't need to include document content
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
        "title": "Easy Run",
        "date": "2025-03-25",
        "type": "run",
        "runType": "Easy",
        "distance": 2.5,
        "pace": "comfortable conversation pace",
        "notes": "Focus on maintaining good form"
      },
      ...more workouts...
    ]
  }
}
\`\`\`

Ensure the workouts follow these principles:
- Realistic progression (no more than 10% mileage increase per week)
- Appropriate mix of workout types (easy runs, speed work, long runs)
- Proper spacing of hard efforts
- Inclusion of rest days
- Specific to the target race distance

For run workouts, include details like distance, pace guidance, and purpose.
For strength workouts, include the focus area and duration.

Start the conversation by asking about their running goals. During the conversation, be friendly, encouraging, and demonstrate your expertise as a running coach.`;

// Collection ID from Anthropic Console
// const KNOWLEDGE_COLLECTION_ID = process.env.ANTHROPIC_COLLECTION_ID || 'YOUR_COLLECTION_ID_HERE';

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const { messages } = await request.json();
    
    // Prepare messages for Claude
    const claudeMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Call Claude using fetch to access Web API features
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229", // Use the most capable model for high-quality coaching
        max_tokens: 4000,
        system: BASE_SYSTEM_PROMPT,
        messages: claudeMessages
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const completion = await response.json();
    
    // Get Claude's response - properly handle the content blocks
    const aiResponse = completion.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => (block.type === 'text' ? block.text : ''))
      .join('');
    
    // If this is a substantial conversation, update the user's training profile
    if (messages.length > 3) {
      updateUserTrainingProfile(user.id, [...messages, { role: 'assistant', content: aiResponse }]);
    }
    
    // Check if the response contains a workout plan JSON
    let workoutPlan = null;
    const jsonMatch = aiResponse.match(/```json\s*({[\s\S]*?})\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsedJson = JSON.parse(jsonMatch[1]);
        workoutPlan = parsedJson.workoutPlan;
        
        // Clean up the AI response to remove the JSON block
        const cleanResponse = aiResponse
          .replace(/```json\s*{[\s\S]*?}\s*```/, '')
          .trim();
        
        // Save the conversation with the workout plan
        saveConversation(user.id, [...messages, { role: 'assistant', content: cleanResponse }], workoutPlan);
        
        return NextResponse.json({
          message: cleanResponse,
          workoutPlan: workoutPlan,
          citations: completion.citations || []
        });
      } catch (error) {
        console.error('Error parsing workout plan JSON:', error);
      }
    }
    
    // If no plan was found or parsed, just return the message
    // Still save the conversation for future analysis
    saveConversation(user.id, [...messages, { role: 'assistant', content: aiResponse }], null);
    
    return NextResponse.json({
      message: aiResponse,
      citations: completion.citations || []
    });
    
  } catch (err: any) {
    console.error('Error in AI coach API:', err);
    return NextResponse.json(
      { error: 'Failed to process your request: ' + (err.message || 'Unknown error') },
      { status: 500 }
    );
  }
}