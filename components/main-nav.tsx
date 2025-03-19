// components/main-nav.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { CalendarDays, BarChart2 } from 'lucide-react';

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();
  
  return (
    <nav className={cn("flex gap-4", className)}>
      <Link
        href="/protected"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/protected" ? "text-primary" : "text-muted-foreground"
        )}
      >
        <CalendarDays size={16} />
        <span>Calendar</span>
      </Link>
      <Link
        href="/protected/performance"
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/protected/performance" ? "text-primary" : "text-muted-foreground"
        )}
      >
        <BarChart2 size={16} />
        <span>Performance</span>
      </Link>
    </nav>
  );
}