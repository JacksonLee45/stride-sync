// app/protected/layout.tsx
import { MainNav } from "@/components/main-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-4" />
          <div className="ml-auto flex items-center space-x-4">
            {/* Additional header items could go here */}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}