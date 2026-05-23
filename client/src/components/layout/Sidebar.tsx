import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Users, FileText, BookOpen, Clock, Settings, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { useAppStore } from "@/lib/store";

const nav = [
  { to: "/", label: "Home", icon: LayoutGrid, real: true },
  { to: "/groups", label: "My Groups", icon: Users, real: true },
  { to: "/assignments", label: "Assignments", icon: FileText, real: true },
  { to: "/toolkit", label: "AI Teacher's Toolkit", icon: BookOpen, real: true },
  { to: "/library", label: "My Library", icon: Clock, real: true },
] as const;

export function Sidebar() {
  const location = useLocation();
  const assignments = useAppStore((s) => s.assignments);

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-[calc(100vh-32px)] sticky top-4 ml-4 bg-panel rounded-2xl shadow-soft p-4">
      <div className="px-2 pt-1 pb-4">
        <Wordmark />
      </div>

      <Link
        to="/assignments/new"
        className="flex items-center justify-center gap-2 rounded-full bg-ink text-white text-sm font-medium py-2.5 px-4 ring-brand-soft transition-transform active:scale-[0.98]"
      >
        <Sparkles className="size-4" />
        Create Assignment
      </Link>

      <nav className="mt-6 flex flex-col gap-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
          const badge = item.to === "/assignments" && assignments.length > 0 ? assignments.length : null;
          const className = `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-secondary text-ink font-medium"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-ink"
              }`;
          const content = (
            <>
              <Icon className="size-[18px]" />
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="rounded-full bg-brand text-white text-[11px] font-medium px-2 py-0.5">
                  {badge}
                </span>
              )}
            </>
          );
          return item.real ? (
            <Link key={item.to} to={item.to} className={className}>
              {content}
            </Link>
          ) : (
            <a key={item.to} href="#" onClick={(e) => e.preventDefault()} className={className}>
              {content}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-ink"
        >
          <Settings className="size-[18px]" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-border/70 p-2.5">
          <div className="size-10 rounded-full bg-gradient-brand grid place-items-center text-white text-sm font-semibold">
            DP
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">Delhi Public School</p>
            <p className="text-xs text-muted-foreground truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}