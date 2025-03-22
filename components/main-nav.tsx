// components/main-nav.tsx (updated)
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { CalendarDays, BarChart2, Dumbbell, Brain } from 'lucide-react';

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Link
        href="/protected"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-4",
          isActive("/protected") && !isActive("/protected/performance") && !isActive("/protected/plans") && !isActive("/protected/coach") && !isActive("/protected/my-plans")
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <CalendarDays size={16} />
        <span>Calendar</span>
      </Link>
      
      <Link
        href="/protected/coach"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-4",
          isActive("/protected/coach") 
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <Brain size={16} />
        <span>AI Coach</span>
      </Link>
      
      <Link
        href="/protected/performance"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-4",
          isActive("/protected/performance") 
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <BarChart2 size={16} />
        <span>Performance</span>
      </Link>
      
      <Link
        href="/protected/plans"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary px-4",
          (isActive("/protected/plans") || isActive("/protected/my-plans"))
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <Dumbbell size={16} />
        <span>Training Plans</span>
      </Link>
    </div>
  );
}