import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/settings")({
  component: () => (
    <ComingSoon
      title="Settings"
      subtitle="Manage your profile, school details, and preferences."
    />
  ),
});