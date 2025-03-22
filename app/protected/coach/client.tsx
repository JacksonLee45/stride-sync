'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function CoachClient() {
  const [CoachComponent, setCoachComponent] = useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import the component only on the client side
    import('@/components/ai-coach-page')
      .then((module) => {
        setCoachComponent(() => module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading coach component:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Coach...</p>
      </div>
    );
  }

  // Render the dynamically loaded component if available
  if (CoachComponent) {
    return <CoachComponent />;
  }

  return (
    <div className="p-4 text-center">
      <p>There was a problem loading the Coach interface. Please try refreshing the page.</p>
    </div>
  );
}