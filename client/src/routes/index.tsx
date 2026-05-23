import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppShell title="Home">
      <div className="grid place-items-center min-h-[70vh]">
        <EmptyState />
      </div>
    </AppShell>
  );
}
