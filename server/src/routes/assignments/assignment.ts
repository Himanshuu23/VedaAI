import { Router } from "express";
import { z } from "zod";
import {
  createAssignment,
  getAssignments,
  getAssignment,
  getAssignmentStatus,
  regenerateAssignment,
  deleteAssignment,
} from "../../controllers/assignments/assignment.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();

router.use(authenticate);

const questionTypeSchema = z.object({
  type: z.enum(["mcq", "short", "long", "truefalse", "fillblank"]),
  count: z.number().int().min(0),
  marksEach: z.number().int().min(1),
});

const difficultySchema = z.object({
  easy: z.number().min(0).max(100),
  medium: z.number().min(0).max(100),
  hard: z.number().min(0).max(100),
});

const createAssignmentSchema = z
  .object({
    title: z.string().min(3).max(200),
    subject: z.string().min(2).max(100),
    grade: z.string().min(1).max(50),
    topic: z.string().min(3).max(200),
    instructions: z.string().max(1000).optional(),
    questionTypes: z
      .array(questionTypeSchema)
      .min(1)
      .refine((types) => types.some((t) => t.count > 0), {
        message: "At least one question type must have count > 0",
      }),
    difficulty: difficultySchema.optional(),
    dueDate: z.string().refine((d) => new Date(d) > new Date(), {
      message: "Due date must be in the future",
    }),
  });

router.post("/", upload.single("file"), (req, _res, next) => {
  if (req.body.questionTypes && typeof req.body.questionTypes === "string") {
    req.body.questionTypes = JSON.parse(req.body.questionTypes);
  }
  if (req.body.difficulty && typeof req.body.difficulty === "string") {
    req.body.difficulty = JSON.parse(req.body.difficulty);
  }
  next();
}, validate(createAssignmentSchema), createAssignment);

router.get("/", getAssignments);
router.get("/:id", getAssignment);
router.get("/:id/status", getAssignmentStatus);
router.post("/:id/regenerate", regenerateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
