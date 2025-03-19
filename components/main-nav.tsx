// components/main-nav.tsx (Updated)
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from "@/lib/utils";
import { CalendarDays, BarChart2, Dumbbell } from 'lucide-react';

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const router = useRouter();
  const currentPath = router.pathname;
  
  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path);
  };
  
  return (
    <nav className={cn("flex gap-4", className)}>
      <Link
        href="/protected"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          isActive("/protected") && !isActive("/protected/performance") && !isActive("/protected/plans") && !isActive("/protected/my-plans")
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <CalendarDays size={16} />
        <span>Calendar</span>
      </Link>
      
      <Link
        href="/protected/performance"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
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
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          (isActive("/protected/plans") || isActive("/protected/my-plans"))
            ? "text-primary" 
            : "text-muted-foreground"
        )}
      >
        <Dumbbell size={16} />
        <span>Training Plans</span>
      </Link>
    </nav>
  );
}