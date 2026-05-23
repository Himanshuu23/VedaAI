import "dotenv/config";
import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import connectDB from "../config/db";
import { bullRedis, redisClient } from "../config/redis";
import { generateAssessment } from "../services/ai.service";
import Assignment from "../models/Assignment";
import { AssessmentJobData, WsMessage } from "../types";

const CACHE_TTL = 3600;

const publishWsMessage = async (userId: string, message: WsMessage): Promise<void> => {
  await redisClient.publish("ws:messages", JSON.stringify({ userId, message }));
};

const processAssessmentJob = async (job: Job<AssessmentJobData>): Promise<void> => {
  const { assignmentId, userId } = job.data;

  await Assignment.findByIdAndUpdate(assignmentId, {
    jobStatus: "processing",
    jobProgress: 0,
  });

  await publishWsMessage(userId, {
    type: "JOB_STATUS",
    jobId: job.id as string,
    assignmentId,
    status: "processing",
    progress: 0,
  });

  const paper = await generateAssessment(job.data, async (progress) => {
    await job.updateProgress(progress);
    await Assignment.findByIdAndUpdate(assignmentId, { jobProgress: progress });
    await publishWsMessage(userId, {
      type: "JOB_PROGRESS",
      jobId: job.id as string,
      assignmentId,
      progress,
    });
  });

  await Assignment.findByIdAndUpdate(assignmentId, {
    jobStatus: "completed",
    jobProgress: 100,
    generatedPaper: paper,
  });

  const cacheKey = `paper:${assignmentId}`;
  await redisClient.setex(cacheKey, CACHE_TTL, JSON.stringify(paper));

  await publishWsMessage(userId, {
    type: "JOB_COMPLETED",
    jobId: job.id as string,
    assignmentId,
    status: "completed",
    data: paper,
  });
};

const startWorker = async (): Promise<void> => {
  await connectDB();
  console.log("Assessment worker connected to DB");

  const worker = new Worker<AssessmentJobData>(
    "assessment-generation",
    processAssessmentJob,
    {
      connection: bullRedis,
      concurrency: 3,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);

    if (job?.data.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, {
        jobStatus: "failed",
        errorMessage: err.message,
      }).catch(() => null);

      await publishWsMessage(job.data.userId, {
        type: "JOB_FAILED",
        jobId: job.id as string,
        assignmentId: job.data.assignmentId,
        status: "failed",
        error: err.message,
      }).catch(() => null);
    }
  });

  const shutdown = async (): Promise<void> => {
    await worker.close();
    await mongoose.disconnect();
    await redisClient.quit();
    await bullRedis.quit();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("Assessment worker started");
};

startWorker().catch((err) => {
  console.error("Worker startup failed:", err);
  process.exit(1);
});
