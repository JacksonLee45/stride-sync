"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import dynamic from 'next/dynamic';
import { ConfigProvider, theme } from 'antd';
import { useTheme } from 'next-themes';
import WorkoutFormDialog from "./workout-form-dialog";
import styles from '@/styles/calendar.module.css';

// Dynamically import the Calendar component from antd with no SSR
// This prevents hydration errors since antd's Calendar relies on browser APIs
const Calendar = dynamic(
  () => import('antd').then((antd) => antd.Calendar),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

// Skeleton loader component for the calendar
function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-muted rounded mb-4"></div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 bg-muted rounded"></div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, weekIndex) => (
        <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2 mt-2">
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div 
              key={`day-${weekIndex}-${dayIndex}`} 
              className="h-24 bg-muted/50 rounded flex items-center justify-center"
            >
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Function to handle calendar date cell rendering
  const dateCellRender = (value: any) => {
    // Here you would typically check if there are workouts for this date
    // and render them accordingly
    return null;
  };

  // Get the current theme
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Custom theme configuration for Ant Design
  const customTheme = {
    token: {
      colorPrimary: '#2563eb', // Blue primary color
      borderRadius: 8,
      colorBgContainer: isDarkMode ? '#111' : '#fff',
      colorBgElevated: isDarkMode ? '#1e1e1e' : '#fff',
      colorText: isDarkMode ? '#e5e5e5' : '#111',
      colorTextSecondary: isDarkMode ? '#a3a3a3' : '#6b7280',
      colorSplit: isDarkMode ? '#333' : '#e5e5e5',
      colorBorder: isDarkMode ? '#333' : '#e5e5e5',
    },
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <div className="flex-1 w-full p-4 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Workout Calendar</h1>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Workout
        </Button>
      </header>

      <div className="bg-card rounded-lg border shadow-sm p-4">
        {isClient && (
          <ConfigProvider theme={customTheme}>
            <div className={styles.calendarWrapper}>
              <Calendar 
                fullscreen={true} 
                cellRender={dateCellRender}
              />
            </div>
          </ConfigProvider>
        )}
      </div>

      <WorkoutFormDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}