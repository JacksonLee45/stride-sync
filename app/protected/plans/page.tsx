// app/protected/plans/page.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, Award, ChevronRight, Calendar, Clock
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - this would come from your API
const mockPlans = [
  {
    id: 'plan-5k-beginner',
    name: 'Beginner 5K Training Plan',
    description: 'Perfect for first-time 5K runners or those looking to build consistent running habits.',
    category: '5k',
    difficulty: 'beginner',
    durationWeeks: 8,
    workoutsPerWeek: 3,
    totalWorkouts: 24,
  },
  {
    id: 'plan-5k-intermediate',
    name: 'Intermediate 5K Training Plan',
    description: 'Designed to help runners improve their 5K time with more structured workouts.',
    category: '5k',
    difficulty: 'intermediate',
    durationWeeks: 8,
    workoutsPerWeek: 4,
    totalWorkouts: 32,
  },
  {
    id: 'plan-10k-beginner',
    name: 'Beginner 10K Training Plan',
    description: 'Build endurance and prepare for your first 10K race with this progressive plan.',
    category: '10k',
    difficulty: 'beginner',
    durationWeeks: 10,
    workoutsPerWeek: 3,
    totalWorkouts: 30,
  },
  {
    id: 'plan-10k-intermediate',
    name: 'Intermediate 10K Training Plan',
    description: 'Take your 10K performance to the next level with speed work and targeted training.',
    category: '10k',
    difficulty: 'intermediate',
    durationWeeks: 10,
    workoutsPerWeek: 4,
    totalWorkouts: 40,
  },
  {
    id: 'plan-half-beginner',
    name: 'Beginner Half Marathon Training Plan',
    description: 'Gradually build endurance to complete your first 13.1 mile race with confidence.',
    category: 'half-marathon',
    difficulty: 'beginner',
    durationWeeks: 12,
    workoutsPerWeek: 4,
    totalWorkouts: 48,
  },
  {
    id: 'plan-half-intermediate',
    name: 'Intermediate Half Marathon Training Plan',
    description: 'Improve your half marathon performance with structured workouts and increased mileage.',
    category: 'half-marathon',
    difficulty: 'intermediate',
    durationWeeks: 12,
    workoutsPerWeek: 5,
    totalWorkouts: 60,
  },
  {
    id: 'plan-marathon-beginner',
    name: 'Beginner Marathon Training Plan',
    description: 'A conservative approach to prepare first-time marathoners for the full 26.2 mile distance.',
    category: 'marathon',
    difficulty: 'beginner',
    durationWeeks: 16,
    workoutsPerWeek: 4,
    totalWorkouts: 64,
  },
  {
    id: 'plan-marathon-intermediate',
    name: 'Intermediate Marathon Training Plan',
    description: 'Build on your marathon experience with increased mileage and more specific workouts.',
    category: 'marathon',
    difficulty: 'intermediate',
    durationWeeks: 16,
    workoutsPerWeek: 5,
    totalWorkouts: 80,
  },
  {
    id: 'plan-strength-runner',
    name: 'Runner\'s Strength Training Plan',
    description: 'Complement your running with targeted strength exercises to prevent injury and improve performance.',
    category: 'strength',
    difficulty: 'beginner',
    durationWeeks: 8,
    workoutsPerWeek: 2,
    totalWorkouts: 16,
  },
];

export default function PlansBrowsePage() {
  const [plans, setPlans] = useState(mockPlans);
  const [filteredPlans, setFilteredPlans] = useState(mockPlans);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    duration: 'all',
  });
  
  // In a real implementation, you would fetch data from your API
  useEffect(() => {
    // fetchPlans();
  }, []);
  
  // Filter plans based on search term and active filters
  useEffect(() => {
    let results = plans;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        plan => plan.name.toLowerCase().includes(term) || 
                plan.description.toLowerCase().includes(term)
      );
    }
    
    // Filter by category
    if (activeCategory !== 'all') {
      results = results.filter(plan => plan.category === activeCategory);
    }
    
    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      results = results.filter(plan => plan.difficulty === filters.difficulty);
    }
    
    // Filter by duration
    if (filters.duration !== 'all') {
      switch (filters.duration) {
        case 'short':
          results = results.filter(plan => plan.durationWeeks <= 8);
          break;
        case 'medium':
          results = results.filter(plan => plan.durationWeeks > 8 && plan.durationWeeks <= 12);
          break;
        case 'long':
          results = results.filter(plan => plan.durationWeeks > 12);
          break;
      }
    }
    
    setFilteredPlans(results);
  }, [plans, searchTerm, activeCategory, filters]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryChange = (value) => {
    setActiveCategory(value);
  };
  
  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const getCategoryLabel = (category) => {
    switch (category) {
      case '5k': return '5K';
      case '10k': return '10K';
      case 'half-marathon': return 'Half Marathon';
      case 'marathon': return 'Marathon';
      case 'strength': return 'Strength Training';
      default: return category;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Training Plans</h1>
        <p className="text-muted-foreground">
          Choose from a variety of structured training plans designed to help you achieve your fitness goals.
        </p>
      </header>
      
      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search training plans..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-auto">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:flex-row">
                <TabsTrigger value="all">All Plans</TabsTrigger>
                <TabsTrigger value="5k">5K</TabsTrigger>
                <TabsTrigger value="10k">10K</TabsTrigger>
                <TabsTrigger value="half-marathon">Half Marathon</TabsTrigger>
                <TabsTrigger value="marathon">Marathon</TabsTrigger>
                <TabsTrigger value="strength">Strength</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex gap-2 md:ml-auto">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filters.duration}
              onChange={(e) => handleFilterChange('duration', e.target.value)}
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (≤ 8 weeks)</option>
              <option value="medium">Medium (9-12 weeks)</option>
              <option value="long">Long (> 12 weeks)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 bg-muted rounded-full"></div>
                  <div className="h-5 w-16 bg-muted rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-muted rounded-md mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-muted rounded-md"></div>
                  <div className="h-4 bg-muted rounded-md"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getDifficultyColor(plan.difficulty)}>
                    {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
                  </Badge>
                  <Badge variant="outline">{getCategoryLabel(plan.category)}</Badge>
                </div>
                <CardTitle className="mt-2">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{plan.durationWeeks} weeks</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{plan.workoutsPerWeek}/week</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/protected/plans/${plan.id}`}>
                    View Plan <ChevronRight size={16} className="ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Filter className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No matching plans found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            Try adjusting your search terms or filters to find a training plan that meets your needs.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setActiveCategory('all');
            setFilters({ difficulty: 'all', duration: 'all' });
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}