import mongoose, { Document, Schema } from "mongoose";
import {
  QuestionType,
  DifficultyDistribution,
  GeneratedPaper,
  JobStatus,
} from "../types";

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  instructions?: string;
  questionTypes: QuestionType[];
  difficulty: DifficultyDistribution;
  totalQuestions: number;
  totalMarks: number;
  dueDate: Date;
  fileUrl?: string;
  fileContent?: string;
  jobId?: string;
  jobStatus: JobStatus;
  jobProgress: number;
  generatedPaper?: GeneratedPaper;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionTypeSchema = new Schema<QuestionType>(
  {
    type: {
      type: String,
      enum: ["mcq", "short", "long", "truefalse", "fillblank"],
      required: true,
    },
    count: { type: Number, required: true, min: 0 },
    marksEach: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const assignmentSchema = new Schema<IAssignment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
    questionTypes: { type: [questionTypeSchema], required: true },
    difficulty: {
      easy: { type: Number, default: 33 },
      medium: { type: Number, default: 34 },
      hard: { type: Number, default: 33 },
    },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    fileUrl: { type: String },
    fileContent: { type: String },
    jobId: { type: String, index: true },
    jobStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    jobProgress: { type: Number, default: 0 },
    generatedPaper: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
