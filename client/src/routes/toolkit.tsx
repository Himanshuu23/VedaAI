import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/toolkit")({
  component: () => (
    <ComingSoon
      title="AI Teacher's Toolkit"
      subtitle="Lesson planners, rubric builders, and grading helpers — arriving soon."
    />
  ),
});