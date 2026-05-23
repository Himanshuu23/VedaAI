import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabs } from "./MobileTabs";

export function AppShell({
  children,
  title,
  back,
  showCreatePill,
}: {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
  showCreatePill?: boolean;
}) {
  return (
    <div className="min-h-screen bg-surface flex pb-20 md:pb-0">
      <Sidebar />
      <main className="flex-1 min-w-0 md:my-4 md:mr-4 md:ml-4 md:rounded-2xl md:bg-panel md:shadow-soft md:overflow-hidden flex flex-col">
        <TopBar title={title} back={back} showCreatePill={showCreatePill} />
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin bg-surface md:bg-panel">
          {children}
        </div>
      </main>
      <MobileTabs />
    </div>
  );
}