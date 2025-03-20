// app/protected/plans/layout.tsx
import React from 'react';
import { PlansNav } from "@/components/plans-nav";

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="w-full border-b mb-6">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <PlansNav />
        </div>
      </div>
      {children}
    </div>
  );
}