import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Download, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore, type Difficulty, type GeneratedPaper } from "@/lib/store";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const Route = createFileRoute("/assignments/output")({
  component: OutputPage,
});

const diffStyle: Record<Difficulty, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Challenging: "bg-rose-50 text-rose-700 border-rose-200",
};

function OutputPage() {
  const paper = useAppStore((s) => s.paper);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const jobProgress = useAppStore((s) => s.jobProgress);
  const jobStatus = useAppStore((s) => s.jobStatus);
  const generationError = useAppStore((s) => s.generationError);
  const currentAssignmentId = useAppStore((s) => s.currentAssignmentId);
  const connectWs = useAppStore((s) => s.connectWs);
  const regenerate = useAppStore((s) => s.regenerate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWs();
  }, [connectWs]);

  const fallback: GeneratedPaper = paper ?? {
    school: "VedaAI Assessment",
    subject: "",
    className: "",
    timeAllowed: "",
    maxMarks: 0,
    sections: [],
    answerKey: [],
  };

  const downloadPdf = async () => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    let position = 0;
    let heightLeft = h;
    pdf.addImage(img, "PNG", 0, position, w, h);
    heightLeft -= pdf.internal.pageSize.getHeight();
    while (heightLeft > 0) {
      position = heightLeft - h;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, w, h);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    pdf.save(`${fallback.subject || "assessment"}-question-paper.pdf`);
  };

  return (
    <AppShell showCreatePill>
      <div className="px-4 md:px-8 py-5 md:py-7 pb-32 max-w-4xl mx-auto w-full">
        {/* AI banner */}
        <div className="rounded-2xl bg-ink text-white p-5 md:p-6 shadow-soft">
          <div className="flex items-start gap-3">
            <Sparkles className="size-5 text-brand mt-0.5 shrink-0" />
            <p className="text-sm md:text-[15px] leading-relaxed">
              {isGenerating
                ? `Generating your question paper… ${jobProgress}%`
                : paper
                  ? `Your ${fallback.subject} question paper for Class ${fallback.className} is ready!`
                  : generationError
                    ? "Generation failed. Please try again."
                    : "Waiting for generation to start…"}
            </p>
          </div>

          {/* Progress bar */}
          {isGenerating && (
            <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-brand h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {paper && (
              <button
                onClick={downloadPdf}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2 border border-white/15"
              >
                <Download className="size-4" />
                Download as PDF
              </button>
            )}
            {currentAssignmentId && !isGenerating && (
              <button
                onClick={regenerate}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-4 py-2 border border-white/15"
              >
                <RefreshCw className="size-4" />
                Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isGenerating && (
          <div className="mt-6 rounded-2xl bg-panel border border-border p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-brand" />
            <p className="text-sm font-medium">
              AI is crafting your question paper ({jobProgress}%)
            </p>
            <p className="text-xs text-center max-w-xs">
              {jobStatus === "pending"
                ? "Queued — waiting for a worker…"
                : "Generating questions, structuring sections…"}
            </p>
          </div>
        )}

        {/* Error state */}
        {!isGenerating && generationError && !paper && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive text-center">
            {generationError}
          </div>
        )}

        {/* Paper */}
        {paper && (
          <div
            ref={ref}
            className="mt-6 rounded-2xl bg-panel border border-border p-6 md:p-10 text-ink"
          >
            <div className="text-center">
              <h1 className="text-lg md:text-xl font-bold">{fallback.school}</h1>
              <p className="mt-1 text-sm md:text-base">
                <span className="font-medium">Subject:</span> {fallback.subject}
              </p>
              <p className="text-sm md:text-base">
                <span className="font-medium">Class:</span> {fallback.className}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <p>
                <span className="font-medium">Time Allowed:</span>{" "}
                {fallback.timeAllowed}
              </p>
              <p>
                <span className="font-medium">Maximum Marks:</span>{" "}
                {fallback.maxMarks}
              </p>
            </div>
            <p className="mt-3 text-sm">
              All questions are compulsory unless stated otherwise.
            </p>

            <div className="mt-5 space-y-1 text-sm">
              <p>
                Name:{" "}
                <span className="inline-block min-w-[200px] border-b border-dotted border-ink/40 align-bottom" />
              </p>
              <p>
                Roll Number:{" "}
                <span className="inline-block min-w-[200px] border-b border-dotted border-ink/40 align-bottom" />
              </p>
              <p>
                Class: {fallback.className} Section:{" "}
                <span className="inline-block min-w-[120px] border-b border-dotted border-ink/40 align-bottom" />
              </p>
            </div>

            {fallback.sections.map((sec) => (
              <div key={sec.id} className="mt-8">
                <h2 className="text-center font-semibold text-base md:text-lg">
                  {sec.title}
                </h2>
                <h3 className="mt-4 font-semibold">{sec.heading || sec.title}</h3>
                <p className="italic text-sm text-muted-foreground">
                  {sec.instruction}
                </p>
                <ol className="mt-3 space-y-2 text-sm list-decimal pl-5">
                  {sec.questions.map((q, i) => (
                    <li key={q.id ?? i} className="leading-relaxed">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium mr-2 ${diffStyle[q.difficulty]}`}
                      >
                        {q.difficulty}
                      </span>
                      {q.text}{" "}
                      <span className="text-muted-foreground">
                        [{q.marks} Marks]
                      </span>
                      {q.options && q.options.length > 0 && (
                        <ol
                          type="A"
                          className="mt-1 ml-4 space-y-0.5 list-[upper-alpha]"
                        >
                          {q.options.map((opt, oi) => (
                            <li key={oi} className="text-ink/80">
                              {opt}
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            <p className="mt-6 font-medium">End of Question Paper</p>

            {fallback.answerKey.length > 0 && (
              <div className="mt-8 border-t border-dashed border-border pt-6">
                <h3 className="font-semibold">Answer Key:</h3>
                <ol className="mt-3 space-y-2 text-sm list-decimal pl-5">
                  {fallback.answerKey.map((a, i) => (
                    <li key={i} className="leading-relaxed">
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {!paper && !isGenerating && !generationError && (
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground text-center">
            No generated paper yet.{" "}
            <Link to="/assignments/new" className="text-brand font-medium">
              Create an assignment
            </Link>{" "}
            to generate one.
          </div>
        )}
      </div>
    </AppShell>
  );
}
