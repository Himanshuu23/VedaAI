import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <AppShell title={title}>
      <div className="grid place-items-center min-h-[70vh] px-6 text-center">
        <div>
          <div className="mx-auto size-16 rounded-2xl bg-gradient-brand grid place-items-center text-white shadow-soft">
            <Sparkles className="size-7" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{subtitle}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" /> Coming soon
          </span>
        </div>
      </div>
    </AppShell>
  );
}