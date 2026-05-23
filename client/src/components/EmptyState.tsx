import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import emptyArt from "@/assets/no-assignment.svg";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10 md:py-16">
      <img src={emptyArt} alt="No assignments" className="w-64 md:w-72 h-auto" />
      <h2 className="mt-4 text-lg md:text-xl font-semibold text-ink">No assignments yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Create your first assignment to start collecting and grading student submissions.
      </p>
      <Link
        to="/assignments/new"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink text-white text-sm font-medium py-3 px-5 shadow-soft active:scale-[0.98] transition-transform"
      >
        <Plus className="size-4" />
        Create Your First Assignment
      </Link>
    </div>
  );
}