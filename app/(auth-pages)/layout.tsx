export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl flex flex-col gap-12 items-start min-h-[calc(100vh-15rem)]">{children}</div>
  );
}