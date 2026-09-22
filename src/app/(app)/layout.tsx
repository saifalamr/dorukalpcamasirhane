import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 px-4 py-5 md:px-8 md:py-7 md:max-w-[1400px] w-full">
        {children}
      </main>
    </div>
  );
}
