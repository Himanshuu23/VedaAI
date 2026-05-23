import Anthropic from "@anthropic-ai/sdk";
import { AssessmentJobData, GeneratedPaper, GeneratedSection, GeneratedQuestion } from "../types";
import { v4 as uuidv4 } from "uuid";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const buildPrompt = (data: AssessmentJobData): string => {
  const qtSummary = data.questionTypes
    .filter((qt) => qt.count > 0)
    .map((qt) => `- ${qt.count} ${qt.type.toUpperCase()} questions (${qt.marksEach} marks each)`)
    .join("\n");

  return `You are an expert academic assessment designer. Generate a structured question paper as valid JSON only.

ASSIGNMENT DETAILS:
Subject: ${data.subject}
Grade/Class: ${data.grade}
Topic: ${data.topic}
Total Questions: ${data.totalQuestions}
Total Marks: ${data.totalMarks}
Difficulty Distribution: Easy ${data.difficulty.easy}%, Medium ${data.difficulty.medium}%, Hard ${data.difficulty.hard}%
Additional Instructions: ${data.instructions || "None"}

QUESTION TYPE BREAKDOWN:
${qtSummary}

${data.fileContent ? `REFERENCE MATERIAL:\n${data.fileContent.slice(0, 3000)}\n` : ""}

RULES:
1. Group questions into logical sections (Section A: MCQ, Section B: Short Answer, etc.)
2. Each section must have a clear title and instruction
3. Distribute difficulty according to the percentages given
4. Each question must have: id, text, type, difficulty (easy|medium|hard), marks
5. MCQ questions must include options array with 4 choices
6. Generate realistic, educationally appropriate questions for ${data.grade} level students
7. Total marks across all sections must equal ${data.totalMarks}

RESPOND WITH ONLY THIS JSON STRUCTURE (no markdown, no explanation):
{
  "title": "${data.subject} - ${data.topic} Assessment",
  "subject": "${data.subject}",
  "grade": "${data.grade}",
  "totalMarks": ${data.totalMarks},
  "duration": "estimated duration in minutes",
  "sections": [
    {
      "id": "section-uuid",
      "title": "Section A: Multiple Choice Questions",
      "instruction": "Choose the correct answer. Each question carries 1 mark.",
      "questions": [
        {
          "id": "question-uuid",
          "text": "question text here",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 1,
          "options": ["Option A", "Option B", "Option C", "Option D"]
        }
      ],
      "totalMarks": 10
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;
};

const parseAndValidate = (raw: string): GeneratedPaper => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error("Invalid paper structure: missing sections");
  }

  const sections: GeneratedSection[] = parsed.sections.map((sec: Record<string, unknown>) => {
    const questions: GeneratedQuestion[] = ((sec.questions as Record<string, unknown>[]) || []).map((q) => ({
      id: (q.id as string) || uuidv4(),
      text: (q.text as string) || "",
      type: (q.type as GeneratedQuestion["type"]) || "short",
      difficulty: (q.difficulty as GeneratedQuestion["difficulty"]) || "medium",
      marks: typeof q.marks === "number" ? q.marks : 1,
      options: Array.isArray(q.options) ? (q.options as string[]) : undefined,
      answer: q.answer as string | undefined,
    }));

    return {
      id: (sec.id as string) || uuidv4(),
      title: (sec.title as string) || "Section",
      instruction: (sec.instruction as string) || "Attempt all questions.",
      questions,
      totalMarks: typeof sec.totalMarks === "number" ? sec.totalMarks : questions.reduce((s, q) => s + q.marks, 0),
    };
  });

  return {
    title: (parsed.title as string) || "Assessment Paper",
    subject: (parsed.subject as string) || "",
    grade: (parsed.grade as string) || "",
    totalMarks: typeof parsed.totalMarks === "number" ? parsed.totalMarks : 0,
    duration: (parsed.duration as string) || "60 minutes",
    sections,
    generatedAt: (parsed.generatedAt as string) || new Date().toISOString(),
  };
};

export const generateAssessment = async (
  data: AssessmentJobData,
  onProgress?: (progress: number) => void
): Promise<GeneratedPaper> => {
  onProgress?.(10);

  const prompt = buildPrompt(data);

  onProgress?.(20);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  onProgress?.(80);

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI returned no text content");
  }

  const paper = parseAndValidate(textBlock.text);

  onProgress?.(100);

  return paper;
};
