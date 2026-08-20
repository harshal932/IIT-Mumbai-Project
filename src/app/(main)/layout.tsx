import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { auth } from "@/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-0 sm:px-4 lg:px-8 py-4 gap-6">
        {/* Sidebar for tablet & desktop */}
        <Sidebar
          currentPath=""
          userRole={session?.user?.role}
          className="hidden md:block sticky top-18 h-[calc(100vh-5rem)] border-r border-gray-200 dark:border-gray-800 pr-4"
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-6 px-4 sm:px-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="block md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
