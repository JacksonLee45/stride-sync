// app/protected/plans/layout.tsx
import React from 'react';
import { PlansNav } from "@/components/plans-nav";

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      <div className="border-b mb-6">
        <div className="container py-4">
          <PlansNav />
        </div>
      </div>
      {children}
    </div>
  );
}