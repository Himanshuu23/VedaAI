import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/groups")({
  component: () => (
    <ComingSoon
      title="My Groups"
      subtitle="Organise your classes and student cohorts. This space is being polished."
    />
  ),
});