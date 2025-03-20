// app/protected/layout.tsx
import { MainNav } from "@/components/main-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full mx-auto">
      <div className="w-full border-b">
        <div className="flex h-16 items-center px-4 max-w-5xl mx-auto">
          <div>
            <MainNav />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            {/* Additional header items could go here */}
          </div>
        </div>
      </div>
      
      {/* This wrapper ensures the children always get full width */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}