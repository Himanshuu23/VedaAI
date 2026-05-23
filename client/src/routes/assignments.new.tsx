import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Minus,
  Mic,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/assignments/new")({
  component: NewAssignment,
});

const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
];

function NewAssignment() {
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.draft);
  const setDraft = useAppStore((s) => s.setDraft);
  const addRow = useAppStore((s) => s.addRow);
  const updateRow = useAppStore((s) => s.updateRow);
  const removeRow = useAppStore((s) => s.removeRow);
  const generate = useAppStore((s) => s.generate);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const generationError = useAppStore((s) => s.generationError);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const totals = useMemo(
    () =>
      draft.rows.reduce(
        (acc, r) => ({
          q: acc.q + (r.count || 0),
          m: acc.m + (r.count || 0) * (r.marks || 0),
        }),
        { q: 0, m: 0 },
      ),
    [draft.rows],
  );

  const validate = () => {
    const errs: string[] = [];
    if (!draft.dueDate) errs.push("Due date is required");
    if (!draft.subject) errs.push("Subject is required");
    if (!draft.topic) errs.push("Topic is required");
    if (draft.rows.length === 0) errs.push("Add at least one question type");
    draft.rows.forEach((r, i) => {
      if (!r.count || r.count <= 0)
        errs.push(`Row ${i + 1}: questions must be > 0`);
      if (!r.marks || r.marks <= 0)
        errs.push(`Row ${i + 1}: marks must be > 0`);
    });
    setErrors(errs);
    return errs.length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    await generate(navigate);
  };

  return (
    <AppShell title="Assignment">
      <div className="px-4 md:px-10 py-5 md:py-7 pb-32 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex size-3 rounded-full bg-[#4BC26D] animate-pulse-ring" />
          <h1 className="text-xl md:text-2xl font-semibold text-ink">
            Create Assignment
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-6">
          Set up a new assignment for your students
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="h-1 rounded-full bg-ink" />
          <div className="h-1 rounded-full bg-border" />
        </div>

        <div className="mt-6 rounded-2xl bg-panel border border-border p-5 md:p-8 shadow-soft">
          <h2 className="text-base md:text-lg font-semibold text-ink">
            Assignment Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Basic information about your assignment
          </p>

          {/* Subject + Grade + Topic */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-ink">Subject</label>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => setDraft({ subject: e.target.value })}
                placeholder="e.g. Science"
                className="mt-2 w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                Grade / Class
              </label>
              <input
                type="text"
                value={draft.grade}
                onChange={(e) => setDraft({ grade: e.target.value })}
                placeholder="e.g. 8"
                className="mt-2 w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Topic</label>
              <input
                type="text"
                value={draft.topic}
                onChange={(e) => setDraft({ topic: e.target.value })}
                placeholder="e.g. Electricity"
                className="mt-2 w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>

          {/* File upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-5 w-full rounded-xl border border-dashed border-border bg-secondary/40 py-8 flex flex-col items-center text-center hover:bg-secondary transition-colors"
          >
            <div className="size-10 rounded-full bg-panel border border-border grid place-items-center mb-3">
              <UploadCloud className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-ink">
              {draft.fileName ?? "Choose a file or drag & drop it here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, TXT, DOC up to 10MB
            </p>
            <span className="mt-4 inline-flex items-center rounded-full border border-border bg-panel text-ink text-xs font-medium px-3 py-1.5">
              Browse Files
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setDraft({
                  fileName: file?.name ?? null,
                  fileObject: file,
                });
              }}
            />
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Upload reference material for better question generation
          </p>

          {/* Due Date */}
          <div className="mt-6">
            <label className="text-sm font-medium text-ink">Due Date</label>
            <div className="relative mt-2">
              <input
                type="text"
                value={draft.dueDate}
                onFocus={(e) => (e.currentTarget.type = "date")}
                onBlur={(e) => {
                  if (!e.currentTarget.value) e.currentTarget.type = "text";
                }}
                onChange={(e) => setDraft({ dueDate: e.target.value })}
                placeholder="DD-MM-YYYY"
                className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Question type table */}
          <div className="mt-6">
            <div className="hidden md:grid grid-cols-[1fr_140px_140px_24px] gap-3 text-sm font-medium text-ink pb-2">
              <span>Question Type</span>
              <span className="text-center">No. of Questions</span>
              <span className="text-center">Marks</span>
              <span />
            </div>

            <div className="flex flex-col gap-3">
              {draft.rows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_24px] gap-3 items-stretch md:items-center"
                >
                  <div className="relative">
                    <select
                      value={row.type}
                      onChange={(e) =>
                        updateRow(row.id, { type: e.target.value })
                      }
                      className="w-full appearance-none rounded-xl border border-border bg-panel px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>

                  <div className="md:hidden grid grid-cols-2 gap-3">
                    <Stepper
                      label="No. of Questions"
                      value={row.count}
                      onChange={(v) => updateRow(row.id, { count: v })}
                    />
                    <Stepper
                      label="Marks"
                      value={row.marks}
                      onChange={(v) => updateRow(row.id, { marks: v })}
                    />
                  </div>

                  <div className="hidden md:block">
                    <Stepper
                      value={row.count}
                      onChange={(v) => updateRow(row.id, { count: v })}
                    />
                  </div>
                  <div className="hidden md:block">
                    <Stepper
                      value={row.marks}
                      onChange={(v) => updateRow(row.id, { marks: v })}
                    />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="self-center text-muted-foreground hover:text-destructive justify-self-end"
                    aria-label="Remove row"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-white text-sm font-medium px-4 py-2"
            >
              <Plus className="size-4" />
              Add Question Type
            </button>

            <div className="mt-4 text-right text-sm text-ink space-y-1">
              <p>
                <span className="text-muted-foreground">Total Questions :</span>{" "}
                <span className="font-semibold">{totals.q}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Total Marks :</span>{" "}
                <span className="font-semibold">{totals.m}</span>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6">
            <label className="text-sm font-medium text-ink">
              Additional information (For better output)
            </label>
            <div className="relative mt-2">
              <textarea
                value={draft.instructions}
                onChange={(e) => setDraft({ instructions: e.target.value })}
                rows={3}
                placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                className="w-full rounded-xl border border-border bg-panel px-4 py-3 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
              />
              <button className="absolute right-3 bottom-3 size-7 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground">
                <Mic className="size-4" />
              </button>
            </div>
          </div>

          {/* Errors */}
          {(errors.length > 0 || generationError) && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive space-y-1">
              {errors.map((e) => (
                <p key={e}>• {e}</p>
              ))}
              {generationError && <p>• {generationError}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/assignments" })}
            className="inline-flex items-center gap-2 rounded-full bg-panel border border-border text-ink text-sm font-medium px-5 py-2.5"
          >
            <ArrowLeft className="size-4" />
            Previous
          </button>
          <button
            onClick={onSubmit}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-full bg-ink text-white text-sm font-medium px-5 py-2.5 disabled:opacity-60"
          >
            {isGenerating ? "Submitting..." : "Next"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
      <div className="flex items-center justify-between rounded-xl border border-border bg-panel px-2 py-2">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="size-6 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="text-sm font-medium text-ink tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="size-6 grid place-items-center rounded-md hover:bg-secondary text-muted-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
