import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, LayoutGrid, LogOut, Settings, User } from "lucide-react";

export function TopBar({
  title = "Assignment",
  back,
  showCreatePill,
}: {
  title?: string;
  back?: boolean;
  showCreatePill?: boolean;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-border/70 bg-surface">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.history.back()}
          className="size-9 grid place-items-center rounded-full hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        {showCreatePill ? (
          <Link
            to="/assignments/new"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-secondary text-muted-foreground text-sm px-3 py-1.5"
          >
            <span className="text-brand">＋</span> Create New
          </Link>
        ) : (
          <>
            <div className="size-9 grid place-items-center rounded-md bg-secondary">
              <LayoutGrid className="size-4 text-muted-foreground" />
            </div>
            <span className={`text-sm font-medium ${back ? "text-brand" : "text-muted-foreground"}`}>
              {title}
            </span>
          </>
        )}
      </div>
      <div ref={menuRef} className="flex items-center gap-2 relative">
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setMenuOpen(false); }}
            className="relative size-9 grid place-items-center rounded-full hover:bg-secondary"
          >
            <Bell className="size-[18px] text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brand" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-border bg-panel shadow-pop p-3 animate-fade-in">
              <p className="text-sm font-medium text-ink px-1">Notifications</p>
              <div className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                You have no new notifications.
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => { setMenuOpen((v) => !v); setNotifOpen(false); }}
          className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-secondary cursor-pointer"
        >
          <div className="size-7 rounded-full bg-gradient-brand grid place-items-center text-white text-xs font-semibold">
            JD
          </div>
          <span className="text-sm font-medium text-ink hidden sm:inline">John Doe</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-border bg-panel shadow-pop overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-ink">John Doe</p>
              <p className="text-xs text-muted-foreground">john.doe@vedaai.com</p>
            </div>
            <MenuItem icon={User} label="My Profile" />
            <MenuItem icon={Settings} label="Settings" />
            <div className="border-t border-border">
              <MenuItem icon={LogOut} label="Log out" danger />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  danger,
}: {
  icon: typeof Bell;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary ${
        danger ? "text-destructive" : "text-ink"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}