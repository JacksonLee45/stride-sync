# StrideSync: AI-Powered Workout Tracking App

StrideSync is a comprehensive workout tracking platform designed to help runners and fitness enthusiasts plan, track, and analyze their training. The application features an AI coach powered by Claude, personalized training plans, and detailed performance analytics.

Deployed here! https://stride-sync.vercel.app/

## Features

### AI Coach
- Personalized training plans generated by Claude AI
- Intelligent workout recommendations based on user goals and fitness level
- Natural language conversation interface to create custom training schedules

### Performance Analytics
- Interactive data visualizations showing workout trends
- Weekly and monthly mileage tracking
- Workout type distribution and completion rate metrics
- Advanced charts for analyzing progress over time

### Smart Calendar
- Interactive workout calendar for scheduling sessions
- Support for different workout types (runs, strength training)
- Workout completion tracking and statistics
- Detailed workout properties (distance, pace, duration, etc.)

### Training Plans
- Browse and enroll in pre-built training plans for 5K, 10K, half-marathon, and more
- Track your progress through enrolled plans
- Personalize plans to fit your schedule and goals

## Technology Stack

### Frontend
- **Next.js 13+ (App Router)** - Server components, client components, API routes
- **React 19** - Functional components with hooks for state management
- **TypeScript** - Type safety and enhanced developer experience
- **Tailwind CSS** - Utility-first styling with a comprehensive design system
- **shadcn/ui** - Accessible and customizable UI components
- **Recharts** - Interactive and responsive chart visualizations
- **Ant Design** - Calendar component with custom theming

### Backend
- **Supabase** - Authentication, database, and row-level security policies
- **Supabase Auth** - Cookie-based authentication with SSR support
- **PostgreSQL** - Relational database with data modeling
- **Anthropic Claude API** - AI assistant integration for personalized coaching

### DevOps & Deployment
- **Vercel** - Seamless deployment and serverless functions
- **Environment Variables** - Secure configuration management

## Architecture & Implementation Details

### Authentication Flow
The application uses Supabase Auth with cookie-based authentication, enabling server-side rendering while maintaining secure user sessions across the entire Next.js stack (middleware, server components, client components).

### Database Schema
The database is structured around several key entities:
- Users (via Supabase Auth)
- Workouts (with specialized subtypes for runs and strength training)
- Training plans and user enrollments
- AI coaching sessions

### Advanced Features

#### AI Coach Implementation
The AI coach leverages Claude's capabilities to:
1. Analyze user goals and fitness level through conversation
2. Generate structured workout plans as JSON
3. Create calendar entries automatically
4. Reference training principles and best practices

#### Row-Level Security
All database access is protected by Supabase RLS policies, ensuring users can only access their own data while maintaining a seamless development experience.

#### Performance Optimization
- Dynamic imports for improved page load performance
- Streaming responses for AI interactions
- SSR for critical pages and CSR for interactive components

## Running Locally

1. Clone the repository
```bash
git clone https://github.com/JacksonLee45/stride-sync
cd stride-sync
```

2. Install Dependencies
```
npm install
```

3. Set up environment variables
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

4. Run the development server
```
npm run dev
```

## Deployment

This project is configured for seamless deployment on Vercel with the Supabase integration. Simply connect your GitHub repository to Vercel and set up the required environment variables.

## Technical Challenges & Solutions

### Workout Data Modeling
Creating a flexible data model to support different workout types while maintaining query efficiency required a combination of base tables and specialized extensions. This approach provides type-specific details while enabling unified queries.

### AI Integration
Implementing the AI coach required careful prompt engineering and structured output parsing. The system uses:
- Custom system prompts for guiding the AI's expertise
- JSON response parsing for workout plan extraction
- Stream processing for real-time conversation updates

### Theme System
The application features a fully responsive light/dark theme that seamlessly integrates with third-party components. Custom CSS and theme variables ensure consistent styling across the entire application.

## Future Improvements
- Mobile app using React Native
- Integration with wearable devices and fitness APIs
- Advanced training plan customization and AI-driven adaptations
- Community features and social sharing

## License
This project is licensed under the MIT License - see the LICENSE file for details.
