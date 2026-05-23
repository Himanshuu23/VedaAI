import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { id: string; email: string; role: string };
}

export interface AssessmentJobData {
  assignmentId: string;
  userId: string;
  subject: string;
  grade: string;
  topic: string;
  instructions?: string;
  questionTypes: QuestionType[];
  difficulty: DifficultyDistribution;
  totalQuestions: number;
  totalMarks: number;
  dueDate: string;
  fileContent?: string;
}

export interface QuestionType {
  type: "mcq" | "short" | "long" | "truefalse" | "fillblank";
  count: number;
  marksEach: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: "mcq" | "short" | "long" | "truefalse" | "fillblank";
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  options?: string[];
  answer?: string;
}

export interface GeneratedSection {
  id: string;
  title: string;
  instruction: string;
  questions: GeneratedQuestion[];
  totalMarks: number;
}

export interface GeneratedPaper {
  title: string;
  subject: string;
  grade: string;
  totalMarks: number;
  duration: string;
  sections: GeneratedSection[];
  generatedAt: string;
}

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface WsMessage {
  type: "JOB_STATUS" | "JOB_PROGRESS" | "JOB_COMPLETED" | "JOB_FAILED";
  jobId: string;
  assignmentId?: string;
  status?: JobStatus;
  progress?: number;
  data?: GeneratedPaper;
  error?: string;
}
