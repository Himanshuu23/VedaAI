import { Response, NextFunction } from "express";
import fs from "fs";
import Assignment from "../../models/Assignment";
import { addAssessmentJob } from "../../queues/assessment.queue";
import { redisClient } from "../../config/redis";
import { AuthenticatedRequest } from "../../types";
import { createError } from "../../middlewares/error.middleware";

export const createAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const body = req.body;
    const file = req.file;

    let fileContent: string | undefined;
    let fileUrl: string | undefined;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      if (file.mimetype === "text/plain") {
        fileContent = fs.readFileSync(file.path, "utf-8");
      }
    }

    const totalMarks = body.questionTypes.reduce(
      (sum: number, qt: { count: number; marksEach: number }) =>
        sum + qt.count * qt.marksEach,
      0
    );

    const totalQuestions = body.questionTypes.reduce(
      (sum: number, qt: { count: number }) => sum + qt.count,
      0
    );

    const assignment = await Assignment.create({
      userId,
      title: body.title,
      subject: body.subject,
      grade: body.grade,
      topic: body.topic,
      instructions: body.instructions,
      questionTypes: body.questionTypes,
      difficulty: body.difficulty || { easy: 33, medium: 34, hard: 33 },
      totalQuestions,
      totalMarks,
      dueDate: new Date(body.dueDate),
      fileUrl,
      fileContent,
      jobStatus: "pending",
    });

    const jobId = await addAssessmentJob(
      {
        assignmentId: assignment.id as string,
        userId,
        subject: body.subject,
        grade: body.grade,
        topic: body.topic,
        instructions: body.instructions,
        questionTypes: body.questionTypes,
        difficulty: body.difficulty || { easy: 33, medium: 34, hard: 33 },
        totalQuestions,
        totalMarks,
        dueDate: body.dueDate,
        fileContent,
      },
      assignment.id as string
    );

    await assignment.updateOne({ jobId });

    res.status(201).json({
      success: true,
      assignmentId: assignment.id,
      jobId,
      message: "Assignment created and generation queued",
    });
  } catch (err) {
    next(err);
  }
};

export const getAssignments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      Assignment.find({ userId: req.user!.id })
        .select("-generatedPaper -fileContent")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments({ userId: req.user!.id }),
    ]);

    res.json({
      success: true,
      data: assignments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

export const getAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `assignment:${id}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), fromCache: true });
      return;
    }

    const assignment = await Assignment.findOne({ _id: id, userId: req.user!.id });
    if (!assignment) return next(createError("Assignment not found", 404));

    if (assignment.jobStatus === "completed") {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(assignment));
    }

    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

export const getAssignmentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne(
      { _id: id, userId: req.user!.id },
      { jobStatus: 1, jobProgress: 1, jobId: 1, errorMessage: 1 }
    );

    if (!assignment) return next(createError("Assignment not found", 404));

    res.json({
      success: true,
      data: {
        jobStatus: assignment.jobStatus,
        jobProgress: assignment.jobProgress,
        jobId: assignment.jobId,
        errorMessage: assignment.errorMessage,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const regenerateAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOne({ _id: id, userId: req.user!.id });
    if (!assignment) return next(createError("Assignment not found", 404));

    if (assignment.jobStatus === "processing") {
      return next(createError("Generation is already in progress", 409));
    }

    await assignment.updateOne({
      jobStatus: "pending",
      jobProgress: 0,
      generatedPaper: undefined,
      errorMessage: undefined,
    });

    await redisClient.del(`paper:${id}`);
    await redisClient.del(`assignment:${id}`);

    const jobId = await addAssessmentJob(
      {
        assignmentId: assignment.id as string,
        userId: req.user!.id,
        subject: assignment.subject,
        grade: assignment.grade,
        topic: assignment.topic,
        instructions: assignment.instructions,
        questionTypes: assignment.questionTypes,
        difficulty: assignment.difficulty,
        totalQuestions: assignment.totalQuestions,
        totalMarks: assignment.totalMarks,
        dueDate: assignment.dueDate.toISOString(),
        fileContent: assignment.fileContent,
      },
      `${assignment.id}-regen-${Date.now()}`
    );

    await assignment.updateOne({ jobId });

    res.json({ success: true, jobId, message: "Regeneration queued" });
  } catch (err) {
    next(err);
  }
};

export const deleteAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOneAndDelete({ _id: id, userId: req.user!.id });
    if (!assignment) return next(createError("Assignment not found", 404));

    await redisClient.del(`paper:${id}`);
    await redisClient.del(`assignment:${id}`);

    res.json({ success: true, message: "Assignment deleted" });
  } catch (err) {
    next(err);
  }
};
