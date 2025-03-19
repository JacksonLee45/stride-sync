import React from 'react';
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, BarChart2, Award, CheckCircle, Users } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between py-6 md:py-12">
        <div className="flex flex-col space-y-6 md:w-1/2 mb-10 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Take Control of Your <span className="text-primary">Training Journey</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Schedule, track, and analyze your workouts with precision. 
            StrideSync helps athletes of all levels stay on pace with their goals.
          </p>
          <div className="flex gap-4 pt-4">
          <Button size="lg" asChild className="gap-2">
            <Link href="/sign-up">
                Get Started <ArrowRight size={16} />
            </Link>
          </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md aspect-square bg-primary/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <div className="absolute inset-0 p-8">
              <div className="w-full h-full bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Training Calendar</h3>
                  <Calendar size={20} className="text-primary" />
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const day = i - 3;
                    const isToday = day === 14;
                    const hasWorkout = [2, 5, 8, 11, 14, 17, 20, 23].includes(day);
                    const isCompleted = [2, 5, 8, 11].includes(day);
                    
                    return (
                      <div 
                        key={i} 
                        className={`
                          aspect-square flex flex-col items-center justify-center rounded-md text-xs
                          ${day < 1 || day > 31 ? 'invisible' : ''}
                          ${isToday ? 'bg-primary text-primary-foreground' : 
                            hasWorkout && isCompleted ? 'bg-green-100 dark:bg-green-900/30 border-l-2 border-green-500' : 
                            hasWorkout ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                        `}
                      >
                        <span>{day > 0 && day <= 31 ? day : ''}</span>
                        {hasWorkout && (
                          <div className="w-1.5 h-1.5 rounded-full bg-current mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md text-xs flex justify-between">
                    <span>5K Tempo Run</span>
                    <span>7:30 AM</span>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md text-xs flex justify-between">
                    <span>Core Strength</span>
                    <span>6:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Athletes Choose StrideSync</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed for performance-focused individuals who take their training seriously
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Calendar</h3>
              <p className="text-muted-foreground">
                Plan your workouts with precision and never miss a training day.
                View your entire program at a glance.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart2 className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Tracking</h3>
              <p className="text-muted-foreground">
                Log completed workouts and track your progress over time with detailed metrics.
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Award className="text-primary h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Training Plans</h3>
              <p className="text-muted-foreground">
                Access structured training plans for various goals, from 5K to marathon and strength programs.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How StrideSync Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A simple yet powerful approach to workout planning and tracking
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Schedule Workouts</h3>
              <p className="text-muted-foreground">
                Add runs, strength training, or other workouts to your calendar with detailed plans and goals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Complete Sessions</h3>
              <p className="text-muted-foreground">
                Record your actual performance data, including distance, pace, heart rate, and more.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <span className="text-primary font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Analyze your training data to identify patterns and improvements in your performance.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials (Placeholder) */}
      <section className="py-20 bg-muted/50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Athletes Love StrideSync</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how StrideSync is helping athletes reach their potential
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 mr-4"></div>
                <div>
                  <h4 className="font-semibold">Sarah J.</h4>
                  <p className="text-sm text-muted-foreground">Marathon Runner</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">
                "StrideSync helped me stay consistent with my marathon training. Being able to see my weekly mileage and track my progress made a huge difference in my preparation."
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-xl shadow-sm border">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 mr-4"></div>
                <div>
                  <h4 className="font-semibold">Michael T.</h4>
                  <p className="text-sm text-muted-foreground">CrossFit Athlete</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">
                "I love how flexible StrideSync is for tracking both my strength training and cardio workouts. The calendar view helps me balance my training throughout the week."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Elevate Your Training?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join StrideSync today and start tracking your workouts with precision.
            Your next personal best is waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Link href="/sign-up" className="flex items-center gap-2">
                Sign Up Now <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" />
              <span className="text-sm">Free to get started</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-primary" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;