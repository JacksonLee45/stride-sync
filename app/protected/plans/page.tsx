"use client";

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

// Define interfaces for type safety
interface PlanData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_weeks: number;
  workouts_per_week: number;
  total_workouts: number;
  highlights: string[];
}

export default function PlansBrowsePage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<PlanData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    duration: 'all',
  });

  // Fetch plans from the API
  useEffect(() => {
    async function fetchPlans() {
      try {
        setIsLoading(true);
        
        // Construct URL with query parameters
        let url = '/api/plans';
        const params = new URLSearchParams();
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (activeCategory !== 'all') {
          params.append('category', activeCategory);
        }
        
        if (filters.difficulty !== 'all') {
          params.append('difficulty', filters.difficulty);
        }
        
        if (filters.duration !== 'all') {
          params.append('duration', filters.duration);
        }
        
        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        
        const data = await response.json();
        setPlans(data);
        setFilteredPlans(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError('Failed to load training plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlans();
  }, [searchTerm, activeCategory, filters]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryChange = (value: string) => {
    setActiveCategory(value);
  };
  
  const handleFilterChange = (type: 'difficulty' | 'duration', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  const getDifficultyColor = (difficulty: string): string => {
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
  
  const getCategoryLabel = (category: string): string => {
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
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4">
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={filters.duration}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('duration', e.target.value)}
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (≤ 8 weeks)</option>
              <option value="medium">Medium (9-12 weeks)</option>
              <option value="long">Long (&gt; 12 weeks)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-destructive/10 border border-destructive text-destructive rounded-md">
          <p>{error}</p>
        </div>
      )}
      
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
                  <Badge className={getDifficultyColor(plan.difficulty_level)}>
                    {plan.difficulty_level.charAt(0).toUpperCase() + plan.difficulty_level.slice(1)}
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
                    <span>{plan.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{plan.workouts_per_week}/week</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/protected/plans/${plan.slug}`}>
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
    </div>
  );
}