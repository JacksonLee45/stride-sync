// components/plans-nav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Calendar, Dumbbell, BarChart2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export function PlansNav({ className }: { className?: string }) {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };
  
  return (
    <nav className={cn("flex space-x-4", className)}>
      <Link
        href="/protected/plans"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          isActive("/protected/plans") && !isActive("/protected/my-plans") 
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <Dumbbell size={16} />
        <span>Browse Plans</span>
      </Link>
      
      <Link
        href="/protected/my-plans"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          isActive("/protected/my-plans") 
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <Calendar size={16} />
        <span>My Plans</span>
      </Link>
    </nav>
  );
}