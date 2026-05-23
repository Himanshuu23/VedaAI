import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, Users, BookOpen, Sparkles, FileText } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: LayoutGrid, real: true },
  { to: "/assignments", label: "Assignments", icon: FileText, real: true },
  { to: "/groups", label: "My Groups", icon: Users, real: true },
  { to: "/library", label: "Library", icon: BookOpen, real: true },
  { to: "/toolkit", label: "AI Toolkit", icon: Sparkles, real: true },
] as const;

export function MobileTabs() {
  const location = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink text-white rounded-t-2xl">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active =
            t.to === "/" ? location.pathname === "/" : location.pathname.startsWith(t.to);
          const cls = `flex flex-col items-center justify-center gap-1 py-3 text-[10px] ${
            active ? "text-white" : "text-white/55"
          }`;
          const inner = (
            <>
              <span className={`grid place-items-center size-8 rounded-lg ${active ? "bg-white/10" : ""}`}>
                <Icon className="size-[18px]" />
              </span>
              {t.label}
            </>
          );
          return (
            <li key={t.to}>
              {t.real ? (
                <Link to={t.to} className={cls}>{inner}</Link>
              ) : (
                <a href="#" onClick={(e) => e.preventDefault()} className={cls}>{inner}</a>
              )}
            </li>
          );
        })}
      </ul>
      <div className="h-1 w-1/3 mx-auto bg-white/70 rounded-full mb-1.5" />
    </nav>
  );
}