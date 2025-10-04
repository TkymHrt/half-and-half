import { BottomNav } from "@/components/app/bottom-nav";
import { MockDataSeeder } from "@/components/app/mock-data-seeder";

export default function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MockDataSeeder />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}