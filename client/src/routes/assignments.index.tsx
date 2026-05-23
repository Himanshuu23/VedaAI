import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Filter, MoreVertical, Plus, Search, Trash2, Eye } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/assignments/")({
  component: AssignmentsPage,
});

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
};

function AssignmentsPage() {
  const assignments = useAppStore((s) => s.assignments);
  const fetchAssignments = useAppStore((s) => s.fetchAssignments);
  const deleteAssignment = useAppStore((s) => s.deleteAssignment);
  const loadPaper = useAppStore((s) => s.loadPaper);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell title="Assignment">
      {assignments.length === 0 ? (
        <div className="grid place-items-center min-h-[70vh]">
          <EmptyState />
        </div>
      ) : (
        <div className="px-4 md:px-8 py-5 md:py-7 pb-32">
          <div className="flex items-center gap-3 mb-1">
            <span className="relative inline-flex size-3 rounded-full bg-[#4BC26D] animate-pulse-ring" />
            <h1 className="text-xl md:text-2xl font-semibold text-ink">
              Assignments
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6 ml-6">
            Manage and create assignments for your classes
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground rounded-full bg-panel border border-border px-4 py-2 w-fit">
              <Filter className="size-4" />
              Filter By
            </button>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Assignment"
                className="w-full rounded-full bg-panel border border-border pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="relative rounded-2xl bg-panel border border-border p-5 hover:shadow-soft transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink underline-offset-4 underline decoration-ink/40">
                      {a.title}
                    </h3>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadge[a.jobStatus] ?? ""}`}
                    >
                      {a.jobStatus}
                      {a.jobStatus === "processing" &&
                        ` ${a.jobProgress}%`}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === a.id ? null : a.id)
                    }
                    className="size-7 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>
                <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-ink/80">
                      Assigned on
                    </span>{" "}
                    : {a.assignedOn}
                  </span>
                  <span>
                    <span className="font-medium text-ink/80">Due</span> :{" "}
                    {a.dueDate}
                  </span>
                </div>

                {openMenu === a.id && (
                  <div className="absolute right-4 top-12 z-10 w-44 rounded-xl border border-border bg-panel shadow-pop overflow-hidden">
                    <Link
                      to="/assignments/output"
                      onClick={() => {
                        loadPaper(a.id);
                        setOpenMenu(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-secondary"
                    >
                      <Eye className="size-4" /> View Assignment
                    </Link>
                    <button
                      onClick={async () => {
                        await deleteAssignment(a.id);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <Link
          to="/assignments/new"
          className="fixed md:absolute bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 rounded-full bg-ink text-white text-sm font-medium py-3 px-5 shadow-pop"
        >
          <Plus className="size-4" />
          Create Assignment
        </Link>
      )}
    </AppShell>
  );
}
