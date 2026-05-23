import { create } from "zustand";
import { api } from "./api";
import { authStore } from "./auth";
import { vedaWs, type WsMessage } from "./ws";

export type Difficulty = "Easy" | "Moderate" | "Challenging";

export interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
  jobStatus: "pending" | "processing" | "completed" | "failed";
  jobProgress: number;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  difficulty: Difficulty;
  marks: number;
  type: string;
  options?: string[];
}

export interface GeneratedSection {
  id: string;
  title: string;
  heading: string;
  instruction: string;
  questions: GeneratedQuestion[];
  totalMarks: number;
}

export interface GeneratedPaper {
  school: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: GeneratedSection[];
  answerKey: string[];
}

export interface DraftState {
  fileName: string | null;
  fileObject: File | null;
  dueDate: string;
  subject: string;
  grade: string;
  topic: string;
  rows: QuestionTypeRow[];
  instructions: string;
}

interface AppState {
  assignments: Assignment[];
  draft: DraftState;
  paper: GeneratedPaper | null;
  currentAssignmentId: string | null;
  jobStatus: Assignment["jobStatus"] | null;
  jobProgress: number;
  isGenerating: boolean;
  generationError: string | null;

  setDraft: (patch: Partial<DraftState>) => void;
  addRow: () => void;
  updateRow: (id: string, patch: Partial<QuestionTypeRow>) => void;
  removeRow: (id: string) => void;
  resetDraft: () => void;

  generate: (navigate: (opts: { to: string }) => void) => Promise<void>;
  regenerate: () => Promise<void>;
  fetchAssignments: () => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  loadPaper: (assignmentId: string) => Promise<void>;
  connectWs: () => void;
  disconnectWs: () => void;
  _handleWsMessage: (msg: WsMessage) => void;
}

const defaultDraft: DraftState = {
  fileName: null,
  fileObject: null,
  dueDate: "",
  subject: "",
  grade: "",
  topic: "",
  rows: [
    { id: "r1", type: "Multiple Choice Questions", count: 4, marks: 1 },
    { id: "r2", type: "Short Questions", count: 3, marks: 2 },
    { id: "r3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
    { id: "r4", type: "Numerical Problems", count: 5, marks: 5 },
  ],
  instructions: "",
};

const QTYPE_MAP: Record<string, string> = {
  "Multiple Choice Questions": "mcq",
  "Short Questions": "short",
  "Long Questions": "long",
  "Diagram/Graph-Based Questions": "long",
  "Numerical Problems": "long",
  "True/False": "truefalse",
};

const difficultyMap = (d: string): Difficulty => {
  const lower = d.toLowerCase();
  if (lower === "easy") return "Easy";
  if (lower === "hard" || lower === "challenging") return "Challenging";
  return "Moderate";
};

const mapBackendPaper = (raw: unknown): GeneratedPaper => {
  const p = raw as {
    title?: string;
    subject?: string;
    grade?: string;
    duration?: string;
    totalMarks?: number;
    sections?: Array<{
      id?: string;
      title?: string;
      instruction?: string;
      totalMarks?: number;
      questions?: Array<{
        id?: string;
        text?: string;
        difficulty?: string;
        marks?: number;
        type?: string;
        options?: string[];
      }>;
    }>;
  };

  return {
    school: "VedaAI Assessment",
    subject: p.subject ?? "",
    className: p.grade ?? "",
    timeAllowed: p.duration ?? "60 minutes",
    maxMarks: p.totalMarks ?? 0,
    sections: (p.sections ?? []).map((sec, i) => ({
      id: sec.id ?? `sec-${i}`,
      title: sec.title ?? `Section ${String.fromCharCode(65 + i)}`,
      heading: sec.title ?? "",
      instruction: sec.instruction ?? "Attempt all questions.",
      totalMarks: sec.totalMarks ?? 0,
      questions: (sec.questions ?? []).map((q) => ({
        id: q.id ?? crypto.randomUUID(),
        text: q.text ?? "",
        difficulty: difficultyMap(q.difficulty ?? "medium"),
        marks: q.marks ?? 1,
        type: q.type ?? "short",
        options: q.options,
      })),
    })),
    answerKey: [],
  };
};

const fmt = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

export const useAppStore = create<AppState>((set, get) => ({
  assignments: [],
  draft: defaultDraft,
  paper: null,
  currentAssignmentId: null,
  jobStatus: null,
  jobProgress: 0,
  isGenerating: false,
  generationError: null,

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  addRow: () =>
    set((s) => ({
      draft: {
        ...s.draft,
        rows: [
          ...s.draft.rows,
          {
            id: `r${Date.now()}`,
            type: "Multiple Choice Questions",
            count: 1,
            marks: 1,
          },
        ],
      },
    })),

  updateRow: (id, patch) =>
    set((s) => ({
      draft: {
        ...s.draft,
        rows: s.draft.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    })),

  removeRow: (id) =>
    set((s) => ({
      draft: {
        ...s.draft,
        rows: s.draft.rows.filter((r) => r.id !== id),
      },
    })),

  resetDraft: () => set({ draft: defaultDraft }),

  generate: async (navigate) => {
    const { draft } = get();
    set({ isGenerating: true, generationError: null, jobProgress: 0 });

    try {
      const formData = new FormData();
      formData.append(
        "title",
        draft.topic || `${draft.subject} Assessment`,
      );
      formData.append("subject", draft.subject || "General");
      formData.append("grade", draft.grade || "8");
      formData.append("topic", draft.topic || draft.subject || "General");
      formData.append("dueDate", new Date(draft.dueDate || Date.now() + 7 * 86400000).toISOString());
      if (draft.instructions) formData.append("instructions", draft.instructions);

      const questionTypes = draft.rows
        .filter((r) => r.count > 0)
        .map((r) => ({
          type: QTYPE_MAP[r.type] ?? "short",
          count: r.count,
          marksEach: r.marks,
        }));
      formData.append("questionTypes", JSON.stringify(questionTypes));
      formData.append(
        "difficulty",
        JSON.stringify({ easy: 33, medium: 34, hard: 33 }),
      );

      if (draft.fileObject) {
        formData.append("file", draft.fileObject);
      }

      const token = authStore.getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/assignments`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        },
      );
      const data = (await res.json()) as { assignmentId: string; jobId: string };

      set({
        currentAssignmentId: data.assignmentId,
        jobStatus: "pending",
      });

      navigate({ to: "/assignments/output" });
    } catch (err) {
      set({
        isGenerating: false,
        generationError:
          err instanceof Error ? err.message : "Generation failed",
      });
    }
  },

  regenerate: async () => {
    const { currentAssignmentId } = get();
    if (!currentAssignmentId) return;

    set({
      isGenerating: true,
      generationError: null,
      paper: null,
      jobProgress: 0,
      jobStatus: "pending",
    });

    try {
      await api.post(`/api/assignments/${currentAssignmentId}/regenerate`, {});
    } catch (err) {
      set({
        isGenerating: false,
        generationError:
          err instanceof Error ? err.message : "Regeneration failed",
      });
    }
  },

  fetchAssignments: async () => {
    try {
      const res = await api.get<{
        success: boolean;
        data: Array<{
          _id: string;
          title: string;
          createdAt: string;
          dueDate: string;
          jobStatus: Assignment["jobStatus"];
          jobProgress: number;
        }>;
      }>("/api/assignments");

      const assignments: Assignment[] = res.data.map((a) => ({
        id: a._id,
        title: a.title,
        assignedOn: fmt(new Date(a.createdAt)),
        dueDate: fmt(new Date(a.dueDate)),
        jobStatus: a.jobStatus,
        jobProgress: a.jobProgress,
      }));

      set({ assignments });
    } catch {
      // keep existing list on error
    }
  },

  deleteAssignment: async (id) => {
    await api.delete(`/api/assignments/${id}`);
    set((s) => ({
      assignments: s.assignments.filter((a) => a.id !== id),
    }));
  },

  loadPaper: async (assignmentId) => {
    set({ currentAssignmentId: assignmentId });

    try {
      const res = await api.get<{
        success: boolean;
        data: { jobStatus: string; jobProgress: number; generatedPaper?: unknown };
      }>(`/api/assignments/${assignmentId}`);

      const d = res.data;
      set({
        jobStatus: d.jobStatus as Assignment["jobStatus"],
        jobProgress: d.jobProgress,
      });

      if (d.jobStatus === "completed" && d.generatedPaper) {
        set({
          paper: mapBackendPaper(d.generatedPaper),
          isGenerating: false,
        });
      } else if (d.jobStatus === "processing" || d.jobStatus === "pending") {
        set({ isGenerating: true });
      } else if (d.jobStatus === "failed") {
        set({ isGenerating: false, generationError: "Generation failed" });
      }
    } catch {
      set({ isGenerating: false, generationError: "Failed to load paper" });
    }
  },

  connectWs: () => {
    vedaWs.connect();
    vedaWs.subscribe(get()._handleWsMessage);
  },

  disconnectWs: () => {
    vedaWs.disconnect();
  },

  _handleWsMessage: (msg: WsMessage) => {
    const { currentAssignmentId } = get();
    if (msg.assignmentId && msg.assignmentId !== currentAssignmentId) return;

    if (msg.type === "JOB_PROGRESS") {
      set({ jobProgress: msg.progress ?? 0, isGenerating: true });
    } else if (msg.type === "JOB_COMPLETED") {
      const paper = msg.data ? mapBackendPaper(msg.data) : null;
      set({
        paper,
        isGenerating: false,
        jobStatus: "completed",
        jobProgress: 100,
      });
      get().fetchAssignments();
    } else if (msg.type === "JOB_FAILED") {
      set({
        isGenerating: false,
        jobStatus: "failed",
        generationError: msg.error ?? "Generation failed",
      });
    } else if (msg.type === "JOB_STATUS") {
      set({ jobStatus: (msg.status as Assignment["jobStatus"]) ?? null });
    }
  },
}));
